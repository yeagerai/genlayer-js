export class CalldataAddress {
  bytes: Uint8Array;

  constructor(addr: Uint8Array) {
    if (addr.length != 20) {
      throw new Error(`invalid address length ${addr}`);
    }

    this.bytes = addr;
  }
}

export type CalldataEncodable =
  | null
  | boolean
  | CalldataAddress
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

export type TransactionDataElement = string | number | bigint | boolean | Uint8Array;
