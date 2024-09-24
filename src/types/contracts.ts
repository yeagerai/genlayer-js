export type ContractSchema = {
  abi: Array<{
    inputs?: Array<{
      name: string;
      type: string;
    }>;
    name?: string;
    outputs?: Array<{
      name: string;
      type: string;
    }>;
    type: "constructor" | "function";
  }>;
  class: string;
};
