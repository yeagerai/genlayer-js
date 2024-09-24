import {generatePrivateKey, privateKeyToAccount} from "viem/accounts";

export const createAccount = () => {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  return account;
};
