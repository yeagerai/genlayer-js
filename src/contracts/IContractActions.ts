import {ContractSchema} from "@/types";
import {Address} from "viem";

export type IContractActions = {
  getContractSchema: (code: string) => Promise<ContractSchema>;
  getContractSchemaForCode: (address: string) => Promise<ContractSchema>;
  readContract: (args: {address: Address; functionName: string; args: any[]}) => Promise<unknown>;
};
