# Your Own EVM Blockchain (/academy/avalanche-l1/customizing-evm/04-your-evm-blockchain/00-intro)

In this part of the course, we'll explore how to run your own Avalanche L1 with a custom EVM. Running your own EVM allows you to address specific use cases, showcasing one of the key advantages of multi-chain systems over monolithic blockchains.

## Topics

We’ll cover the following topics:

* **Avalanche CLI**: Learn how to configure and launch an Avalanche L1 using the Avalanche CLI.
* **Token Transfer**: Explore how to perform token transfers with Foundry.

This hands-on exercise will solidify your knowledge and allow you to observe how customizations impact EVM performance.

## Learning Objective

By the end of this section, you'll have the skills to effectively run your own Avalanche L1 with a custom EVM blockchain, empowering you to start building your blockchain projects!

<Quiz quizId="3043" />
# Avalanche CLI (/academy/avalanche-l1/customizing-evm/04-your-evm-blockchain/01-avalanche-cli)

## What is the Avalanche CLI?

The Avalanche CLI is a command-line tool that gives developers comprehensive access to Avalanche's functionalities, making it easier to build and test independent blockchains.

Each Avalanche network includes the Primary Network, which consists of the Contract (C), Platform (P), and Exchange (X) chains. It's important to note that "Primary Network" refers to a special Avalanche L1 rather than a distinct, standalone network.

Your local network operates independently from both the Mainnet and Fuji Testnet. You can even run an Avalanche L1 offline. Local Avalanche networks support, but are not limited to, the following commands:

* **Start and Stop a Network**: Easily start or stop a local network.
* **Health Check**: Check the health status of each node in the network.
* **Create Blockchains**: Spin up new blockchains with custom parameters.

Managing a local network with multiple nodes can be complex, but the Avalanche CLI simplifies the process with user-friendly commands.

## Usage

The Precompile-EVM repository comes preloaded with the Avalanche CLI and Foundry, so you don’t need to install additional tools when working within Codespaces. Just use the terminal in your Codespace to run Avalanche CLI commands and start building.

# Create Your Blockchain (/academy/avalanche-l1/customizing-evm/04-your-evm-blockchain/02-create-your-blockchain)

import CreateDefaultBlockchain from "@/content/common/avalanche-starter-kit/create-default-blockchain.mdx";

import defaultMdxComponents from "fumadocs-ui/mdx";

<CreateDefaultBlockchain components={defaultMdxComponents} />

# Sending Tokens (/academy/avalanche-l1/customizing-evm/04-your-evm-blockchain/03-sending-tokens)

To ensure that the blockchain is up and running, let's perform a simple token transfer to a random address, `0x321f6B73b6dFdE5C73731C39Fd9C89c7788D5EBc`, using Foundry:

```bash
cast send --rpc-url myblockchain --private-key $PK 0x321f6B73b6dFdE5C73731C39Fd9C89c7788D5EBc --value 1ether
```

To verify if the transaction was successful, check the balance of the address with the following command:

```bash
cast balance --rpc-url myblockchain 0x321f6B73b6dFdE5C73731C39Fd9C89c7788D5EBc
```

```bash
1000000000000000000
```

You should see that the balance of the address `0x321f6B73b6dFdE5C73731C39Fd9C89c7788D5EBc` is now 1 (1 \* 10^18).

Congratulations! You have successfully sent tokens on your EVM blockchain. 🎉

<Quiz quizId="3044" />

# EVM Configuration (/academy/avalanche-l1/customizing-evm/05-genesis-configuration/00-vm-configuration)

In this part of the course, we'll explore how to optimize your EVM through chain configuration, tailoring it to fit specific use cases. Customizing EVM configurations is a key advantage of multi-chain systems.

## Exercise

In this section, you won’t need to write any Go code. Instead, we’ll adjust values in the JSON file of the genesis block.

## Topics

We will cover the following topics:

* **Genesis Block**: The foundation of any blockchain. We’ll review its components and how to customize its properties.
* **Fee Configuration**: Learn how to balance validator incentives with user affordability. This is crucial for managing network congestion and discouraging wasteful transactions on public networks.
* **Initial Token Allocation**: Understand how to define the initial token distribution in your custom EVM, setting your network up for success.
* **Preinstalled Precompiles**: Discover how to configure preinstalled precompiles to leverage features like restricting who can issue transactions or deploy contracts on your chain.

