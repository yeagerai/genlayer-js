import { connect } from "./connect";
import {GenLayerClient, SimulatorChain, Network, SnapSource} from "@/types";
import { metamaskClient } from "@/wallet/metamaskClient";

export function walletActions(client: GenLayerClient<SimulatorChain>) {
  return {
    connect: (network: Network, snapSource: SnapSource) => connect(client, network, snapSource),
    metamaskClient: (snapSource: SnapSource = "npm") => metamaskClient(snapSource),
  };
}
