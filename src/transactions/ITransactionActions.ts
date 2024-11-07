import {TransactionHash, TransactionStatus, GenLayerTransaction} from "@/types";

export type ITransactionActions = {
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
};
