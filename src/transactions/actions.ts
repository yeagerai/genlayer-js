import {GenLayerClient} from "../types/clients";
import {TransactionHash, TransactionStatus, GenLayerTransaction} from "../types/transactions";
import {transactionsConfig} from "../config/transactions";
import {sleep} from "../utils/async";
import {ITransactionActions} from "./ITransactionActions";
import {Account, Transport} from "viem";
import {SimulatorChain} from "@/types";

export const transactionActions = (
  client: GenLayerClient<Transport, SimulatorChain, Account>,
): ITransactionActions => ({
  waitForTransactionReceipt: async ({
    hash,
    status = TransactionStatus.FINALIZED,
    interval = transactionsConfig.waitInterval,
    retries = transactionsConfig.retries,
  }: {
    hash: TransactionHash;
    status: TransactionStatus;
    interval?: number;
    retries?: number;
  }): Promise<GenLayerTransaction> => {
    const transaction = (await client.getTransaction({hash})) as GenLayerTransaction;

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (
      transaction.status === status ||
      (status === TransactionStatus.ACCEPTED && transaction.status === TransactionStatus.FINALIZED)
    ) {
      return transaction;
    }

    if (retries === 0) {
      throw new Error("Transaction status is not " + status);
    }

    await sleep(interval);
    return transactionActions(client).waitForTransactionReceipt({
      hash,
      status,
      interval,
      retries: retries - 1,
    });
  },
});
