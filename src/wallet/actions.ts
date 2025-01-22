import { connect } from "./connect";
import { GenLayerClient, SimulatorChain } from "@/types";

export function walletActions(client: GenLayerClient<SimulatorChain>) {
  return {
    connect: () => connect(client),
  };
}