Finally, we’ll demonstrate how to run a local EVM with a custom Genesis Block. This exercise will solidify your understanding and allow you to observe the performance impact of your EVM customizations.

## Learning Objective

By the end of this section, you'll be able to effectively customize the EVM in Avalanche, unlocking new possibilities for your blockchain projects. Let’s dive into EVM customization and chain configuration together!

# Genesis Block (/academy/avalanche-l1/customizing-evm/05-genesis-configuration/01-genesis-block)

## Background

Each blockchain begins with a genesis state when it is created. For instance, the Ethereum mainnet genesis block included the addresses and balances from the Ethereum pre-sale, marking the initial distribution of ether.

For Subnet-EVM and Precompile-EVM, the genesis block contains additional parameters that allow us to configure the behavior of our customized EVM to meet specific requirements. Since each blockchain has its own genesis block, you can create two blockchains with the same VM but different genesis blocks.

## Format

Here’s an example of a genesis block:

```json
{
  "config": {
    "chainId": 43214,
    "homesteadBlock": 0,
    "eip150Block": 0,
    "eip150Hash": "0x2086799aeebeae135c246c65021c82b4e15a2c451340993aacfd2751886514f0",
    "eip155Block": 0,
    "eip158Block": 0,
    "byzantiumBlock": 0,
    "constantinopleBlock": 0,
    "petersburgBlock": 0,
    "istanbulBlock": 0,
    "muirGlacierBlock": 0,
    "subnetEVMTimestamp": 0,
    "feeConfig": {
      "gasLimit": 15000000,
      "minBaseFee": 25000000000,
      "targetGas": 15000000,
      "baseFeeChangeDenominator": 36,
      "minBlockGasCost": 0,
      "maxBlockGasCost": 1000000,
      "targetBlockRate": 2,
      "blockGasCostStep": 200000
    },
    "allowFeeRecipients": false, 
    "txAllowListConfig": {
      "blockTimestamp": 0,
      "adminAddresses": [
        "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC"
      ]
    }
  },
  "alloc": {
    "8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC": {
      "balance": "0x295BE96E64066972000000"
    }
  },
  "nonce": "0x0",
  "timestamp": "0x0",
  "extraData": "0x00",
  "gasLimit": "0xe4e1c0",
  "difficulty": "0x0",
  "mixHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "coinbase": "0x0000000000000000000000000000000000000000",
  "number": "0x0",
  "gasUsed": "0x0",
  "parentHash": "0x0000000000000000000000000000000000000000000000000000000000000000"
}
```

We will explore the relevant configurable parameters in the upcoming activities. Some parameters (e.g., `eip150Block`, `byzantiumBlock`) are omitted here as they are not relevant for most use cases.

This version provides a clean and concise explanation of the genesis block and its structure, keeping the focus on what's essential.

<Quiz quizId="3045" />

# Create Your Genesis File (/academy/avalanche-l1/customizing-evm/05-genesis-configuration/02-create-your-genesis)

import { Callout } from 'fumadocs-ui/components/callout';

## Create File

In your Precompile-EVM project, create a file called `evm-configuration-genesis.json` in the directory `tests/precompile/genesis/` and open it. You can use the command below as a shortcut to open the file in VSCode:

```bash
code ./tests/precompile/genesis/evm-configuration-genesis.json
```

## Fill with template

Paste the following template in the new file:

```json
{
    "config": {
      "chainId":  <your-chain-id>,
      "homesteadBlock": 0,
      "eip150Block": 0,
      "eip150Hash": "0x2086799aeebeae135c246c65021c82b4e15a2c451340993aacfd2751886514f0",
      "eip155Block": 0,
      "eip158Block": 0,
      "byzantiumBlock": 0,
      "constantinopleBlock": 0,
      "petersburgBlock": 0,
      "istanbulBlock": 0,
      "muirGlacierBlock": 0,
      "subnetEVMTimestamp": 0,
      "feeConfig": {
        "gasLimit": <your-gas-limit>,
        "minBaseFee": <your-min-base-fee>,
        "targetGas": <your-target-gas>,
        "baseFeeChangeDenominator": 36,
        "minBlockGasCost": <your-min-block-gas-cost>,
        "maxBlockGasCost": <your-max-block-gas-cost>,
        "targetBlockRate": <your-target-block-rate>,
        "blockGasCostStep": <your-block-gas-cost-step>
      },
      "allowFeeRecipients": false
    },
    "alloc": {
      "<your-test-wallet-address>": {
        "balance": "<your-initial-balance-converted-to-hex>"
      }
    },
    "nonce": "0x0",
    "timestamp": "0x0",
    "extraData": "0x00",
    "gasLimit": <your-gas-limit>,
    "difficulty": "0x0",
    "mixHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "coinbase": "0x0000000000000000000000000000000000000000",
    "number": "0x0",
    "gasUsed": "0x0",
    "parentHash": "0x0000000000000000000000000000000000000000000000000000000000000000"
  }
```

