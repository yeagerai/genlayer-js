import {Address} from "./accounts";

export type Hash = `0x${string}` & {length: 66};
export type TransactionHash = Hash;

export enum TransactionStatus {
  UNINITIALIZED = "UNINITIALIZED",
  PENDING = "PENDING",
  PROPOSING = "PROPOSING",
  COMMITTING = "COMMITTING",
  REVEALING = "REVEALING",
  ACCEPTED = "ACCEPTED",
  UNDETERMINED = "UNDETERMINED",
  FINALIZED = "FINALIZED",
  CANCELED = "CANCELED",
  APPEAL_REVEALING = "APPEAL_REVEALING",
  APPEAL_COMMITTING = "APPEAL_COMMITTING",
  READY_TO_FINALIZE = "READY_TO_FINALIZE",
  VALIDATORS_TIMEOUT = "VALIDATORS_TIMEOUT",
  LEADER_TIMEOUT = "LEADER_TIMEOUT",
}

export const transactionsStatusNumberToName = {
  "0": TransactionStatus.UNINITIALIZED,
  "1": TransactionStatus.PENDING,
  "2": TransactionStatus.PROPOSING,
  "3": TransactionStatus.COMMITTING,
  "4": TransactionStatus.REVEALING,
  "5": TransactionStatus.ACCEPTED,
  "6": TransactionStatus.UNDETERMINED,
  "7": TransactionStatus.FINALIZED,
  "8": TransactionStatus.CANCELED,
  "9": TransactionStatus.APPEAL_REVEALING,
  "10": TransactionStatus.APPEAL_COMMITTING,
  "11": TransactionStatus.READY_TO_FINALIZE,
  "12": TransactionStatus.VALIDATORS_TIMEOUT,
  "13": TransactionStatus.LEADER_TIMEOUT,
};

export const transactionsStatusNameToNumber = {
  [TransactionStatus.UNINITIALIZED]: "0",
  [TransactionStatus.PENDING]: "1",
  [TransactionStatus.PROPOSING]: "2",
  [TransactionStatus.COMMITTING]: "3",
  [TransactionStatus.REVEALING]: "4",
  [TransactionStatus.ACCEPTED]: "5",
  [TransactionStatus.UNDETERMINED]: "6",
  [TransactionStatus.FINALIZED]: "7",
  [TransactionStatus.CANCELED]: "8",
  [TransactionStatus.APPEAL_REVEALING]: "9",
  [TransactionStatus.APPEAL_COMMITTING]: "10",
  [TransactionStatus.READY_TO_FINALIZE]: "11",
  [TransactionStatus.VALIDATORS_TIMEOUT]: "12",
  [TransactionStatus.LEADER_TIMEOUT]: "13",
};

export type GenLayerTransaction = {
  hash: TransactionHash;
  status: TransactionStatus;
  from_address?: string;
  to_address?: string;
  data?: Record<string, unknown>;
  consensus_data?: {
    final: boolean;
    leader_receipt?: {
      calldata: string;
      class_name: string;
      contract_state: string;
      eq_outputs: Record<string, unknown>;
      error: string | null;
      execution_result: string;
      gas_used: number;
      mode: string;
      node_config: Record<string, unknown>;
      pending_transactions: unknown[];
      vote: string;
      result: string;
    };
    validators?: Record<string, unknown>[];
    votes?: Record<string, string>;
  };
  nonce?: number;
  value?: number;
  type?: number;
  gaslimit?: bigint;
  created_at?: Date;
  r?: number;
  s?: number;
  v?: number;
};

export type GenLayerRawTransaction = {
  currentTimestamp: bigint;
  sender: Address;
  recipient: Address;
  numOfInitialValidators: bigint;
  txSlot: bigint;
  createdTimestamp: bigint;
  lastVoteTimestamp: bigint;
  randomSeed: Hash;
  result: number;
  txData: string;
  txReceipt: Hash;
  messages: unknown[];
  queueType: number;
  queuePosition: bigint;
  activator: Address;
  lastLeader: Address;
  status: number;
  txId: Hash;
  readStateBlockRange: {
    activationBlock: bigint;
    processingBlock: bigint;
    proposalBlock: bigint;
  };
  numOfRounds: bigint;
  lastRound: {
    round: bigint;
    leaderIndex: bigint;
    votesCommitted: bigint;
    votesRevealed: bigint;
    appealBond: bigint;
    rotationsLeft: bigint;
    result: number;
    roundValidators: Address[];
    validatorVotesHash: Hash[];
    validatorVotes: number[];
  };
};
