import {toRlp, toHex, Transport, Account, Address} from "viem";

import {ContractSchema, SimulatorChain, GenLayerClient} from "@/types";
import {createAccount} from "@/accounts/account";

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
  client.readContract = async (args: {address: Address; functionName: string; args: any[]}): Promise<any> => {
    const {address, functionName, args: params} = args;
    const methodParamsAsString = JSON.stringify(params);
    const data = [functionName, methodParamsAsString];
    const encodedData = toRlp(data.map(param => toHex(param)));

    const requestParams = {
      to: address,
      from: client.account?.address,
      data: encodedData,
    };
    const result = await client.request({
      method: "eth_call",
      params: [requestParams, "latest"],
    });
    return result;
  };

  client.writeContract = async (args: {
    address: Address;
    functionName: string;
    args: any[];
    value: bigint;
  }): Promise<any> => {
    const {address, functionName, args: params, value = 0n} = args;
    const methodParamsAsString = JSON.stringify(params);
    const data = [functionName, methodParamsAsString];
    const encodedData = toRlp(data.map(param => toHex(param)));

    const account = client.account ?? createAccount();
    if (!account.signTransaction) {
      throw new Error("Account does not support signTransaction");
    }

    const signedTransaction = await account.signTransaction({
      data: encodedData,
      to: address,
      value,
      type: "legacy",
    });
    const result = await client.request({
      method: "eth_sendRawTransaction",
      params: [signedTransaction],
    });
    return result;
  };

  return client;
};