<Callout title="Warning about gasLimit" type="warn">
  If you do decide to set your own gasLimit, please set all gasLimit keys equal to the same value!

  If you set the 'gasLimit' keys to different values, you will still be able to deploy a blockchain, but it will halt during initialization!
</Callout>

# Create Your Genesis File (/academy/avalanche-l1/customizing-evm/05-genesis-configuration/02-create-your-genesis)

import { Callout } from 'fumadocs-ui/components/callout';

## Create File

In your Precompile-EVM project, create a file called `evm-configuration-genesis.json` in the directory `tests/precompile/genesis/` and open it. You can use the command below as a shortcut to open the file in VSCode:

```bash
code ./tests/precompile/genesis/evm-configuration-genesis.json
```

## Fill with template

Paste the following template in the new file:

```json
{
    "config": {
      "chainId":  <your-chain-id>,
      "homesteadBlock": 0,
      "eip150Block": 0,
      "eip150Hash": "0x2086799aeebeae135c246c65021c82b4e15a2c451340993aacfd2751886514f0",
      "eip155Block": 0,
      "eip158Block": 0,
      "byzantiumBlock": 0,
      "constantinopleBlock": 0,
      "petersburgBlock": 0,
      "istanbulBlock": 0,
      "muirGlacierBlock": 0,
      "subnetEVMTimestamp": 0,
      "feeConfig": {
        "gasLimit": <your-gas-limit>,
        "minBaseFee": <your-min-base-fee>,
        "targetGas": <your-target-gas>,
        "baseFeeChangeDenominator": 36,
        "minBlockGasCost": <your-min-block-gas-cost>,
        "maxBlockGasCost": <your-max-block-gas-cost>,
        "targetBlockRate": <your-target-block-rate>,
        "blockGasCostStep": <your-block-gas-cost-step>
      },
      "allowFeeRecipients": false
    },
    "alloc": {
      "<your-test-wallet-address>": {
        "balance": "<your-initial-balance-converted-to-hex>"
      }
    },
    "nonce": "0x0",
    "timestamp": "0x0",
    "extraData": "0x00",
    "gasLimit": <your-gas-limit>,
    "difficulty": "0x0",
    "mixHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "coinbase": "0x0000000000000000000000000000000000000000",
    "number": "0x0",
    "gasUsed": "0x0",
    "parentHash": "0x0000000000000000000000000000000000000000000000000000000000000000"
  }
```

<Callout title="Warning about gasLimit" type="warn">
  If you do decide to set your own gasLimit, please set all gasLimit keys equal to the same value!

  If you set the 'gasLimit' keys to different values, you will still be able to deploy a blockchain, but it will halt during initialization!
</Callout>

# Gas Fees and Gas Limit (/academy/avalanche-l1/customizing-evm/05-genesis-configuration/04-gas-fees-and-limit)

## Background

In the context of the EVM, gas is a unit that measures the computational effort required to execute specific operations. Each operation performed by a contract or transaction on an EVM chain consumes a certain number of gas units based on its complexity. Operations that require more computational resources cost more gas. The EVM calculates the required gas units automatically, and developers are encouraged to optimize their contract code to reduce gas consumption.

The cost of executing a transaction is determined by the gas units consumed and the gas price, calculated as follows:

```
Transaction Cost = Gas Units * Gas Price
```

For EVM Avalanche L1s, gas payment can be configured to better suit the use case of the Avalanche L1. This means that the Avalanche L1 design can decide whether the gas fees are burned, paid to incentivize validators, or used for any other custom behavior.

