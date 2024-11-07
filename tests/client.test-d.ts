import {createClient} from "../src/client/client";
import {simulator} from "../src/chains/simulator";
import {createAccount, generatePrivateKey} from "../src/accounts/account";

test("type checks", () => {
  const client = createClient({
    chain: simulator,
    account: createAccount(generatePrivateKey()),
  });

  // This should fail type checking - "whatever" is not a valid filter
  // @ts-expect-error "whatever" is not a valid filter type
  void client.request({
    method: "sim_getTransactionsForAddress",
    params: ["0x1234567890123456789012345678901234567890", "whatever"],
  });

  // This should pass type checking - "all", "to" and "from" are valid filters
  void client.request({
    method: "sim_getTransactionsForAddress",
    params: ["0x1234567890123456789012345678901234567890", "all"],
  });

  void client.request({
    method: "sim_getTransactionsForAddress",
    params: ["0x1234567890123456789012345678901234567890", "to"],
  });

  void client.request({
    method: "sim_getTransactionsForAddress",
    params: ["0x1234567890123456789012345678901234567890", "from"],
  });
});
