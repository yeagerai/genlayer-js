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

export type TransactionDataElement = string | number | bigint | boolean | Uint8Array;
