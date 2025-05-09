import {Address, TransactionHash} from "@/types";

export type IAccountActions = {
  fundAccount: ({address, amount}: {address: Address; amount: number}) => Promise<TransactionHash>;
};
