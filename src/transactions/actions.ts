import {GenLayerClient} from "../types/clients";
import {
  TransactionHash,
  TransactionStatus,
  GenLayerTransaction,
  GenLayerRawTransaction,
  transactionsStatusNameToNumber,
  transactionsStatusNumberToName,
  transactionResultNumberToName,
  VoteType,
  voteTypeNumberToName,
  DecodedCallData,
  DecodedDeployData,
} from "../types/transactions";
import {transactionsConfig} from "../config/transactions";
import {sleep} from "../utils/async";
import {GenLayerChain} from "@/types";
import {b64ToArray, calldataToUserFriendlyJson, resultToUserFriendlyJson} from "@/utils/jsonifier";
import {Abi, PublicClient, fromRlp, fromHex, Hex, Address} from "viem";
import * as calldataAbi from "@/abi/calldata";
import {localnet} from "@/chains/localnet";

export const receiptActions = (client: GenLayerClient<GenLayerChain>, publicClient: PublicClient) => ({
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
    const transaction = await client.getTransaction({
      hash,
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }
    const transactionStatusString = String(transaction.status);
    const transactionStatusFinalized = transactionsStatusNameToNumber[TransactionStatus.FINALIZED];
    const requestedStatus = transactionsStatusNameToNumber[status];
    if (
      transactionStatusString === requestedStatus ||
      (status === TransactionStatus.ACCEPTED && transactionStatusString === transactionStatusFinalized)
    ) {
      if (client.chain.id === localnet.id) {
        return _decodeLocalnetTransaction(transaction as unknown as GenLayerTransaction);
      }
      return transaction;
    }

    if (retries === 0) {
      throw new Error("Transaction status is not " + status);
    }

    await sleep(interval);
    return receiptActions(client, publicClient).waitForTransactionReceipt({
      hash,
      status,
      interval,
      retries: retries - 1,
    });
  },
});

export const transactionActions = (client: GenLayerClient<GenLayerChain>, publicClient: PublicClient) => ({
  getTransaction: async ({hash}: {hash: TransactionHash}): Promise<GenLayerTransaction> => {
    // TODO: remove this once DXP-298 is merged
    if (client.chain.id === localnet.id) {
      const transaction = await client.getTransaction({hash});
      const localnetStatus =
        (transaction.status as string) === "ACTIVATED" ? TransactionStatus.PENDING : transaction.status;

      transaction.status = Number(transactionsStatusNameToNumber[localnetStatus as TransactionStatus]);
      return _decodeLocalnetTransaction(transaction as unknown as GenLayerTransaction);
    }
    const transaction = (await publicClient.readContract({
      address: client.chain.consensusDataContract?.address as Address,
      abi: client.chain.consensusDataContract?.abi as Abi,
      functionName: "getTransactionData",
      args: [
        hash,
        Math.round(new Date().getTime() / 1000), // unix seconds
      ],
    })) as unknown as GenLayerRawTransaction;
    return _decodeTransaction(transaction);
  },
});

const _decodeInputData = (
  rlpEncodedAppData: Hex | undefined | null,
  recipient: Address,
): DecodedDeployData | DecodedCallData | null => {
  if (!rlpEncodedAppData || rlpEncodedAppData === "0x" || rlpEncodedAppData.length <= 2) {
    return null;
  }
  try {
    const rlpDecodedArray = fromRlp(rlpEncodedAppData) as Hex[];

    if (rlpDecodedArray.length === 3) {
      return {
        code: fromHex(rlpDecodedArray[0], "string") as `0x${string}`,
        constructorArgs:
          rlpDecodedArray[1] && rlpDecodedArray[1] !== "0x"
            ? calldataAbi.decode(fromHex(rlpDecodedArray[1], "bytes"))
            : null,
        leaderOnly: rlpDecodedArray[2] === "0x01",
        type: "deploy",
        contractAddress: recipient,
      };
    } else if (rlpDecodedArray.length === 2) {
      return {
        callData:
          rlpDecodedArray[0] && rlpDecodedArray[0] !== "0x"
            ? calldataAbi.decode(fromHex(rlpDecodedArray[0], "bytes"))
            : null,
        leaderOnly: rlpDecodedArray[1] === "0x01",
        type: "call",
      };
    } else {
      console.warn(
        "[decodeInputData] WRITE: Unexpected RLP array length:",
        rlpDecodedArray.length,
        rlpDecodedArray,
      );
      return null;
    }
  } catch (e) {
    console.error(
      "[decodeInputData] Error during comprehensive decoding:",
      e,
      "Raw RLP App Data:",
      rlpEncodedAppData,
    );
    return null;
  }
};

const _decodeTransaction = (tx: GenLayerRawTransaction): GenLayerTransaction => {
  const txDataDecoded = _decodeInputData(tx.txData, tx.recipient);

  const decodedTx = {
    ...tx,
    txData: tx.txData,
    txDataDecoded: txDataDecoded,

    currentTimestamp: tx.currentTimestamp.toString(),
    numOfInitialValidators: tx.numOfInitialValidators.toString(),
    txSlot: tx.txSlot.toString(),
    createdTimestamp: tx.createdTimestamp.toString(),
    lastVoteTimestamp: tx.lastVoteTimestamp.toString(),
    queuePosition: tx.queuePosition.toString(),
    numOfRounds: tx.numOfRounds.toString(),

    readStateBlockRange: {
      ...tx.readStateBlockRange,
      activationBlock: tx.readStateBlockRange.activationBlock.toString(),
      processingBlock: tx.readStateBlockRange.processingBlock.toString(),
      proposalBlock: tx.readStateBlockRange.proposalBlock.toString(),
    },

    statusName:
      transactionsStatusNumberToName[String(tx.status) as keyof typeof transactionsStatusNumberToName],
    resultName:
      transactionResultNumberToName[String(tx.result) as keyof typeof transactionResultNumberToName],

    lastRound: {
      ...tx.lastRound,
      round: tx.lastRound.round.toString(),
      leaderIndex: tx.lastRound.leaderIndex.toString(),
      votesCommitted: tx.lastRound.votesCommitted.toString(),
      votesRevealed: tx.lastRound.votesRevealed.toString(),
      appealBond: tx.lastRound.appealBond.toString(),
      rotationsLeft: tx.lastRound.rotationsLeft.toString(),
      validatorVotesName: tx.lastRound.validatorVotes.map(
        vote => voteTypeNumberToName[String(vote) as keyof typeof voteTypeNumberToName],
      ) as VoteType[],
    },
  };
  return decodedTx as GenLayerTransaction;
};

const _decodeLocalnetTransaction = (tx: GenLayerTransaction): GenLayerTransaction => {
  if (!tx.data) return tx;
  try {
    const leaderReceipt = tx.consensus_data?.leader_receipt;
    if (leaderReceipt) {
      if (leaderReceipt.result && typeof leaderReceipt.result === "string") {
        leaderReceipt.result = resultToUserFriendlyJson(leaderReceipt.result);
      }
      if (leaderReceipt.calldata && typeof leaderReceipt.calldata === "string") {
        leaderReceipt.calldata = {
          base64: leaderReceipt.calldata as string,
          ...calldataToUserFriendlyJson(b64ToArray(leaderReceipt.calldata as string)),
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
    if (tx.data?.calldata && typeof tx.data.calldata === "string") {
      tx.data.calldata = {
        base64: tx.data.calldata as string,
        ...calldataToUserFriendlyJson(b64ToArray(tx.data.calldata as string)),
      };
    }
  } catch (e) {
    console.error("Error in _decodeLocalnetTransaction:", e);
  }
  return tx;
};
