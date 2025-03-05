import { localnet } from "@/chains/localnet";
import { GenLayerClient, SimulatorChain } from "@/types";
import { Network } from "@/types/network";
import { SnapSource } from "@/types/snapSource";
import { snapID } from "@/config/snapID";

const networks = {
  localnet,
};

export const connect = async (
  client: GenLayerClient<SimulatorChain>,
  network: Network = "localnet",
  snapSource: SnapSource = 'npm'
): Promise<void> => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }
  if (network === "testnet" || network === "mainnet") {
    throw new Error(`${network} is not available yet. Please use localnet.`);
  }

  const selectedNetwork = networks[network];
  if (!selectedNetwork) {
    throw new Error(`Network configuration for '${network}' is not available.`);
  }

  const chainIdHex = `0x${selectedNetwork.id.toString(16)}`;
  const chainParams = {
    chainId: chainIdHex,
    chainName: selectedNetwork.name,
    rpcUrls: selectedNetwork.rpcUrls.default.http,
    nativeCurrency: selectedNetwork.nativeCurrency,
    blockExplorerUrls: [selectedNetwork.blockExplorers?.default.url],
  };

  const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
  if (currentChainId !== chainIdHex) {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [chainParams],
    });
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  }

  const id = snapSource === 'local' ? snapID.local : snapID.npm;
  const installedSnaps: any = await window.ethereum.request({ method: "wallet_getSnaps" });
  const isGenLayerSnapInstalled = Object.values(installedSnaps).some(
    (snap: any) => snap.id === id
  );

  if (!isGenLayerSnapInstalled) {
    await window.ethereum.request({
      method: "wallet_requestSnaps",
      params: {
        [id]: {},
      },
    });
  }

  client.chain = selectedNetwork;
};
