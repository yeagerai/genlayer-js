import {TransactionHash} from "@/types";

export type IAccountActions = {
  fundAccount: ({address, amount}: {address: string; amount: number}) => Promise<TransactionHash>;
};