## Purpose

The primary goal of setting and enforcing computational costs via gas is to prevent spam and abuse on the network. By requiring users to pay for each computational step, the network deters malicious actors from launching denial-of-service (DoS) attacks, which involve flooding the network with spurious transactions. Essentially, the gas system serves as a deterrent against such attacks.

## Gas Price and Gas Limit

Each transaction specifies the gas price and gas limit:

**`Gas Price`:** The gas price is the amount of the Avalanche L1's native token that the sender is willing to spend per unit of gas, typically denoted in `gwei` (1 native token = 1,000,000,000 `gwei`). A well-designed gas mechanism adapts the gas price according to network activity to protect the network from spam.

**`Gas Limit`:** The gas limit is the maximum amount of gas the sender is willing to use for the transaction. It was introduced to prevent infinite loops in contract execution. In a Turing-complete language like Solidity (the main programming language in the EVM), it is possible to write a contract with an infinite loop, either accidentally or intentionally. While an infinite loop might be a nuisance in traditional computing, it could cause significant issues in a decentralized blockchain by causing the network to hang as it attempts to process a never-ending transaction. The gas limit prevents this by halting execution once the gas consumed reaches the limit.

If a transaction exceeds the gas limit, it fails, but the fee amounting to the gas limit is still paid by the sender.

<Quiz quizId="3047" />

# Gas Fees Configuration (/academy/avalanche-l1/customizing-evm/05-genesis-configuration/05-gas-fee-configuration)

## Configuration Format

The fees are configured in the `chainConfig` in the `feeConfig` field:

```json
{
  "config": {
    // ...
    "feeConfig": { // [!code highlight]
      "gasLimit": 15000000,
      "minBaseFee": 25000000000,
      "targetGas": 15000000,
      "baseFeeChangeDenominator": 36,
      "minBlockGasCost": 0,
      "maxBlockGasCost": 1000000,
      "targetBlockRate": 2,
      "blockGasCostStep": 200000
    },
    "allowFeeRecipients": false
  },
  "alloc": {
    // ...
  },
  // ...
    
  "gasLimit": 0xe4e1c0,
  // ...
}
```

## Gas Configuration Parameters

### `gasLimit`

Sets the maximum amount of gas consumed per block. This restriction caps the computational capacity of a single block and thereby limits the maximum gas usage allowed for any single transaction. For reference, the C-Chain value is set to 15,000,000.

You might notice that the `gasLimit` field appears twice. This is because Avalanche introduced its own fee configuration under the `feeConfig` key while maintaining compatibility with the standard EVM configuration. Ensure that both fields have the same decimal and hexadecimal equivalent values.

### `targetBlockRate`

Specifies the target rate of block production in seconds. For instance, a target of 2 aims to produce a block every 2 seconds. If blocks are produced faster than this rate, it signals that more blocks are being issued to the network than anticipated, leading to an increase in base fees. For C-Chain, this value is set to 1.

### `minBaseFee`

Establishes a lower bound on the EIP-1559 base fee for a block. This minimum base fee effectively sets the minimum gas price for any transaction included in that block.

### `targetGas`

Indicates the targeted amount of gas (including block gas cost) to be consumed within a rolling 10-second window. The dynamic fee algorithm adjusts the base fee proportionally based on how actual network activity compares to this target. If network activity exceeds the `targetGas`, the base fee is increased accordingly.

### `baseFeeChangeDenominator`

Determines how much to adjust the base fee based on the difference between actual and target utilization. A larger denominator results in a slower-changing base fee, while a smaller denominator allows for quicker adjustments. For C-Chain, this value is set to 36, meaning the base fee changes by a factor of 1/36 of the parent block's base fee.

### `minBlockGasCost`

Sets the minimum amount of gas charged for the production of a block. In the C-Chain, this value is set to 0.

### `maxBlockGasCost`

Specifies the maximum amount of gas charged for the production of a block.

### `blockGasCostStep`

Defines how much to increase or decrease the block gas cost based on the time elapsed since the previous block. If a block is produced at the target rate, the block gas cost remains the same as the parent block. If the production rate deviates from the target, the block gas cost is adjusted by the `blockGasCostStep` value for each second faster or slower than the target block rate.

# Initial Token Allocation (/academy/avalanche-l1/customizing-evm/05-genesis-configuration/07-initial-token-allocation)

