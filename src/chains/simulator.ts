import {defineChain} from "viem";
import {SimulatorChain} from "@/types";

// chains/simulator.ts
const SIMULATOR_JSON_RPC_URL = "http://127.0.0.1:4000/api";

export const simulator: SimulatorChain = defineChain({
  id: 61_999,
  name: "GenLayer Simulator",
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
      name: "GenLayer Explorer",
      url: SIMULATOR_JSON_RPC_URL,
    },
  },
  testnet: true,
});
