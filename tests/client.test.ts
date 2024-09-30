// tests/client.test.ts
import {createClient} from "../src/client/client";
import {simulator} from "../src/chains/simulator";

describe("Client Creation", () => {
  it("should create a client for the simulator", () => {
    const client = createClient({chain: simulator});
    expect(client).toBeDefined();
    expect(client.chain).toBe(simulator);
  });
});
