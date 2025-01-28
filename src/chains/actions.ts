import {GenLayerClient, SimulatorChain} from "@/types";
import {simulator} from "@/chains";

export function chainActions(client: GenLayerClient<SimulatorChain>) {
  return {
    initializeConsensusSmartContract: async (forceReset: boolean = false): Promise<void> => {
      if (client.chain?.id !== simulator.id) {
        throw new Error("Client is not connected to the simulator");
      }

      if (
        !forceReset &&
        client.chain.consensusMainContract?.address &&
        client.chain.consensusMainContract?.abi
      ) {
        return;
      }

      const contractsResponse = await fetch(client.chain.rpcUrls.default.http[0], {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now(),
          method: "sim_getConsensusContract",
          params: ["ConsensusMain"],
        }),
      });

      if (!contractsResponse.ok) {
        throw new Error("Failed to fetch ConsensusMain contract");
      }

      const consensusMainContract = await contractsResponse.json();
      client.chain.consensusMainContract = consensusMainContract.result;
    },
  };
}
