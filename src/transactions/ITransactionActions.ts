import {Account, Chain, Transport} from "viem";
import {TransactionHash, TransactionStatus, GenLayerTransaction} from "@/types";

export type ITransactionActions<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined,
> = {
  waitForTransactionReceipt: ({
    hash,
    status,
    interval,
    retries,
  }: {
    hash: TransactionHash;
    status: TransactionStatus;
    interval?: number;
    retries?: number;
  }) => Promise<GenLayerTransaction>;
  getTransactionByHash: (hash: TransactionHash) => Promise<GenLayerTransaction>;
};
