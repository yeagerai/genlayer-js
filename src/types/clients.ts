import {Transport, Client, PublicActions} from "viem";
import {GenLayerTransaction, TransactionHash, TransactionStatus} from "./transactions";
import {SimulatorChain} from "./chains";
import {Address, Account} from "./accounts";
import {CalldataEncodable} from "./calldata";

export type GenLayerMethod =
  | {method: "sim_fundAccount"; params: [address: string, amount: number]}
  | {method: "eth_getTransactionByHash"; params: [hash: TransactionHash]}
  | {method: "eth_call"; params: [requestParams: any, blockNumberOrHash: string]}
  | {method: "eth_sedRawTransaction"; params: [signedTransaction: string]}
  | {method: "gen_getContractSchema"; params: [address: string]}
  | {method: "gen_getContractSchemaForCode"; params: [contractCode: string]}
  | {method: "eth_getTransactionCount"; params: [address: string]};

export type GenLayerClient<TSimulatorChain extends SimulatorChain> = Omit<
  Client<Transport, TSimulatorChain>,
  "transport" | "getTransaction" | "readContract"
> &
  Omit<PublicActions<Transport, TSimulatorChain>, "readContract" | "getTransaction"> & {
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
    }) => Promise<any>;
    writeContract: (args: {
      account?: Account;
      address: Address;
      functionName: string;
      args: CalldataEncodable[];
      value: bigint;
    }) => Promise<any>;
    deployContract: (args: {account?: Account; code: string; args: CalldataEncodable[]}) => Promise<any>;
    getTransaction: (args: {hash: TransactionHash}) => Promise<GenLayerTransaction>;
    getCurrentNonce: (args: {address: string}) => Promise<number>;
    waitForTransactionReceipt: (args: {
      hash: TransactionHash;
      status?: TransactionStatus;
    }) => Promise<GenLayerTransaction>;
  };
