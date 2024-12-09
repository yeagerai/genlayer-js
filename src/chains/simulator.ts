import {defineChain} from "viem";
import {SimulatorChain} from "@/types";

// chains/simulator.ts
const SIMULATOR_JSON_RPC_URL = "https://studio.genlayer.com:8443";

export const simulator: SimulatorChain = defineChain({
  id: 61_999,
  name: "GenLayer Studio",
  rpcUrls: {
    default: {
      http: [SIMULATOR_JSON_RPC_URL],
    },
  },
  nativeCurrency: {
    name: "GEN Token",
    symbol: "GEN",
    decimals: 18,
  },
  blockExplorers: {
    default: {
      name: "GenLayer Studio Explorer",
      url: SIMULATOR_JSON_RPC_URL,
    },
  },
  testnet: true,
});
