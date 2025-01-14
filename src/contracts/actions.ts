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
import { fromHex, toHex } from "viem";

function makeCalldataObject(method: string | undefined, args: CalldataEncodable[] | undefined, kwargs: {[key: string]: CalldataEncodable} | Map<string, CalldataEncodable> | undefined): CalldataEncodable {
  // this method omits args or kwargs if they are empty
  // it reduces transaction size
  let ret: {[key: string]: CalldataEncodable} = {}

  if (method) {
    ret['method'] = method
  }

  if (args && args.length > 0) {
    ret['args'] = args
  }

  if (kwargs) {
    if (kwargs instanceof Map) {
      if (kwargs.size > 0) {
        ret['kwargs'] = kwargs
      }
    } else {
      let hasVal = false
      for (const _k in kwargs) {
        hasVal = true;
        break
      }
      if (hasVal) {
        ret['kwargs'] = kwargs
      }
    }
  }

  return ret
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
    kwargs?: Map<string, CalldataEncodable> | { [key: string]: CalldataEncodable }
    stateStatus?: TransactionStatus;
    rawReturn?: RawReturn;
  }): Promise<RawReturn extends true ? `0x${string}` : CalldataEncodable> => {
    const {account, address, functionName, args: callArgs, kwargs, stateStatus = TransactionStatus.ACCEPTED} = args;
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
      return result
    }
    const resultBinary = fromHex(result, "bytes")
    return calldata.decode(resultBinary) as any;
  };

  client.writeContract = async (args: {
    account?: Account;
    address: Address;
    functionName: string;
    args?: CalldataEncodable[];
    kwargs?: Map<string, CalldataEncodable> | { [key: string]: CalldataEncodable }
    value: bigint;
    leaderOnly?: boolean;
  }): Promise<`0x${string}`> => {
    const {account, address, functionName, args: callArgs, kwargs, value = 0n, leaderOnly = false} = args;
    const data = [calldata.encode(makeCalldataObject(functionName, callArgs, kwargs)), leaderOnly];
    const serializedData = serialize(data);
    const senderAccount = account || client.account;

    if (senderAccount?.type !== "local") {
      const transaction = {
        from: senderAccount?.address,
        to: address,
        data: serializedData,
        value: `0x${value.toString(16)}`,
      };

      return await client.request({
        method: "eth_sendTransaction",
        params: [transaction as any],
      });
    }

    if (!senderAccount) {
      throw new Error(
        "No account set. Configure the client with an account or pass an account to this function.",
      );
    }

    if (!senderAccount?.signTransaction) {
      throw new Error("Account does not support signTransaction");
    }

    const nonce = await client.getCurrentNonce({address: senderAccount.address});

    const signedTransaction = await senderAccount.signTransaction({
      data: serializedData,
      to: address,
      value,
      type: "legacy",
      nonce,
    });

    return await client.request({
      method: "eth_sendRawTransaction",
      params: [signedTransaction],
    });
  };

  client.deployContract = async (args: {
    account?: Account;
    code: string | Uint8Array;
    args?: CalldataEncodable[];
    kwargs?: Map<string, CalldataEncodable> | { [key: string]: CalldataEncodable }
    leaderOnly?: boolean;
  }) => {
    const {account, code, args: constructorArgs, kwargs, leaderOnly = false} = args;
    const data = [code, calldata.encode(makeCalldataObject(undefined, constructorArgs, kwargs)), leaderOnly];
    const serializedData = serialize(data);
    const senderAccount = account || client.account;

    if (senderAccount?.type !== "local") {
      const transaction = {
        from: senderAccount?.address,
        to: null,
        data: serializedData,
        value: "0x0",
      };

      return await client.request({
        method: "eth_sendTransaction",
        params: [transaction as any],
      });
    }

    if (!senderAccount) {
      throw new Error(
        "No account set. Configure the client with an account or pass an account to this function.",
      );
    }

    if (!senderAccount?.signTransaction) {
      throw new Error("Account does not support signTransaction");
    }

    const nonce = await client.getCurrentNonce({address: senderAccount.address});

    const signedTransaction = await senderAccount.signTransaction({
      data: serializedData,
      type: "legacy",
      nonce,
    });

    return await client.request({
      method: "eth_sendRawTransaction",
      params: [signedTransaction],
    });
  };

  return client;
};
