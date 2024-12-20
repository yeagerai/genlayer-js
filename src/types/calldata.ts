export class Address {
  bytes: Uint8Array;

  constructor(addr: Uint8Array) {
    if (addr.length != 32) {
      throw new Error(`invalid address length ${addr}`);
    }

    this.bytes = addr;
  }
}

export type CalldataEncodable =
  | null
  | boolean
  | Address
  | number
  | bigint
  | string
  | Uint8Array /// bytes
  | Array<CalldataEncodable>
  | Map<string, CalldataEncodable>
  | {[key: string]: CalldataEncodable}; /// also a "map"

export type MethodDescription = {
  method: string;

  args: Array<CalldataEncodable>;
};

export type TransactionData = {
  method: string;

  args: CalldataEncodable[];
};

export type TransactionDataElement = string | number | bigint | boolean | Uint8Array;
