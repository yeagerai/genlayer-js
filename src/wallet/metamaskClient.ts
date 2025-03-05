import { snapID } from "@/config/snapID";
import { SnapSource } from "@/types/snapSource";
import { MetaMaskClientResult } from "@/types/metamaskClientResult";

export const metamaskClient = async (snapSource: SnapSource = "npm") => {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  const isFlask = async (): Promise<boolean> => {
    try {
      const clientVersion = await window.ethereum?.request({
        method: "web3_clientVersion",
      });

      return (clientVersion as string)?.includes("flask");
    } catch (error) {
      console.error("Error detecting Flask:", error);
      return false;
    }
  };

  const installedSnaps = async (): Promise<Record<string, any>> => {
    try {
      return (await window.ethereum?.request({
        method: "wallet_getSnaps",
      })) as Record<string, any>;
    } catch (error) {
      console.error("Error getting installed snaps:", error);
      return {};
    }
  };

  const isGenLayerSnapInstalled = async (): Promise<boolean> => {
    const id = snapSource === "local" ? snapID.local : snapID.npm;
    const snaps = await installedSnaps();

    return Object.values(snaps).some((snap: any) => snap.id === id);
  };

  const flaskDetected = await isFlask();
  const snapsList = await installedSnaps();
  const genLayerSnapInstalled = await isGenLayerSnapInstalled();

  return {
    isFlask: flaskDetected,
    installedSnaps: snapsList,
    isGenLayerSnapInstalled: genLayerSnapInstalled,
  } as MetaMaskClientResult;
};
