# GenLayerJS

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/license/mit/)
[![Discord](https://dcbadge.vercel.app/api/server/8Jm4v89VAu?compact=true&style=flat)](https://discord.gg/VpfmXEMN66)
[![Twitter](https://img.shields.io/twitter/url/https/twitter.com/yeagerai.svg?style=social&label=Follow%20%40GenLayer)](https://x.com/GenLayer)
[![GitHub star chart](https://img.shields.io/github/stars/yeagerai/genlayer-js?style=social)](https://star-history.com/#yeagerai/genlayer-js)

## 👀 About

GenLayerJS SDK is a TypeScript library designed for developers building decentralized applications (Dapps) on the GenLayer protocol. This SDK provides a comprehensive set of tools to interact with the GenLayer network, including client creation, transaction handling, event subscriptions, and more, all while leveraging the power of Viem as the underlying blockchain client.

## Prerequisites

Before installing GenLayerJS SDK, ensure you have the following prerequisites installed:

- Node.js (>= 16.x)
- npm (>= 7.x)

## 🛠️ Installation and Usage

To install the GenLayerJS SDK, use the following command:
```bash
$ npm install genlayer-js
```
Here's how to initialize the client and connect to the GenLayer Simulator:

### Basic Client Setup
```typescript
import { localnet } from 'genlayer-js/chains';
import { createClient } from "genlayer-js";

const client = createClient({
  chain: localnet,
});
```

### Transaction Operations

#### Reading a Transaction
```typescript
const transactionHash = "0x...";
const transaction = await client.getTransaction({ hash: transactionHash });
```

#### Waiting for Transaction Receipt
```typescript
import { TransactionStatus } from "genlayer-js";

const receipt = await client.waitForTransactionReceipt({ 
  hash: transactionHash, 
  status: TransactionStatus.FINALIZED // or TransactionStatus.ACCEPTED
});
```

### Contract Operations

#### Reading from a Contract
```typescript
const result = await client.readContract({
  // account: account, // Account is optional when reading from contracts
  address: contractAddress,
  functionName: 'get_complete_storage',
  args: [],
  // Optional parameters:
  transactionHashVariant: 'latest_final'
});
```

#### Writing to a Contract
```typescript
const transactionHash = await client.writeContract({
  account: account, // using this account for this transaction
  address: contractAddress,
  functionName: 'update_storage',
  args: ['new_storage'],
  value: 0n, // value in wei, optional
  // Optional parameters:
  consensusMaxRotations: 3
});
```

#### Deploying a Contract
```typescript
const contractCode = "0x..."; // or Uint8Array
const deployTxHash = await client.deployContract({
  account: account,
  code: contractCode,
  args: ['constructor_arg1', 'constructor_arg2'], // constructor arguments
  // Optional parameters:
  consensusMaxRotations: 3
});
```

#### Getting Contract Schema (Localnet only)
```typescript
// Get schema for deployed contract
const schema = await client.getContractSchema(contractAddress);

// Get schema for contract code before deployment
const schemaFromCode = await client.getContractSchemaForCode(contractCode);
```

#### Appealing a Transaction
```typescript
const appealTxHash = await client.appealTransaction({
  account: account,
  txId: "0x..." // transaction ID to appeal
});
```

### Account Operations

#### Funding an Account (Localnet only)
```typescript
const fundTxHash = await client.fundAccount({
  address: account.address,
  amount: 1000 // amount to fund
});
```

#### Getting Current Nonce
```typescript
const nonce = await client.getCurrentNonce({
  address: account.address,
  block: "latest" // optional, defaults to "latest"
});
```

### Chain Operations

#### Initialize Consensus Smart Contract
```typescript
// Initialize consensus contract (usually done automatically)
await client.initializeConsensusSmartContract(false); // forceReset = false
```

### Wallet Integration

#### Connect to MetaMask
```typescript
import { Network, SnapSource } from "genlayer-js";

// Connect to wallet
await client.connect(Network.TESTNET, SnapSource.NPM);

// Get MetaMask client
const metamaskClient = client.metamaskClient(SnapSource.NPM);
```

### Advanced Usage Examples

#### Complete Contract Interaction Flow
```typescript
import { localnet } from 'genlayer-js/chains';
import { createClient, createAccount, TransactionStatus } from "genlayer-js";

const client = createClient({
  chain: localnet,
});

const account = createAccount();

// Fund the account (localnet only)
await client.fundAccount({
  address: account.address,
  amount: 1000
});

// Deploy a contract
const contractCode = "0x...";
const deployTxHash = await client.deployContract({
  account: account,
  code: contractCode,
  args: ['initial_value']
});

// Wait for deployment to be finalized
const deployReceipt = await client.waitForTransactionReceipt({
  hash: deployTxHash,
  status: TransactionStatus.FINALIZED
});

// Read from the deployed contract
const result = await client.readContract({
  address: deployReceipt.contractAddress,
  functionName: 'get_value',
  args: []
});

// Write to the contract
const writeTxHash = await client.writeContract({
  account: account,
  address: deployReceipt.contractAddress,
  functionName: 'set_value',
  args: ['new_value'],
  value: 0n
});

// Wait for write transaction to be accepted
const writeReceipt = await client.waitForTransactionReceipt({
  hash: writeTxHash,
  status: TransactionStatus.ACCEPTED
});
```

## 🚀 Key Features

* **Client Creation**: Easily create and configure a client to connect to GenLayer's network.
* **Transaction Handling**: Send and manage transactions on the GenLayer network.
* **Wallet Integration***: Seamless integration with MetaMask for managing user accounts.
* **Gas Estimation***: Estimate gas fees for executing transactions on GenLayer.

_* under development_

## 📖 Documentation

For detailed information on how to use GenLayerJS SDK, please refer to our [documentation](https://docs.genlayer.com/).

## Contributing

We welcome contributions to GenLayerJS SDK! Whether it's new features, improved infrastructure, or better documentation, your input is valuable. Please read our [CONTRIBUTING](https://github.com/yeagerai/genlayer-js/blob/main/CONTRIBUTING.md) guide for guidelines on how to submit your contributions.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
