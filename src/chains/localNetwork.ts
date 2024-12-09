import {defineChain} from "viem";
import {LocalNetworkChain} from "@/types";

const LOCAL_NETWORK_JSON_RPC_URL = "http://127.0.0.1:4000/api";

export const localNetwork: LocalNetworkChain = defineChain({
  id: 61_998,
  name: "GenLayer Local Network",
  rpcUrls: {
    default: {
      http: [LOCAL_NETWORK_JSON_RPC_URL],
    },
  },
  nativeCurrency: {
    name: "GEN Token",
    symbol: "GEN",
    decimals: 18,
  },
  blockExplorers: {
    default: {
      name: "GenLayer Local Explorer",
      url: LOCAL_NETWORK_JSON_RPC_URL,
    },
  },
  testnet: true,
});
