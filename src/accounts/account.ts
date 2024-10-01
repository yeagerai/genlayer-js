import {generatePrivateKey as _generatePrivateKey, privateKeyToAccount} from "viem/accounts";

export const generatePrivateKey = () => _generatePrivateKey();

export const createAccount = (accountPrivateKey?: `0x${string}`) => {
  const privateKey = accountPrivateKey || generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  return account;
};
