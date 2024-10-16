import {Account, Transport, Client} from "viem";
import {GenLayerTransaction, TransactionHash} from "./transactions";
import {SimulatorChain} from "./chains";
import {Address} from "./accounts";

export type GenLayerMethod =
  | {method: "sim_fundAccount"; params: [address: string, amount: number]}
  | {method: "eth_getTransactionByHash"; params: [hash: TransactionHash]}
  | {method: "eth_call"; params: [requestParams: any, blockNumberOrHash: string]}
  | {method: "eth_sedRawTransaction"; params: [signedTransaction: string]}
  | {method: "gen_getContractSchema"; params: [address: string]}
  | {method: "gen_getContractSchemaForCode"; params: [contractCode: string]}
  | {method: "eth_getTransactionCount"; params: [address: string]};

export type GenLayerClient<
  TTransport extends Transport,
  TSimulatorChain extends SimulatorChain,
  TAccount extends Account,
> = Client<TTransport, TSimulatorChain, TAccount> & {
  request: Client<TTransport, TSimulatorChain, TAccount>["request"] & {
    <TMethod extends GenLayerMethod>(
      args: Extract<GenLayerMethod, {method: TMethod["method"]}>,
    ): Promise<unknown>;
  };
  readContract: (args: {
    account: Account;
    address: Address;
    functionName: string;
    args: any[];
  }) => Promise<any>;
  writeContract: (args: {
    account: Account;
    address: Address;
    functionName: string;
    args: any[];
    value: bigint;
  }) => Promise<any>;
  getTransaction: (args: {hash: TransactionHash}) => Promise<GenLayerTransaction>;
  getCurrentNonce: (args: {address: string}) => Promise<number>;
};
