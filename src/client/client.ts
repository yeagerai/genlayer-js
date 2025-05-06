import {Account, createClient as createViemClient, publicActions, custom, Address, walletActions} from "viem";
import {accountActions} from "../accounts/actions";
import {contractActions, overrideContractActions} from "../contracts/actions";
import {transactionActions} from "../transactions/actions";
import {walletActions as genlayerWalletActions} from "../wallet/actions";
import {GenLayerClient, GenLayerChain} from "@/types";
import {chainActions} from "@/chains/actions";
import {localnet} from "@/chains";

// Define the configuration interface for the client
interface ClientConfig {
  chain?: {
    id: number;
    name: string;
    rpcUrls: {default: {http: readonly string[]}};
    nativeCurrency: {name: string; symbol: string; decimals: number};
    blockExplorers?: {default: {name: string; url: string}};
  };
  endpoint?: string; // Custom RPC endpoint
  account?: Account | Address;
}

const getCustomTransport = (config: ClientConfig) => {
  const isAddress = typeof config.account !== "object";

  return {
    async request({method, params = []}: {method: string; params: any[]}) {
      if (method.startsWith("eth_") && isAddress) {
        try {
          return await window.ethereum?.request({method, params});
        } catch (err) {
          console.warn(`Error using window.ethereum for method ${method}:`, err);
          throw err;
        }
      } else {
        if (!config.chain) {
          throw new Error("Chain is not set");
        }

        try {
          const response = await fetch(config.chain.rpcUrls.default.http[0], {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: Date.now(),
              method,
              params,
            }),
          });

          const data = await response.json();

          if (data.error) {
            throw new Error(data.error.message);
          }

          return data.result;
        } catch (err) {
          console.error(`Error fetching ${method} from GenLayer RPC:`, err);
          throw err;
        }
      }
    },
  };
};

export const createClient = (config: ClientConfig = {chain: localnet}): GenLayerClient<GenLayerChain> => {
  const chainConfig = config.chain || localnet;
  if (config.endpoint) {
    chainConfig.rpcUrls.default.http = [config.endpoint];
  }

  const customTransport = getCustomTransport(config);

  const baseClient = createViemClient({
    chain: chainConfig,
    transport: custom(customTransport),
    ...(config.account ? {account: config.account} : {}),
  })
    .extend(publicActions)
    .extend(walletActions)
    .extend(client => accountActions(client as unknown as GenLayerClient<GenLayerChain>))
    .extend(client => transactionActions(client as unknown as GenLayerClient<GenLayerChain>))
    .extend(client => contractActions(client as unknown as GenLayerClient<GenLayerChain>))
    .extend(client => chainActions(client as unknown as GenLayerClient<GenLayerChain>))
    .extend(client => genlayerWalletActions(client as unknown as GenLayerClient<GenLayerChain>));

  // Initialize in the background
  baseClient.initializeConsensusSmartContract().catch(error => {
    console.error("Failed to initialize consensus smart contract:", error);
  });

  return overrideContractActions(baseClient as unknown as GenLayerClient<SimulatorChain>);
};
