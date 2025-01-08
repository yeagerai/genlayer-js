// tests/client.test.ts
import {createClient} from "../src/client/client";
import {simulator} from "../src/chains/simulator";
import {Address} from "../src/types/accounts";
import {createAccount, generatePrivateKey} from "../src/accounts/account";
import {vi} from "vitest";

describe("Client Creation", () => {
  it("should create a client for the simulator", () => {
    const client = createClient({chain: simulator});
    expect(client).toBeDefined();
    expect(client.chain).toBe(simulator);
  });
});

describe("Client Overrides", () => {
  it("should default to client account if no account is provided", async () => {
    const account = createAccount(generatePrivateKey());
    const client = createClient({
      chain: simulator,
      account: account,
    });

    // Mock the client.request method
    vi.spyOn(client, "request").mockResolvedValue(undefined);

    const contractAddress = "0x1234567890123456789012345678901234567890";
    await client.readContract({
      address: contractAddress as Address,
      functionName: "testFunction",
      args: ["arg1", "arg2"],
    });

    expect(client.request).toHaveBeenCalledWith({
      method: "eth_call",
      params: [
        {
          to: contractAddress,
          from: account.address,
          data: expect.any(String),
        },
        "latest",
      ],
    });
  });

  it("should override client account if account is provided", async () => {
    const account = createAccount(generatePrivateKey());
    const client = createClient({
      chain: simulator,
      account,
    });

    const overrideAccount = createAccount(generatePrivateKey());

    // Mock the client.request method
    vi.spyOn(client, "request").mockResolvedValue(undefined);

    const contractAddress = "0x1234567890123456789012345678901234567890";
    await client.readContract({
      account: overrideAccount,
      address: contractAddress as Address,
      functionName: "testFunction",
      args: ["arg1", "arg2"],
    });

    expect(client.request).toHaveBeenCalledWith({
      method: "eth_call",
      params: [
        {
          to: contractAddress,
          from: overrideAccount.address,
          data: expect.any(String),
        },
        "latest",
      ],
    });
  });
  it("should override client account if address is provided", async () => {
    const account = '0x65e03a3e916CF1dC92d3C8E8186a89CfAB0D2bc2';
    const client = createClient({
      chain: simulator,
      account,
    });

    // Mock the client.request method
    vi.spyOn(client, "request").mockResolvedValue(undefined);

    const contractAddress = "0x1234567890123456789012345678901234567890";
    await client.readContract({
      address: contractAddress as Address,
      functionName: "testFunction",
      args: ["arg1", "arg2"],
    });

    expect(client.request).toHaveBeenCalledWith({
      method: "eth_call",
      params: [
        {
          to: contractAddress,
          from: account,
          data: expect.any(String),
        },
        "latest",
      ],
    });
  });

});
