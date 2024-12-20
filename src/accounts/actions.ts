import {GenLayerClient, TransactionHash, SimulatorChain} from "../types";
import {simulator} from "../chains";

export function accountActions(client: GenLayerClient<SimulatorChain>) {
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
    getCurrentNonce: async ({address, block = 'latest'}: {address: string, block?: string}): Promise<number> => {
      const addressToUse = address || client.account?.address;

      if (!addressToUse) {
        throw new Error("No address provided and no account is connected");
      }
      return client.request({
        method: "eth_getTransactionCount",
        params: [addressToUse, block],
      }) as Promise<number>;
    },
  };
}
