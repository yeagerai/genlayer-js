import {toHex, toRlp} from "viem";

import type {TransactionDataElement} from "../types/calldata";

export function serializeOne(data: TransactionDataElement): `0x${string}` {
    return toHex(data)
}

export function serialize(data: TransactionDataElement[]): `0x${string}` {
    return toRlp(data.map(serializeOne));
}
