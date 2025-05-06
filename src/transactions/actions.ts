import {GenLayerClient} from "../types/clients";
import {TransactionHash, TransactionStatus, GenLayerTransaction} from "../types/transactions";
import {transactionsConfig} from "../config/transactions";
import {sleep} from "../utils/async";
import {GenLayerChain} from "@/types";
import {b64ToArray, calldataToUserFriendlyJson, resultToUserFriendlyJson} from "@/utils/jsonifier";

export const transactionActions = (client: GenLayerClient<GenLayerChain>) => ({
  waitForTransactionReceipt: async ({
    hash,
    status = TransactionStatus.ACCEPTED,
    interval = transactionsConfig.waitInterval,
    retries = transactionsConfig.retries,
  }: {
    hash: TransactionHash;
    status: TransactionStatus;
    interval?: number;
    retries?: number;
  }): Promise<GenLayerTransaction> => {
    const transaction = await client.getTransaction({hash});

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (
      transaction.status === status ||
      (status === TransactionStatus.ACCEPTED && transaction.status === TransactionStatus.FINALIZED)
    ) {
      return _decodeTransaction(transaction);
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

const _decodeTransaction = (tx: GenLayerTransaction): GenLayerTransaction => {
  if (!tx.data) return tx;

  try {
    const leaderReceipt = tx.consensus_data?.leader_receipt;
    if (leaderReceipt) {
      if (leaderReceipt.result) {
        leaderReceipt.result = resultToUserFriendlyJson(leaderReceipt.result);
      }

      if (leaderReceipt.calldata) {
        leaderReceipt.calldata = {
          base64: leaderReceipt.calldata,
          ...calldataToUserFriendlyJson(b64ToArray(leaderReceipt.calldata)),
        };
      }

      if (leaderReceipt.eq_outputs) {
        leaderReceipt.eq_outputs = Object.fromEntries(
          Object.entries(leaderReceipt.eq_outputs).map(([key, value]) => {
            const decodedValue = new TextDecoder().decode(b64ToArray(String(value)));
            return [key, resultToUserFriendlyJson(decodedValue)];
          }),
        );
      }
    }

    if (tx.data.calldata) {
      tx.data.calldata = {
        base64: tx.data.calldata as string,
        ...calldataToUserFriendlyJson(b64ToArray(tx.data.calldata as string)),
      };
    }
  } catch (e) {
    console.error("Error decoding transaction:", e);
  }

  return tx;
};
