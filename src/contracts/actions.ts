import {decode} from "@/abi/calldata/decoder";
import {encode, serialize, encodeAndSerialize} from "@/abi/calldata/encoder";
import {Account, ContractSchema, SimulatorChain, GenLayerClient, CalldataEncodable, Address} from "@/types";

export const contractActions = (client: GenLayerClient<SimulatorChain>) => {
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

export const overrideContractActions = (client: GenLayerClient<SimulatorChain>) => {
  client.readContract = async (args: {
    account?: Account;
    address: Address;
    functionName: string;
    args: CalldataEncodable[];
  }): Promise<unknown> => {
    const { account, address, functionName, args: params } = args;
    const encodedData = encodeAndSerialize({ method: functionName, args: params });

    let senderAddress = account?.address ?? client.account?.address;

    const requestParams = {
      to: address,
      from: senderAddress,
      data: encodedData,
    };
    const result = await client.request({
      method: "eth_call",
      params: [requestParams, "latest"],
    });

    if (typeof result === "string") {
      const val = Uint8Array.from(atob(result), c => c.charCodeAt(0));
      return decode(val);
    } else {
      return "<unknown>";
    }
  };


  client.writeContract = async (args: {
    account?: Account;
    address: Address;
    functionName: string;
    args: CalldataEncodable[];
    value: bigint;
    leaderOnly?: boolean;
  }): Promise<`0x${string}`> => {
    const { account, address, functionName, args: params, value = 0n, leaderOnly = false } = args;
    const data = [encode({ method: functionName, args: params }), leaderOnly];
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
          "No account set. Configure the client with an account or pass an account to this function."
      );
    }

    if (!senderAccount?.signTransaction) {
      throw new Error("Account does not support signTransaction");
    }

    const nonce = await client.getCurrentNonce({ address: senderAccount.address });

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
    code: string;
    args: CalldataEncodable[];
    leaderOnly?: boolean;
  }) => {
    const { account, code, args: constructorArgs, leaderOnly = false } = args;
    const data = [code, encode({ args: constructorArgs }), leaderOnly];
    const serializedData = serialize(data);
    const senderAccount = account || client.account;

    if (senderAccount?.type !== "local") {

      const transaction = {
        from: senderAccount?.address,
        to: null,
        data: serializedData,
        value: "0x0",
      };

      return  await client.request({
        method: "eth_sendTransaction",
        params: [transaction as any],
      });
    }

    if (!senderAccount) {
      throw new Error(
          "No account set. Configure the client with an account or pass an account to this function."
      );
    }

    if (!senderAccount?.signTransaction) {
      throw new Error("Account does not support signTransaction");
    }

    const nonce = await client.getCurrentNonce({ address: senderAccount.address });

    const signedTransaction = await senderAccount.signTransaction({
      data: serializedData,
      type: "legacy",
      nonce,
    });

    return  await client.request({
      method: "eth_sendRawTransaction",
      params: [signedTransaction],
    });
  };

  return client;
};
