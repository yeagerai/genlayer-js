import {Chain} from "viem";

export type GenLayerChain = Chain & {
  consensusMainContract: {
    address: string;
    abi: any[];
    bytecode: string;
  } | null;
  defaultNumberOfInitialValidators: number;
  defaultConsensusMaxRotations: number;
};
