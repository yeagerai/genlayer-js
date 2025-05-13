import * as calldata from "@/abi/calldata";
import {serialize} from "@/abi/transactions";
import {localnet} from "@/chains/localnet";
import {Account, ContractSchema, GenLayerChain, GenLayerClient, CalldataEncodable, Address} from "@/types";
import {fromHex, toHex, zeroAddress, encodeFunctionData, PublicClient, parseEventLogs} from "viem";

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

export const contractActions = (client: GenLayerClient<GenLayerChain>, publicClient: PublicClient) => {
  return {
    getContractSchema: async (address: Address): Promise<ContractSchema> => {
      if (client.chain.id !== localnet.id) {
        throw new Error("Contract schema is not supported on this network");
      }
      const schema = (await client.request({
        method: "gen_getContractSchema",
        params: [address],
      })) as string;
      return schema as unknown as ContractSchema;
    },
    getContractSchemaForCode: async (contractCode: string | Uint8Array): Promise<ContractSchema> => {
      if (client.chain.id !== localnet.id) {
        throw new Error("Contract schema is not supported on this network");
      }
      const schema = (await client.request({
        method: "gen_getContractSchemaForCode",
        params: [toHex(contractCode)],
      })) as string;
      return schema as unknown as ContractSchema;
    },
    readContract: async <RawReturn extends boolean | undefined>(args: {
      account?: Account;
      address: Address;
      functionName: string;
      args?: CalldataEncodable[];
      kwargs?: Map<string, CalldataEncodable> | {[key: string]: CalldataEncodable};
      rawReturn?: RawReturn;
      leaderOnly?: boolean;
    }): Promise<RawReturn extends true ? `0x${string}` : CalldataEncodable> => {
      const {account, address, functionName, args: callArgs, kwargs, leaderOnly = false} = args;
      const encodedData = [calldata.encode(makeCalldataObject(functionName, callArgs, kwargs)), leaderOnly];
      const serializedData = serialize(encodedData);

      const senderAddress = account?.address ?? client.account?.address;

      const requestParams = {
        type: "read",
        to: address,
        from: senderAddress,
        data: serializedData,
        transaction_hash_variant: "latest-final",
      };
      const result = await client.request({
        method: "gen_call",
        params: [requestParams],
      });
      const prefixedResult = `0x${result}` as `0x${string}`;

      if (args.rawReturn) {
        return prefixedResult;
      }
      const resultBinary = fromHex(prefixedResult, "bytes");
      return calldata.decode(resultBinary) as any;
    },
    writeContract: async (args: {
      account?: Account;
      address: Address;
      functionName: string;
      args?: CalldataEncodable[];
      kwargs?: Map<string, CalldataEncodable> | {[key: string]: CalldataEncodable};
      value: bigint;
      leaderOnly?: boolean;
      consensusMaxRotations?: number;
    }): Promise<`0x${string}`> => {
      const {
        account,
        address,
        functionName,
        args: callArgs,
        kwargs,
        value = 0n,
        leaderOnly = false,
        consensusMaxRotations = client.chain.defaultConsensusMaxRotations,
      } = args;
      const data = [calldata.encode(makeCalldataObject(functionName, callArgs, kwargs)), leaderOnly];
      const serializedData = serialize(data);
      return _sendTransaction({
        client,
        publicClient,
        recipient: address,
        data: serializedData,
        senderAccount: account || client.account,
        consensusMaxRotations,
        value,
      });
    },
    deployContract: async (args: {
      account?: Account;
      code: string | Uint8Array;
      args?: CalldataEncodable[];
      kwargs?: Map<string, CalldataEncodable> | {[key: string]: CalldataEncodable};
      leaderOnly?: boolean;
      consensusMaxRotations?: number;
    }) => {
      const {
        account,
        code,
        args: constructorArgs,
        kwargs,
        leaderOnly = false,
        consensusMaxRotations = client.chain.defaultConsensusMaxRotations,
      } = args;
      const data = [
        code,
        calldata.encode(makeCalldataObject(undefined, constructorArgs, kwargs)),
        leaderOnly,
      ];
      const serializedData = serialize(data);
      return _sendTransaction({
        client,
        publicClient: publicClient,
        recipient: zeroAddress,
        data: serializedData,
        senderAccount: account || client.account,
        consensusMaxRotations,
      });
    },
  };
};

const _sendTransaction = async ({
  client,
  publicClient,
  recipient,
  data,
  senderAccount,
  consensusMaxRotations,
  value,
}: {
  client: GenLayerClient<GenLayerChain>;
  publicClient: PublicClient;
  recipient: `0x${string}`;
  data: `0x${string}`;
  senderAccount?: Account;
  consensusMaxRotations?: number;
  value?: bigint;
}) => {
  if (!senderAccount) {
    throw new Error(
      "No account set. Configure the client with an account or pass an account to this function.",
    );
  }

  if (!client.chain.consensusMainContract?.address) {
    throw new Error("Consensus main contract not initialized. Please ensure client is properly initialized.");
  }

  const encodedData = encodeFunctionData({
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

  const nonce = await client.getCurrentNonce({address: senderAccount.address});
  const transactionRequest = await client.prepareTransactionRequest({
    account: senderAccount,
    to: client.chain.consensusMainContract?.address as Address,
    data: encodedData,
    type: "legacy",
    nonce: Number(nonce),
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

  const txHash = await client.sendRawTransaction({serializedTransaction: serializedTransaction});

  // TODO: remove this once DXP-298 is merged
  if (client.chain.id === localnet.id) {
    return txHash;
  }

  const receipt = await publicClient.waitForTransactionReceipt({hash: txHash});

  if (receipt.status === "reverted") {
    throw new Error("Transaction reverted");
  }

  const newTxEvents = parseEventLogs({
    abi: client.chain.consensusMainContract?.abi as any,
    eventName: "NewTransaction",
    logs: receipt.logs,
  }) as unknown as {args: {txId: `0x${string}`}}[];

  if (newTxEvents.length === 0) {
    throw new Error("Transaction not processed by consensus");
  }

  return newTxEvents[0].args["txId"];
};
