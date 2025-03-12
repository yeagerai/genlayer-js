// tests/client.test.ts
import {createClient} from "../src/client/client";
import {localnet} from "@/chains/localnet";
import {Address} from "../src/types/accounts";
import {createAccount, generatePrivateKey} from "../src/accounts/account";
import {vi} from "vitest";
import {BlockId, createArchiveBlockId} from "../src/types/transactions";
describe("Client Creation", () => {
  it("should create a client for the localnet", () => {
    const client = createClient({chain: localnet});
    expect(client).toBeDefined();
    expect(client.chain).toBe(localnet);
  });
});

describe("Client Overrides", () => {
  it("should default to client account if no account is provided", async () => {
    const account = createAccount(generatePrivateKey());
    const client = createClient({
      chain: localnet,
      account: account,
    });

    // Mock the client.request method
    vi.spyOn(client, "request").mockResolvedValue("0x00");

    const contractAddress = "0x1234567890123456789012345678901234567890";
    await client.readContract({
      address: contractAddress as Address,
      functionName: "testFunction",
      args: ["arg1", "arg2"],
      blockId: BlockId.LATEST_FINAL,
    });

    expect(client.request).toHaveBeenCalledWith({
      method: "gen_call",
      params: [
        {
          to: contractAddress,
          from: account.address,
          data: expect.any(String),
          block_id: BlockId.LATEST_FINAL,
        },
      ],
    });
  });

  it("should override client account if account is provided", async () => {
    const account = createAccount(generatePrivateKey());
    const client = createClient({
      chain: localnet,
      account,
    });

    const overrideAccount = createAccount(generatePrivateKey());

    // Mock the client.request method
    vi.spyOn(client, "request").mockResolvedValue("0x00");

    const contractAddress = "0x1234567890123456789012345678901234567890";
    await client.readContract({
      account: overrideAccount,
      address: contractAddress as Address,
      functionName: "testFunction",
      args: ["arg1", "arg2"],
      blockId: BlockId.LATEST_NONFINAL,
      leaderResults: {"0": "0x0123456789012345678901234567890123456789"},
    });

    expect(client.request).toHaveBeenCalledWith({
      method: "gen_call",
      params: [
        {
          to: contractAddress,
          from: overrideAccount.address,
          data: expect.any(String),
          block_id: BlockId.LATEST_NONFINAL,
          leader_results: {"0": "0x0123456789012345678901234567890123456789"},
        },
      ],
    });
  });
  it("should override client account if address is provided", async () => {
    const account = "0x65e03a3e916CF1dC92d3C8E8186a89CfAB0D2bc2";
    const client = createClient({
      chain: localnet,
      account,
    });

    // Mock the client.request method
    vi.spyOn(client, "request").mockResolvedValue("0x00");

    const contractAddress = "0x1234567890123456789012345678901234567890";
    await client.readContract({
      address: contractAddress as Address,
      functionName: "testFunction",
      args: ["arg1", "arg2"],
    });

    expect(client.request).toHaveBeenCalledWith({
      method: "gen_call",
      params: [
        {
          to: contractAddress,
          from: account,
          data: expect.any(String),
        },
      ],
    });

    await client.readContract({
      address: contractAddress as Address,
      functionName: "testFunction",
      args: ["arg1", "arg2"],
      blockId: createArchiveBlockId(1234567),
    });

    expect(client.request).toHaveBeenCalledWith({
      method: "gen_call",
      params: [
        {
          to: contractAddress,
          from: account,
          data: expect.any(String),
          block_id: createArchiveBlockId(1234567),
        },
      ],
    });

    await client.readContract({
      address: contractAddress as Address,
      functionName: "testFunction",
      args: ["arg1", "arg2"],
      blockId: createArchiveBlockId("0xabc1234567890123456789012345678901234567"),
    });

    expect(client.request).toHaveBeenCalledWith({
      method: "gen_call",
      params: [
        {
          to: contractAddress,
          from: account,
          data: expect.any(String),
          block_id: createArchiveBlockId("0xabc1234567890123456789012345678901234567"),
        },
      ],
    });
  });
});