import { Callout } from 'fumadocs-ui/components/callout';

## Background

`Alloc` defines the initial balances of addresses at the time of chain creation. This field should be modified according to the specific requirements of each chain.

If no genesis allocation is provided, you won't be able to interact with your new chain, as all transactions require a fee to be paid from the sender's balance. Without an initial allocation, there will be no funds available to cover transaction fees.

## Format

The `alloc` field expects key-value pairs. Keys must be valid addresses, and the balance field in each value can be either a hexadecimal or decimal number representing the initial balance of the address.

```json
{
  "config": {
    // ...
  },
  "alloc": { // [!code highlight]
    "8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC": {
      "balance": "0x295BE96E64066972000000" // 50,000,000 tokens
    }
  },
  // ...
}
```

Keys in the allocation are hex addresses without the canonical 0x prefix. Balances are denominated in `Wei` (10^18 `Wei` = 1 Whole Unit of the native token of the chain) and expressed as hex strings with the canonical 0x prefix. Use [this converter](https://www.rapidtables.com/convert/number/hex-to-decimal.html) for translating between decimal and hex numbers.

The default configuration for testing purposes allocates a significant number of tokens to the address `8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC`.

The private key for this address (as defined in the `.devcontainer`) is: `56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027`.

<Callout title="Warning" type="warn">
   Never use this address or private key for anything other than testing on a local test network. The private key is publicly known, and any real funds transferred to this address are likely to be stolen. 
</Callout>

## Configure

Allocate tokens to two addresses:

* The well-known test address `8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC`.
* Another test address that you have created (avoid using addresses associated with real funds).

```json
{
  "config": {
    // ...
  },
  "alloc": {
    "8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC": { // [!code highlight]
      "balance": "0x295BE96E64066972000000" // 50,000,000 tokens
    },
    "<your_address>": { // [!code highlight]
      "balance": "0x295BE96E64066972000000" // 50,000,000 tokens
    }
  },
  // ...
}

```

<Quiz quizId="3049" />

# Build and Run Custom Genesis EVM (/academy/avalanche-l1/customizing-evm/05-genesis-configuration/08-build-and-run-custom-genesis-blockchain)

<Steps>
  <Step>
    ### Build Your Precompile-EVM

    There's a simple build script in the Precompile-EVM we can utilize to build. First, make sure you are in the root folder of you Precompile-EVM:

    ```bash
    cd $GOPATH/src/github.com/ava-labs/precompile-evm
    ```

    Then run the command to initiate the build script:

    ```bash
    ./scripts/build.sh
    ```
  </Step>

  <Step>
    ### Create your blockchain configuration

    You can run your Precompile-EVM by using the Avalanche CLI.

    First, create the configuration for your blockchain:

    ```bash
    avalanche blockchain create myblockchain \
     --custom \
     --vm $VM_PATH \
     --genesis "./.devcontainer/genesis-example.json" \
     --force \
     --sovereign=false \
     --evm-token "TOK" \
     --warp \
     --icm
    ```
  </Step>

  <Step>
    ### Launch L1 with you customized EVM

    ```bash
    avalanche blockchain deploy myblockchain --local
    ```

    After around 1 minute, the blockchain should have been created, and additional output will appear in
    the terminal. You'll also see the RPC URL of your blockchain in the terminal.
  </Step>
</Steps>

<Quiz quizId="3048" />

# What are Stateful Precompiles? (/academy/avalanche-l1/customizing-evm/09-stateful-precompiles/00-intro)

When building the MD5 and Calculator precompiles, we emphasized their behavior. We focused on building precompiles that developers could call in Solidity to perform some algorithm and then simply return a result.

However, one aspect that we have yet to explore is the statefulness of precompiles. Simply put, precompiles can store data which is persistent. To understand how this is possible, recall the interface that our precompile needed to implement:

```go
// StatefulPrecompiledContract is the interface for executing a precompiled contract
type StatefulPrecompiledContract interface {
    // Run executes the precompiled contract.
    Run(accessibleState AccessibleState, 
        caller common.Address, 
        addr common.Address, 
        input []byte, 
        suppliedGas uint64, 
        readOnly bool) 
        (ret []byte, remainingGas uint64, err error)
}
```

We also examined all parameters except for the `AccessibleState` parameter. As the name suggests, this parameter lets us access the blockchain's state. Looking at the interface of `AccessibleState`, we have the following:

```go
// AccessibleState defines the interface exposed to stateful precompile contracts
type AccessibleState interface {
    GetStateDB() StateDB
    GetBlockContext() BlockContext
    GetSnowContext() *snow.Context
}
```

Looking closer, we see that `AccessibleState` gives us access to **StateDB**, which is used to store the state of the EVM. However, as we will see throughout this section, `AccessibleState` also gives us access to other useful parameters, such as `BlockContext` and `snow.Context`.

## StateDB

The parameter we will use the most when it comes to stateful precompiles, StateDB, is a key-value mapping that maps:

* **Key**: a tuple consisting of an address and the storage key of the type Hash
* **Value**: any data encoded in a Hash, also called a word in the EVM

A Hash in go-ethereum is a 32-byte array. In this context, we do not refer to hashing in the cryptographic sense. Rather, "hashing a value" means encoding it to a hash, a 32-byte array usually represented in hexadecimal digits in Ethereum.

```go
const (
    // HashLength is the expected length of the hash
    HashLength = 32
)

// Hash represents the 32 byte of arbitrary data.
type Hash [HashLength]byte

// Example of a data encoded in a Hash: 
// 0x00000000000000000000000000000000000000000048656c6c6f20576f726c64
Below is the interface of StateDB:
// StateDB is the interface for accessing EVM state
type StateDB interface {
    GetState(common.Address, common.Hash) common.Hash
    SetState(common.Address, common.Hash, common.Hash)

    SetNonce(common.Address, uint64)
    GetNonce(common.Address) uint64

    GetBalance(common.Address) *big.Int
    AddBalance(common.Address, *big.Int)

    CreateAccount(common.Address)
    Exist(common.Address) bool

    AddLog(addr common.Address, topics []common.Hash, data []byte, blockNumber uint64)
    GetPredicateStorageSlots(address common.Address) ([]byte, bool)

    Suicide(common.Address) bool
    Finalise(deleteEmptyObjects bool)

    Snapshot() int
    RevertToSnapshot(int)
}
```

As you can see in the interface of the **StateDB**, the two functions for writing to and reading from the EVM state all work with the Hash type.

1. The function **GetState** takes an address and a Hash (the storage key) as inputs and returns the Hash stored at that slot.
2. The function **SetState** takes an address, a Hash (the storage key), and another Hash (data to be stored) as inputs.

We can also see that the **StateDB** interface allows us to read and write account balances of the native token (via GetBalance/SetBalance), check whether an account exists (via Exist), and some other methods.

## BlockContext

`BlockContext` provides info about the current block. In particular, we can get the current block number and the current block timestamp. Below is the interface of `BlockContext`:

```go
// BlockContext defines an interface that provides information to a stateful precompile about the current block.
// The BlockContext may be provided during both precompile activation and execution.
type BlockContext interface {
    Number() *big.Int
    Timestamp() *big.Int
}
```

An example of how we could leverage `BlockContext` in precompiles: *building a voting precompile that only accepts votes within a certain time frame*.

## snow\.Context

`snow.Context` gives us info regarding the environment of the precompile. In particular, `snow.Context` tells us about the state of the network the precompile is hosted on. Below is the interface of `snow.Context`:

```go
// Context is information about the current execution.
// [NetworkID] is the ID of the network this context exists within.
// [ChainID] is the ID of the chain this context exists within.
// [NodeID] is the ID of this node
type Context struct {
    NetworkID uint32
    Avalanche L1ID  ids.ID
    ChainID   ids.ID
    NodeID    ids.NodeID
    PublicKey *bls.PublicKey

    XChainID    ids.ID
    CChainID    ids.ID
    AVAXAssetID ids.ID

    Log          logging.Logger
    Lock         sync.RWMutex
    Keystore     keystore.BlockchainKeystore
    SharedMemory atomic.SharedMemory
    BCLookup     ids.AliaserReader
    Metrics      metrics.OptionalGatherer

    WarpSigner warp.Signer

    // snowman++ attributes
    ValidatorState validators.State // interface for P-Chain validators
    // Chain-specific directory where arbitrary data can be written
    ChainDataDir string
}
```

<Quiz quizId="3056" />
