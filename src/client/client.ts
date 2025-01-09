import {Account, createClient as createViemClient, publicActions, custom, Address} from "viem";
import {simulator} from "../chains/simulator";
import {accountActions} from "../accounts/actions";
import {contractActions, overrideContractActions} from "../contracts/actions";
import {transactionActions} from "../transactions/actions";
import {GenLayerClient, SimulatorChain} from "@/types";

// Define the configuration interface for the client
interface ClientConfig {
  chain?: {
    id: number;
    name: string;
    rpcUrls: { default: { http: readonly string[] } };
    nativeCurrency: { name: string; symbol: string; decimals: number };
    blockExplorers?: { default: { name: string; url: string } };
  };
  endpoint?: string; // Custom RPC endpoint
  account?: Account | Address;
}

export const createClient = (config: ClientConfig = { chain: simulator }) => {
  const chainConfig = config.chain || simulator;
  const rpcUrl = config.endpoint || chainConfig.rpcUrls.default.http[0];
  const isAddress = typeof config.account !== "object";

  const customTransport = {
      async request({method, params}: {method: string; params: any[]}) {
        if (method.startsWith('eth_') && isAddress) {
          try {
            return await window.ethereum?.request({method, params});
          } catch (err) {
            console.warn(`Error using window.ethereum for method ${method}:`, err);
            throw err;
          }
        } else {
          try {
            const response = await fetch(rpcUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                jsonrpc: '2.0',
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
    }


  const baseClient = createViemClient({
    chain: chainConfig,
    transport: custom(customTransport),
    ...(config.account ? {account: config.account} : {}),
  })
    .extend(publicActions)
    .extend(client => accountActions(client as unknown as GenLayerClient<SimulatorChain>))
    .extend(client => transactionActions(client as unknown as GenLayerClient<SimulatorChain>))
    .extend(client => contractActions(client as unknown as GenLayerClient<SimulatorChain>));

  return overrideContractActions(baseClient as unknown as GenLayerClient<SimulatorChain>);

};

