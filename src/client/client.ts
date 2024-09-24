import {Account, createClient as createViemClient, http, publicActions, Transport} from "viem";
import {simulator} from "../chains/simulator";
import {accountActions} from "../accounts/actions";
import {contractActions, overrideContractActions} from "../contracts/actions";
import {transactionActions} from "../transactions/actions";
import {GenLayerClient, SimulatorChain} from "@/types";
import {createAccount} from "@/accounts/account";

// Define the configuration interface for the client
interface ClientConfig {
  chain?: {
    id: number;
    name: string;
    rpcUrls: {default: {http: readonly string[]}};
    nativeCurrency: {name: string; symbol: string; decimals: number};
    blockExplorers?: {default: {name: string; url: string}};
  };
  endpoint?: string; // Optional: Custom RPC endpoint override
}

// Extend Viem client to work with GenLayer-specific chains (simulator, testnet, etc.)
export const createClient = (config: ClientConfig = {chain: simulator}) => {
  // Determine the RPC URL based on the provided configuration or default to the simulator's RPC UR
  const chainConfig = config.chain || simulator;
  const rpcUrl = config.endpoint || chainConfig.rpcUrls.default.http[0];

  const account = createAccount();

  // Create a Viem client connected to the GenLayer Simulator (or custom chain)
  const baseClient = createViemClient({
    chain: chainConfig,
    transport: http(rpcUrl),
    account,
  })
    .extend(publicActions)
    .extend(client => accountActions(client as unknown as GenLayerClient<Transport, SimulatorChain, Account>))
    .extend(client =>
      transactionActions(client as unknown as GenLayerClient<Transport, SimulatorChain, Account>),
    )
    .extend(client =>
      contractActions(client as unknown as GenLayerClient<Transport, SimulatorChain, Account>),
    );

  const genLayerClient = overrideContractActions(
    baseClient as unknown as GenLayerClient<Transport, SimulatorChain, Account>,
  );

  return genLayerClient;
};