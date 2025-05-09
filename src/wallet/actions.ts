import {connect} from "./connect";
import {GenLayerClient, GenLayerChain, Network, SnapSource} from "@/types";
import {metamaskClient} from "@/wallet/metamaskClient";

export function walletActions(client: GenLayerClient<GenLayerChain>) {
  return {
    connect: (network: Network, snapSource: SnapSource) => connect(client, network, snapSource),
    metamaskClient: (snapSource: SnapSource = "npm") => metamaskClient(snapSource),
  };
}
