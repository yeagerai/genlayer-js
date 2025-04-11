import * as calldata from "@/abi/calldata";
import {serialize, serializeOne} from "@/abi/transactions";
import {
  Account,
  ContractSchema,
  SimulatorChain,
  GenLayerClient,
  CalldataEncodable,
  Address,
  TransactionStatus,
} from "@/types";
import {fromHex, toHex, zeroAddress, encodeFunctionData} from "viem";

function makeCalldataObject(
  method: string | undefined,
  args: CalldataEncodable[] | undefined,
  kwargs: {[key: string]: CalldataEncodable} | Map<string, CalldataEncodable> | undefined,
): CalldataEncodable {
  // this method omits args or kwargs if they are empty
  // it reduces transaction size
  let ret: {[key: string]: CalldataEncodable} = {};

  if (method) {
    ret["method"] = method;
  }

  if (args && args.length > 0) {
    ret["args"] = args;
  }

  if (kwargs) {
    if (kwargs instanceof Map) {
      if (kwargs.size > 0) {
        ret["kwargs"] = kwargs;
      }
    } else {
      let hasVal = false;
      for (const _k in kwargs) {
        hasVal = true;
        break;
      }
      if (hasVal) {
        ret["kwargs"] = kwargs;
      }
    }
  }

  return ret;
}

export const contractActions = (client: GenLayerClient<SimulatorChain>) => {
  return {
    getContractSchema: async (address: string): Promise<ContractSchema> => {
      const schema = (await client.request({
        method: "gen_getContractSchema",
        params: [address],
      })) as string;
      return schema as unknown as ContractSchema;
    },
    getContractSchemaForCode: async (contractCode: string | Uint8Array): Promise<ContractSchema> => {
      const schema = (await client.request({
        method: "gen_getContractSchemaForCode",
        params: [toHex(contractCode)],
      })) as string;
      return schema as unknown as ContractSchema;
    },
  };
};

export const overrideContractActions = (client: GenLayerClient<SimulatorChain>) => {
  client.readContract = async <RawReturn extends boolean | undefined>(args: {
    account?: Account;
    address: Address;
    functionName: string;
    args?: CalldataEncodable[];
    kwargs?: Map<string, CalldataEncodable> | {[key: string]: CalldataEncodable};
    stateStatus?: TransactionStatus;
    rawReturn?: RawReturn;
  }): Promise<RawReturn extends true ? `0x${string}` : CalldataEncodable> => {
    const {
      account,
      address,
      functionName,
      args: callArgs,
      kwargs,
      stateStatus = TransactionStatus.ACCEPTED,
    } = args;
    const encodedData = calldata.encode(makeCalldataObject(functionName, callArgs, kwargs));
    const serializedData = serializeOne(encodedData);

    const senderAddress = account?.address ?? client.account?.address;

    const requestParams = {
      to: address,
      from: senderAddress,
      data: serializedData,
    };
    const result = await client.request({
      method: "eth_call",
      params: [requestParams, stateStatus == TransactionStatus.FINALIZED ? "finalized" : "latest"],
    });

    if (args.rawReturn) {
      return result;
    }
    const resultBinary = fromHex(result, "bytes");
    return calldata.decode(resultBinary) as any;
  };

  client.writeContract = async (args: {
    account?: Account;
    address: Address;
    functionName: string;
    args?: CalldataEncodable[];
    kwargs?: Map<string, CalldataEncodable> | {[key: string]: CalldataEncodable};
    value: bigint;
    leaderOnly?: boolean;
    consensusMaxRotations?: number;
  }): Promise<`0x${string}`> => {
    const {account, address, functionName, args: callArgs, kwargs, value = 0n, leaderOnly = false, consensusMaxRotations = client.chain.defaultConsensusMaxRotations} = args;
    const data = [calldata.encode(makeCalldataObject(functionName, callArgs, kwargs)), leaderOnly];
    const serializedData = serialize(data);
    return _sendTransaction({
      recipient: address,
      data: serializedData,
      senderAccount: account || client.account,
      consensusMaxRotations,
      value,
      appeal: false
    });
  };

  client.deployContract = async (args: {
    account?: Account;
    code: string | Uint8Array;
    args?: CalldataEncodable[];
    kwargs?: Map<string, CalldataEncodable> | {[key: string]: CalldataEncodable};
    leaderOnly?: boolean;
    consensusMaxRotations?: number;
  }) => {
    const {account, code, args: constructorArgs, kwargs, leaderOnly = false, consensusMaxRotations = client.chain.defaultConsensusMaxRotations} = args;
    const data = [code, calldata.encode(makeCalldataObject(undefined, constructorArgs, kwargs)), leaderOnly];
    const serializedData = serialize(data);
    return _sendTransaction({
      recipient: zeroAddress,
      data: serializedData,
      senderAccount: account || client.account,
      consensusMaxRotations,
      appeal: false
    });
  };

  client.appealTransaction = async (args: {
    account?: Account;
    txId: `0x${string}`;
  }) => {
    const {account, txId} = args;
    return _sendTransaction({
      senderAccount: account || client.account,
      appeal: true,
      txId
    });
  };

  const _sendTransaction = async ({
    recipient,
    data,
    senderAccount,
    consensusMaxRotations,
    value,
    appeal = false,
    txId
  }: {
    recipient?: `0x${string}`,
    data?: `0x${string}`,
    senderAccount?: Account,
    consensusMaxRotations?: number,
    value?: bigint,
    appeal?: boolean,
    txId?: `0x${string}`
  }) => {
    if (!senderAccount) {
      throw new Error(
        "No account set. Configure the client with an account or pass an account to this function.",
      );
    }

    if (!client.chain.consensusMainContract?.address) {
      throw new Error(
        "Consensus main contract not initialized. Please ensure client is properly initialized.",
      );
    }

    let encodedData: `0x${string}`;
    if (appeal) {
      encodedData = encodeFunctionData({
        abi: client.chain.consensusMainContract?.abi as any,
        functionName: "submitAppeal",
        args: [
          txId,
        ],
      });
    } else {
      encodedData = encodeFunctionData({
        abi: client.chain.consensusMainContract?.abi as any,
        functionName: "addTransaction",
        args: [
          senderAccount.address,
          recipient,
          client.chain.defaultNumberOfInitialValidators,
          consensusMaxRotations,
          data,
        ],
      });
    }

    const nonce = await client.getCurrentNonce({address: senderAccount.address});
    const transactionRequest = await client.prepareTransactionRequest({
      account: senderAccount,
      to: client.chain.consensusMainContract?.address as Address,
      data: encodedData,
      type: "legacy",
      nonce,
      value: value ?? 0n,
    });

    if (senderAccount?.type !== "local") {
      const formattedRequest = {
        from: transactionRequest.from,
        to: transactionRequest.to,
        data: encodedData,
        value: transactionRequest.value ? `0x${transactionRequest.value.toString(16)}` : "0x0",
      };

      return await client.request({
        method: "eth_sendTransaction",
        params: [formattedRequest as any],
      });
    }

    if (!senderAccount?.signTransaction) {
      throw new Error("Account does not support signTransaction");
    }

    const serializedTransaction = await senderAccount.signTransaction(transactionRequest);

    return client.sendRawTransaction({serializedTransaction: serializedTransaction});
  };

  return client;
};
