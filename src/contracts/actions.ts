import {Transport, Account, Address} from "viem";

import {encode} from "@/abi/calldata/encoder";
import {ContractSchema, SimulatorChain, GenLayerClient, CalldataEncodable} from "@/types";

export const contractActions = (client: GenLayerClient<Transport, SimulatorChain, Account>) => {
  return {
    getContractSchema: async (address: string): Promise<ContractSchema> => {
      const schema = (await client.request({
        method: "gen_getContractSchema",
        params: [address],
      })) as string;
      return schema as unknown as ContractSchema;
    },
    getContractSchemaForCode: async (contractCode: string): Promise<ContractSchema> => {
      const schema = (await client.request({
        method: "gen_getContractSchemaForCode",
        params: [contractCode],
      })) as string;
      return schema as unknown as ContractSchema;
    },
  };
};

export const overrideContractActions = (client: GenLayerClient<Transport, SimulatorChain, Account>) => {
  client.readContract = async (args: {
    account: Account;
    address: Address;
    functionName: string;
    args: CalldataEncodable[];
  }): Promise<any> => {
    const {account, address, functionName, args: params} = args;
    const encodedData = encode({method: functionName, args: params});

    const requestParams = {
      to: address,
      from: account?.address || client.account?.address,
      data: encodedData,
    };
    const result = await client.request({
      method: "eth_call",
      params: [requestParams, "latest"],
    });
    return result;
  };

  client.writeContract = async (args: {
    account: Account;
    address: Address;
    functionName: string;
    args: CalldataEncodable[];
    value: bigint;
  }): Promise<any> => {
    const {account, address, functionName, args: params, value = 0n} = args;
    const encodedData = encode({method: functionName, args: params});

    const senderAccount = account || client.account;
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
      data: encodedData,
      to: address,
      value,
      type: "legacy",
      nonce,
    });
    const result = await client.request({
      method: "eth_sendRawTransaction",
      params: [signedTransaction],
    });
    return result;
  };

  return client;
};
