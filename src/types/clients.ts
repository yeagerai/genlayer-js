import {Transport, Client, PublicActions} from "viem";
import {GenLayerTransaction, TransactionHash, TransactionStatus} from "./transactions";
import {SimulatorChain} from "./chains";
import {Address, Account} from "./accounts";
import {CalldataEncodable} from "./calldata";
import {ContractSchema} from "./contracts";

export type GenLayerMethod =
  | {method: "sim_fundAccount"; params: [address: string, amount: number]}
  | {method: "eth_getTransactionByHash"; params: [hash: TransactionHash]}
  | {method: "eth_call"; params: [requestParams: any, blockNumberOrHash: string]}
  | {method: "eth_sedRawTransaction"; params: [signedTransaction: string]}
  | {method: "gen_getContractSchema"; params: [address: string]}
  | {method: "gen_getContractSchemaForCode"; params: [contractCode: string]}
  | {method: "sim_getTransactionsForAddress"; params: [address: string, filter?: "all" | "from" | "to"]}
  | {method: "eth_getTransactionCount"; params: [address: string, block: string]};

/*
  Take all the properties from PublicActions<Transport, TSimulatorChain>
  Remove the transport, readContract, and getTransaction properties
  The resulting type will have everything from PublicActions EXCEPT those
  two properties which are added later
*/
export type GenLayerClient<TSimulatorChain extends SimulatorChain> = Omit<
  Client<Transport, TSimulatorChain>,
  "transport" | "getTransaction" | "readContract"
> &
  Omit<
    PublicActions<Transport, TSimulatorChain>,
    "readContract" | "getTransaction" | "waitForTransactionReceipt"
  > & {
    request: Client<Transport, TSimulatorChain>["request"] & {
      <TMethod extends GenLayerMethod>(
        args: Extract<GenLayerMethod, {method: TMethod["method"]}>,
      ): Promise<unknown>;
    };
    readContract: (args: {
      account?: Account;
      address: Address;
      functionName: string;
      args: CalldataEncodable[];
    }) => Promise<unknown>;
    writeContract: (args: {
      account?: Account;
      address: Address;
      functionName: string;
      args: CalldataEncodable[];
      value: bigint;
      leaderOnly?: boolean;
    }) => Promise<any>;
    deployContract: (args: {
      account?: Account;
      code: string;
      args: CalldataEncodable[];
      leaderOnly?: boolean;
    }) => Promise<`0x${string}`>;
    getTransaction: (args: {hash: TransactionHash}) => Promise<GenLayerTransaction>;
    getCurrentNonce: (args: {address: string}) => Promise<number>;
    waitForTransactionReceipt: (args: {
      hash: TransactionHash;
      status?: TransactionStatus;
      interval?: number;
      retries?: number;
    }) => Promise<GenLayerTransaction>;
    getContractSchema: (address: string) => Promise<ContractSchema>;
    getContractSchemaForCode: (contractCode: string) => Promise<ContractSchema>;
  };
