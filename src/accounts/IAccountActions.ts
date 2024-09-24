import {TransactionHash} from "@/types";
import {Account, Chain, Transport} from "viem";

export type IAccountActions<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined,
> = {
  fundAccount: ({address, amount}: {address: string; amount: number}) => Promise<TransactionHash>;
};
