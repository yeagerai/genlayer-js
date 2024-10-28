import {GenLayerClient, TransactionHash, SimulatorChain} from "../types";
import {simulator} from "../chains";
import {Account, Transport} from "viem";

export function accountActions<
  transport extends Transport = Transport,
  chain extends SimulatorChain | undefined = SimulatorChain | undefined,
  account extends Account | undefined = Account | undefined,
>(client: GenLayerClient<Transport, SimulatorChain>) {
  return {
    fundAccount: async ({address, amount}: {address: string; amount: number}): Promise<TransactionHash> => {
      if (client.chain?.id !== simulator.id) {
        throw new Error("Client is not connected to the simulator");
      }

      return client.request({
        method: "sim_fundAccount",
        params: [address, amount],
      }) as Promise<TransactionHash>;
    },
    getCurrentNonce: async ({address}: {address: string}): Promise<number> => {
      const addressToUse = address || client.account?.address;

      if (!addressToUse) {
        throw new Error("No address provided and no account is connected");
      }

      return client.request({
        method: "eth_getTransactionCount",
        params: [addressToUse],
      }) as Promise<number>;
    },
  };
}
