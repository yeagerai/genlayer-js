import {defineChain} from "viem";
import {GenLayerChain} from "@/types";

// chains/localnet.ts
const SIMULATOR_JSON_RPC_URL = "http://127.0.0.1:4000/api";

export const localnet: GenLayerChain = defineChain({
  id: 61_999,
  name: "Genlayer Localnet",
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
  consensusMainContract: null,
  consensusDataContract: null,
  defaultNumberOfInitialValidators: 5,
  defaultConsensusMaxRotations: 3,
});
