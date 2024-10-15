export type TransactionHash = `0x${string}` & {length: 66};

export enum TransactionStatus {
  PENDING = "PENDING",
  CANCELED = "CANCELED",
  PROPOSING = "PROPOSING",
  COMMITTING = "COMMITTING",
  REVEALING = "REVEALING",
  ACCEPTED = "ACCEPTED",
  FINALIZED = "FINALIZED",
  UNDETERMINED = "UNDETERMINED",
}

export type GenLayerTransaction = {
  hash: TransactionHash;
  status: TransactionStatus;
  from_address?: string;
  to_address?: string;
  data?: Record<string, unknown>;
  consensus_data?: Record<string, unknown>;
  nonce?: number;
  value?: number;
  type?: number;
  gaslimit?: bigint;
  created_at?: Date;
  r?: number;
  s?: number;
  v?: number;
};

export type TransactionDataElement = string | number | bigint | boolean | Uint8Array;
