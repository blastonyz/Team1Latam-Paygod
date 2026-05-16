# What are Precompiles? (/academy/avalanche-l1/customizing-evm/06-precompiles/01-what-are-precompiles)

Precompiled contracts allow the execution of code written in the low-level programming language Go from the EVM, which is significantly faster and more efficient than Solidity.

## Overview

If you're familiar with Python, you might recognize a similar concept where many Python functions and libraries are implemented in C for efficiency. Python developers can import these precompiled modules and call functions as if they were written in Python. The main difference is that the modules execute faster and more efficiently.

Precompiles can be called from a Solidity smart contract just like any other contract. The EVM maintains a list of reserved addresses mapped to precompiles. When a smart contract calls a function of a contract at one of these addresses, the EVM executes the precompile written in Go instead of the Solidity contract.

For example, if we map the address `0x030...01` to the SHA256 precompile that hashes its input using the SHA256 hash function, we can call the precompile as follows:

```solidity
// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

interface ISHA256 {
    // Computes the SHA256 hash of value
    function hashWithSHA256(string memory value) external view returns(bytes32 hash);
}

contract MyContract {  
    ISHA256 mySHA256Precompile = ISHA256(0x0300000000000000000000000000000000000001);
    
    function doSomething() public {
        bytes32 hash = mySHA256Precompile.hashWithSHA256("test");
    }
}
```

In the code above, we call the precompile using the defined interface for our SHA256 precompile within `MyContract`.

Note that there is no implementation of the precompile in Solidity itself. This will only work if the precompile is implemented in Go and registered at the address `0x030...01`.

### PrecompiledContract Interface

When implementing a precompile in the Avalanche L1-EVM, the following function of the `StatefulPrecompiledContract` interface must be implemented in Go:

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

We will cover the meaning of "stateful" and the first parameter `accessibleState` later. For now, let's focus on the function that specifies the logic of our precompile, which provides access to the following data:

* caller: The address of the account that called the precompile.
* addr: The address of the precompile being called.
* input: All inputs encoded in a byte array.
* suppliedGas: The amount of gas supplied for the precompile call.
* readOnly: A boolean flag indicating if the interaction is only reading or modifying the state.

The precompile implementation must return the following values:

* ret: All return values encoded in a byte array.
* remainingGas: The amount of gas remaining after execution.
* err: If an error occurs, return it. Otherwise, return nil.

<Quiz quizId="3046" />

# Why Precompiles? (/academy/avalanche-l1/customizing-evm/06-precompiles/02-why-precompiles)

Adding precompiles to the EVM offers several significant advantages, which we will outline in this chapter.

## Performance Optimization

Precompiles primarily optimize the performance of specific computations. Introducing a new precompile can greatly reduce the computational resources required for certain tasks, thereby enhancing the performance of smart contracts and decentralized applications (DApps) that rely on these tasks.

For instance, the SHA256 hash function (0x02) and the RIPEMD160 hash function (0x03) serve as examples of precompiles that significantly boost performance. Implementing these functions within a smart contract would be computationally expensive and slow, whereas as precompiles, they execute quickly and efficiently.

## Security

Incorporating a function as a precompile allows developers to leverage libraries that have been thoroughly reviewed and audited, thus reducing the risk of bugs and vulnerabilities, which enhances overall security.

For example, the ModExp (0x05) precompile safely performs modular exponentiation, a complex mathematical operation utilized in various cryptographic functions.

## Access to Go Libraries

Precompiles are implemented in Go, allowing access to the rich ecosystem of existing Go libraries. This access eliminates the need for reimplementation, which can be labor-intensive and carries the risk of introducing bugs during the translation from Go to Solidity.

Consider the implementation of the SHA256 hash algorithm to understand the complexity involved in reimplementing it in Solidity.

## Gas Efficiency

Introducing a new precompile to the EVM can enhance gas efficiency for specific computations, thereby lowering execution costs. This makes it feasible to incorporate more complex operations into smart contracts, expanding their functionality without significantly increasing transaction costs.

The identity precompile (0x04), which copies and returns input data, exemplifies this. Though simple, it provides gas efficiency by being faster and cheaper than implementing the same functionality in a standard contract.

## Advanced Features and Functionality

By adding new precompiles to the EVM, developers can introduce advanced features and functionalities, such as complex mathematical calculations, advanced cryptographic operations, and new data structures. This can unlock new possibilities for DApps and smart contracts, enabling them to execute tasks that would otherwise be too computationally demanding or technically challenging.

Precompiles for elliptic curve operations, such as ecadd (0x06), ecmul (0x07), and ecpairing (0x08), enable advanced cryptographic functionality within EVM smart contracts. These precompiles are crucial for implementing zk-SNARKs, a form of zero-knowledge proof, in Ethereum.

## Interoperability

Certain precompiles can enhance the interoperability of the EVM with other blockchains or systems. For instance, precompiles can be utilized to verify proofs from other chains or perform operations compatible with different cryptographic standards.

The BLS12-381 elliptic curve operations precompiles (0x0a through 0x13, added in the Istanbul upgrade) improve EVM interoperability by allowing operations that are compatible with the BLS signature scheme, potentially facilitating inter-blockchain communication.

<Quiz quizId="3050" />

# Interact with a Precompile (/academy/avalanche-l1/customizing-evm/06-precompiles/03-interact-wtih-precompile)

So let's get to it and interact with a precompile on the C-Chain of your local network. The SHA256 precompile is already available on the C-Chain.

## Call Precompile from Foundry

In this example, we will call the SHA256 precompile to generate hash of the input string.

**Precompile Address:** `0x0000000000000000000000000000000000000002`

```bash
cast call --rpc-url local-c --private-key $PK 0x0000000000000000000000000000000000000002 "run(string)(bytes32)" "test"
```

You should see a bytes32 hash of the input string `test` as the output.

```bash
0xa770b926e13a31fb823282e9473fd1da9e85afe23690336770c490986ef1b1fc
```

<Quiz quizId="3051" />

# Create an MD5 Solidity Interface (/academy/avalanche-l1/customizing-evm/07-hash-function-precompile/01-create-solidity-interface)

The first step is defining the interface that will wrap the precompile implementation and that other contracts and users will interact with. In addition to declaring the way users can interact with our MD5 precompile, defining the MD5 interface will also allow us to utilize a generator script. A precompile consists of many files, and generating boilerplate Go files will make implementing the precompile much easier.

## SHA-256 Precompile Interface

Before defining the MD5 interface, we will first look at the interface of the very similar SHA-256 precompile. This reference implementation is included in the repository we have created earlier.

```solidity title="contracts/contracts/interfaces/ISHA256.sol"
// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

interface ISHA256 {
    /// Compute the hash of value
    /// @param value the value to be hashed
    /// @return hash the hash of the value
    function hashWithSHA256(string memory value) external view returns(bytes32 hash);
    }
```

ISHA256 contains a single function `hashWithSHA256`. `hashWithSHA256` takes in a value of type string, which is the value which is to be hashed, and outputs a 32-byte hash.

## Creating the Solidity Interface For The MD5 Precompile

Now it's your turn to define a precompile interface!

Create the interface for the MD5 hash function. Start by going into the same directory where `ISHA256.sol` lives (`contracts/contracts/interfaces/`) and create a new file named `IMD5.sol`. Note that:

→ MD5 returns a 16-byte hash instead of a 32-byte hash

→ Make sure to name all parameters and return values

<Accordions>
  <Accordion title="Solution">
    ```solidity title="contracts/contracts/interfaces/IMD5.sol"
    // SPDX-License-Identifier: MIT

    pragma solidity >=0.8.0;

    interface IMD5 {
        function hashWithMD5(string memory value) external view returns (bytes16 hash);
    }
    ```
  </Accordion>
</Accordions>

## Generate the ABI

Now that we have an interface of our precompile, let's create an ABI of our Solidity interface. Open the integrated VS Code terminal (control + \`), and change to the `/contracts` directory.

```bash
cd contracts
```

Run the command to compile the solidity interface to the ABI:

```bash
npx solc@latest --abi ./contracts/interfaces/IMD5.sol -o ./abis --base-path . --include-path ./node_modules
```

Rename the file:

```bash
mv ./abis/contracts_interfaces_IMD5_sol_IMD5.abi ./abis/IMD5.abi
```

Now, you should have a file called `IMD5.abi` in the folder `/contracts/abis` with the following content:

```json
[
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "value",
                "type": "string"
            }
        ],
        "name": "hashWithMD5",
        "outputs": [
            {
                "internalType": "bytes16",
                "name": "hash",
                "type": "bytes16"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]
```
# Generate the Precompile (/academy/avalanche-l1/customizing-evm/07-hash-function-precompile/02-generate-the-precompile)

import { File, Files, Folder } from 'fumadocs-ui/components/files';

In the last section, we created the ABI for our precompile contract. Now, we'll use the precompile generation script provided by the precompile-evm template to generate a boilerplate code in go for the precompile implementation that will be wrapped in the solidity interface we created in the previous step.

## Running the Generation Script

To start, go to the root directory of your precompile-evm project:

```bash
cd ..
```

Now generate the files necessary for the precompile.

```bash
./scripts/generate_precompile.sh --abi ./contracts/abis/IMD5.abi --type Md5 --pkg md5 --out ./md5
```

Now you should have a new directory in your root directory called `md5`:

<Files>
  <File name="LICENSE" />

  <File name="README.md" />

  <Folder name="contracts">
    <File name="..." />
  </Folder>

  <File name="go.mod" />

  <File name="go.sum" />

  <Folder name="sha256">
    <File name="..." />
  </Folder>

  <Folder name="md5" defaultOpen>
    <File name="README.md" />

    <File name="config.go" />

    <File name="config_test.go" />

    <File name="contract.abi" />

    <File name="contract.go" />

    <File name="contract_test.go" />

    <File name="module.go" />
  </Folder>

  <Folder name="plugin">
    <File name="main.go" />
  </Folder>

  <Folder name="scripts">
    <File name="build.sh" />

    <File name="..." />
  </Folder>

  <Folder name="tests">
    <File name="..." />
  </Folder>
</Files>

### `contract.go`

For the rest of this chapter, we'll work with the `md5/contract.go` file. If you generated the Go files related to your precompile, `contract.go` should look like the code below.

Do not be intimidated if much of this code does not make sense to you. We'll cover the different parts and add some code to implement the logic of our MD5 precompile.

```go
// Code generated
// This file is a generated precompile contract config with stubbed abstract functions.
// The file is generated by a template. Please inspect every code and comment in this file before use.

package md5

import (
	"errors"
	"fmt"
	"math/big"

	"github.com/ava-labs/subnet-evm/accounts/abi"
	"github.com/ava-labs/subnet-evm/precompile/contract"
	"github.com/ava-labs/subnet-evm/vmerrs"

	_ "embed"

	"github.com/ethereum/go-ethereum/common"
)

const (
	// Gas costs for each function. These are set to 1 by default.
	// You should set a gas cost for each function in your contract.
	// Generally, you should not set gas costs very low as this may cause your network to be vulnerable to DoS attacks.
	// There are some predefined gas costs in contract/utils.go that you can use.
	HashWithMD5GasCost uint64 = 1 /* SET A GAS COST HERE */
)

// CUSTOM CODE STARTS HERE
// Reference imports to suppress errors from unused imports. This code and any unnecessary imports can be removed.
var (
	_ = abi.JSON
	_ = errors.New
	_ = big.NewInt
	_ = vmerrs.ErrOutOfGas
	_ = common.Big0
)

// Singleton StatefulPrecompiledContract and signatures.
var (

	// Md5RawABI contains the raw ABI of Md5 contract.
	//go:embed contract.abi
	Md5RawABI string

	Md5ABI = contract.ParseABI(Md5RawABI)

	Md5Precompile = createMd5Precompile()
)

// UnpackHashWithMD5Input attempts to unpack [input] into the string type argument
// assumes that [input] does not include selector (omits first 4 func signature bytes)
func UnpackHashWithMD5Input(input []byte) (string, error) {
	res, err := Md5ABI.UnpackInput("hashWithMD5", input)
	if err != nil {
		return "", err
	}
	unpacked := *abi.ConvertType(res[0], new(string)).(*string)
	return unpacked, nil
}

// PackHashWithMD5 packs [value] of type string into the appropriate arguments for hashWithMD5.
// the packed bytes include selector (first 4 func signature bytes).
// This function is mostly used for tests.
func PackHashWithMD5(value string) ([]byte, error) {
	return Md5ABI.Pack("hashWithMD5", value)
}

// PackHashWithMD5Output attempts to pack given hash of type [16]byte
// to conform the ABI outputs.
func PackHashWithMD5Output(hash [16]byte) ([]byte, error) {
	return Md5ABI.PackOutput("hashWithMD5", hash)
}

// UnpackHashWithMD5Output attempts to unpack given [output] into the [16]byte type output
// assumes that [output] does not include selector (omits first 4 func signature bytes)
func UnpackHashWithMD5Output(output []byte) ([16]byte, error) {
	res, err := Md5ABI.Unpack("hashWithMD5", output)
	if err != nil {
		return [16]byte{}, err
	}
	unpacked := *abi.ConvertType(res[0], new([16]byte)).(*[16]byte)
	return unpacked, nil
}

func hashWithMD5(accessibleState contract.AccessibleState, caller common.Address, addr common.Address, input []byte, suppliedGas uint64, readOnly bool) (ret []byte, remainingGas uint64, err error) {
	if remainingGas, err = contract.DeductGas(suppliedGas, HashWithMD5GasCost); err != nil {
		return nil, 0, err
	}
	// attempts to unpack [input] into the arguments to the HashWithMD5Input.
	// Assumes that [input] does not include selector
	// You can use unpacked [inputStruct] variable in your code
	inputStruct, err := UnpackHashWithMD5Input(input)
	if err != nil {
		return nil, remainingGas, err
	}

	// CUSTOM CODE STARTS HERE
	_ = inputStruct // CUSTOM CODE OPERATES ON INPUT

	var output [16]byte // CUSTOM CODE FOR AN OUTPUT
	packedOutput, err := PackHashWithMD5Output(output)
	if err != nil {
		return nil, remainingGas, err
	}

	// Return the packed output and the remaining gas
	return packedOutput, remainingGas, nil
}

// createMd5Precompile returns a StatefulPrecompiledContract with getters and setters for the precompile.

func createMd5Precompile() contract.StatefulPrecompiledContract {
	var functions []*contract.StatefulPrecompileFunction

	abiFunctionMap := map[string]contract.RunStatefulPrecompileFunc{
		"hashWithMD5": hashWithMD5,
	}

	for name, function := range abiFunctionMap {
		method, ok := Md5ABI.Methods[name]
		if !ok {
			panic(fmt.Errorf("given method (%s) does not exist in the ABI", name))
		}
		functions = append(functions, contract.NewStatefulPrecompileFunction(method.ID, function))
	}
	// Construct the contract with no fallback function.
	statefulContract, err := contract.NewStatefulPrecompileContract(nil, functions)
	if err != nil {
		panic(err)
	}
	return statefulContract
}
```
# Packing and Unpacking (/academy/avalanche-l1/customizing-evm/07-hash-function-precompile/03-unpack-input-pack-output)

In this first segment of examining the `contract.go` file generated for us, we will go over the packing and unpacking functions in this file.

## The Notion of Packing

Those eager to implement the MD5 algorithm might be wondering why we're discussing packing. However, there is good reason to discuss packing, and it comes down to the specification of the `staticcall` function in Solidity.

We begin by referring to the example of calling the SHA-256 precompiled contract:

```go
(bool ok, bytes memory out) = address(2).staticcall(abi.encode(numberToHash));
```

As seen above, the `staticcall` function accepts input in bytes format, generated by `abi.encode`, and returns a boolean value indicating success, along with a bytes format output.

Therefore, our precompiled contract should be designed to accept and return data in bytes format, involving the packing and unpacking of values. Since packing is a deterministic process, there's no concern about data corruption during translation. However, some preprocessing or postprocessing is necessary to ensure the contract functions correctly.

## Unpacking Inputs

In `contract.go`, the function `UnpackHashWithMd5Input` unpacks our data and converts it into a type relevant to us. It takes a byte array as an input and returns a Go string. We will look at more complex precompiles that have multiple functions that may take multiple inputs later.

```go
// UnpackHashWithMD5Input attempts to unpack [input] into the string type argument
// assumes that [input] does not include selector (omits first 4 func signature bytes)
func UnpackHashWithMD5Input(input []byte) (string, error) {
    res, err := Md5ABI.UnpackInput("hashWithMD5", input)
    if err != nil {
        return "", err
    }
    unpacked := *abi.ConvertType(res[0], new(string)).(*string)
    return unpacked, nil
}
```

## Packing Outputs

Ignoring `hashWithMD5` for now, note that whatever value `hashWithMD5` outputs, we will need to postprocess it (i.e. pack it). `PackHashWithMD5Output` does just this, taking in an input of type \[16]byte and outputting a byte array which can be returned by `staticcall`.

```go
// PackHashWithMd5Output attempts to pack given hash of type [16]byte
// to conform the ABI outputs.
func PackHashWithMd5Output(hash [16]byte) ([]byte, error) {
    return Md5ABI.PackOutput("hash_with_md5", hash)
}
```

This may seem trivial, but if our Solidity interface defined our function to return a uint or string, the type of our input to this function would differ accordingly.


# Implement the Precompile (/academy/avalanche-l1/customizing-evm/07-hash-function-precompile/04-implementing-precompile)

Now, we'll implement the logic of the precompile in Go. We'll hash our string using the MD5 algorithm.

## SHA-256 Precompile Implementation

Before defining the logic of our MD5 precompile, let's look at the logic of the function `hashWithSHA256` (located in `sha256/contract.go`), which computes the SHA-256 hash of a string:

```go title="sha256/contract.go"
import (
    "crypto/sha256"
    //...
)

// ...

func hashWithSHA256(accessibleState contract.AccessibleState, caller common.Address, addr common.Address, input []byte, suppliedGas uint64, readOnly bool) (ret []byte, remainingGas uint64, err error) {
    if remainingGas, err = contract.DeductGas(suppliedGas, HashWithSHA256GasCost); err != nil {
        return nil, 0, err
    }
    // attempts to unpack [input] into the arguments to the HashWithSHA256Input.
    // Assumes that [input] does not include selector
    // You can use unpacked [inputStruct] variable in your code
    inputStruct, err := UnpackHashWithSHA256Input(input)
    if err != nil {
        return nil, remainingGas, err
    }

    // CUSTOM CODE STARTS HERE
    _ = inputStruct // CUSTOM CODE OPERATES ON INPUT

    var output [32]byte // CUSTOM CODE FOR AN OUTPUT

    output = sha256.Sum256([]byte(inputStruct))
    
    packedOutput, err := PackHashWithSHA256Output(output)
    if err != nil {
        return nil, remainingGas, err
    }

    // Return the packed output and the remaining gas
    return packedOutput, remainingGas, nil
}
```

As you can see, we're performing the following steps:

* Line 1: Importing the sha256 function from the crypto library (at the top of the Go file)
* Line 15: Unpacking the input to the variable inputStruct. It doesn't make sense that the variable has Struct in its name, but you will see why it is done like this when we have multiple inputs in a later example
* Line 24: Calling the sha256 function and assign its result to the output variable
* Line 26: Packing the output into a byte array
* Line 32: Returning the packed output, the remaining gas and nil, since no error has occurred

## Implementing the MD5 Precompile in `contract.go`

Go ahead and implement the `md5/contract.go` for the MD5 precompile. You should only have to write a few lines of code. If you're unsure which function to use, the following documentation might help: [Go Documentation Crypto/md5](https://pkg.go.dev/crypto/md5#Sum)

<Accordions>
  <Accordion title="Solution">
    ```go title="md5/contract.go"
    import (
    	"crypto/md5"
    	// ...
    )

    // ...

    func hashWithMD5(accessibleState contract.AccessibleState, caller common.Address, addr common.Address, input []byte, suppliedGas uint64, readOnly bool) (ret []byte, remainingGas uint64, err error) {func hashWithMD5(accessibleState contract.AccessibleState, caller common.Address, addr common.Address, input []byte, suppliedGas uint64, readOnly bool) (ret []byte, remainingGas uint64, err error) {
    	if remainingGas, err = contract.DeductGas(suppliedGas, HashWithMD5GasCost); err != nil {
    		return nil, 0, err
    	}
    	// attempts to unpack [input] into the arguments to the HashWithMD5Input.
    	// Assumes that [input] does not include selector
    	// You can use unpacked [inputStruct] variable in your code
    	inputStruct, err := UnpackHashWithMD5Input(input)
    	if err != nil {
    		return nil, remainingGas, err
    	}

    	// CUSTOM CODE STARTS HERE
    	_ = inputStruct // CUSTOM CODE OPERATES ON INPUT

    	var output [16]byte // CUSTOM CODE FOR AN OUTPUT
    	output = md5.Sum([]byte(inputStruct))

    	packedOutput, err := PackHashWithMD5Output(output)
    	if err != nil {
    		return nil, remainingGas, err
    	}

    	// Return the packed output and the remaining gas
    	return packedOutput, remainingGas, nil
    }
    ```

    To solve this task, we did the following things:

    * Import the md5 function from the crypto library
    * Unpack the input to a variable inputStruct (It does not make sense that the variable has Struct in its name, but you will see why it is done like this when we have multiple inputs in a later example)
    * Call the md5 function and assign it's result to the output variable
    * Pack the output into a byte array
    * Return the packed output, the remaining gas and nil, since no error has occurred
  </Accordion>
</Accordions>

# ConfigKey, ContractAddress, and Genesis (/academy/avalanche-l1/customizing-evm/07-hash-function-precompile/05-configkey-and-contractaddr)

## Config Key

The precompile config key is used to configure the precompile in the `chainConfig`. It's set in the `module.go` file of our precompile.

The generator chooses an initial value that should be sufficient for many cases. In our case:

```go title="md5/module.go"
// ConfigKey is the key used in json config files to specify this precompile precompileconfig.
// must be unique across all precompiles.
const ConfigKey = "md5Config"
```

This key is used for each precompile in the geneis configuration to set the activation timestamp of the precompile.

## Contract Address

Each precompile has a unique contract address we can use to call it. This is the address we used earlier to instantiate the precompile in our solidity code or in remix when we interacted with the sha256 precompile.

```go title="md5/module.go"
// ContractAddress is the defined address of the precompile contract.
// This should be unique across all precompile contracts.
// See precompile/registry/registry.go for registered precompile contracts and more information.

var ContractAddress = common.HexToAddress("{ASUITABLEHEXADDRESS}") // SET A SUITABLE HEX ADDRESS HERE
```

The `0x01` range is reserved for precompiles added by Ethereum.

The `0x02` range is reserved for precompiles provided by Avalanche.

The `0x03` range is reserved for custom precompiles.

Lets set our contract address to `0x0300000000000000000000000000000000000002`

```go title="md5/module.go"
var ContractAddress = common.HexToAddress("0x0300000000000000000000000000000000000002") // SET A SUITABLE HEX ADDRESS HERE
```

## Update Genesis Configuration

Now that the `ConfigKey` and `ContractAddress` are set, we need to update the genesis configuration to register the precompile.

```json title=".devcontainer/genesis-example.json"
{
  "config": {
    "chainId": 99999,
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
      "gasLimit": 20000000,
      "minBaseFee": 1000000000,
      "targetGas": 100000000,
      "baseFeeChangeDenominator": 48,
      "minBlockGasCost": 0,
      "maxBlockGasCost": 10000000,
      "targetBlockRate": 2,
      "blockGasCostStep": 500000
    },
    "sha256Config": {
      "blockTimestamp": 0
    },
    "md5Config": { // [!code highlight:3]
      "blockTimestamp": 0
    } 
  },
  "alloc": {
    "8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC": {
      "balance": "0x52B7D2DCC80CD2E4000000"
    }
  },
  "nonce": "0x0",
  "timestamp": "0x0",
  "extraData": "0x00",
  "gasLimit": "0x1312D00",
  "difficulty": "0x0",
  "mixHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "coinbase": "0x0000000000000000000000000000000000000000",
  "number": "0x0",
  "gasUsed": "0x0",
  "parentHash": "0x0000000000000000000000000000000000000000000000000000000000000000"
}
```
# Build and Run (/academy/avalanche-l1/customizing-evm/07-hash-function-precompile/07-build-and-run)

Time to build and run your customized EVM. Follow the steps below to build and run your custom VM on a local network.

<Steps>
  <Step>
    ### Build Your Custom VM

    There's a simple build script in the Precompile-EVM we can utilize to build. First, make sure you are in the root folder of you Precompile-EVM:

    ```bash
    cd $GOPATH/src/github.com/ava-labs/precompile-evm
    ```

    Then run the command to initiate the build script:

    ```bash
    ./scripts/build.sh
    ```

    If you do not see any error, the build was successful.
  </Step>

  <Step>
    ### Create your blockchain configuration

    You can run you customized Precompile-EVM by using the Avalanche CLI.

    First, create the configuration for your blockchain with custom VM.

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

    Next, launch the Avalanche L1 with your custom VM:

    ```bash
    avalanche blockchain deploy myblockchain --local
    ```

    After around 1 minute the blockchain should have been created and some more output should appear in
    the terminal. You'll also see the RPC URL of your blockchain in the terminal.
  </Step>
</Steps>
# Interact with Precompile (/academy/avalanche-l1/customizing-evm/07-hash-function-precompile/08-interact-with-md5)

## Call Precompile from Foundry

Now we will call our MD5 precompile to generate a bytes16 hash of the input string.

**MD5 Precompile Address:** `0x0300000000000000000000000000000000000002`

```bash
cast call --rpc-url myblockchain --private-key $PK 0x0300000000000000000000000000000000000002 "hashWithMD5(string)(bytes16)" "test"
```

You should see the bytes16 hash of the input string `test` as the output.

```bash
0x098f6bcd4621d373cade4e832627b4f6
```

<Quiz quizId="3053" />
# Overview (/academy/avalanche-l1/customizing-evm/08-calculator-precompile/00-intro)

import { Step, Steps } from 'fumadocs-ui/components/steps';

## Reference Implementation

In this section, we will showcase how to build a more complex precompile that offers selected simple math operations. Our calculator will support the following operations:

1. Add two numbers and return the result (3 + 5 = 8)
2. Get the next two greater numbers (7 => 8, 9)
3. Repeat a string x times (4, b => bbbb)

This is somewhat odd calculator and real-life usability might not be the best, but as you will see in a bit the operations have been chosen to demonstrate some different scenarios we might face while building precompiles.

## What You Are Building

Similar to the Calculator precompile, you will be building a precompile called **CalculatorPlus** which contains the following mathematical functions:

* **Powers of Three**: takes in as input an integer base; returns the square, cube, and 4th power of the input
* **Modulo+**: takes in as input two arguments: the dividend and the divisor. Returns how many times the dividend fits in the divisor, and the remainder.
* **Simplify Fraction**: takes in two arguments: the numerator and the denominator. Returns the simplfied version of the fraction (if the denominator is 0, we return 0)

## Overview of Steps

Compared to the process before, we will now also add tests for our precompile. Here's a quick overview of the steps we're going to follow:

<Steps>
  <Step>
    Create a Solidity interface for the precompile
  </Step>

  <Step>
    Generate the ABI
  </Step>

  <Step>
    Write the precompile code in Go
  </Step>

  <Step>
    Configure and register the precompile
  </Step>

  <Step>
    Add and run tests
  </Step>

  <Step>
    Build and run your customized EVM
  </Step>

  <Step>
    Connect Remix to your customized EVM and interact with the precompile
  </Step>
</Steps>

This tutorial will help you understand how to create more complex precompiles. Let's begin!

<Quiz quizId="3054" />
# Create Solidity Interface (/academy/avalanche-l1/customizing-evm/08-calculator-precompile/01-create-solidity-interface)

Just like in the MD5 section, we will start off by first demonstrating the Solidity interface for the Calculator precompile before guiding you on how to build the **CalculatorPlus** precompile. To start, let's take a look at the Calculator Solidity interface:

```solidity title="contracts/contracts/interfaces/ICalculator.sol"
// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

interface ICalculator {
    function add(uint value1, uint value2) external view returns(uint result);

    function nextTwo(uint value1) external view returns(uint result1, uint result2);

    function repeat(uint times, string memory text) external view returns(string memory result);
}
```

With this in mind, let's define the CalculatorPlus Solidity interface. Your interface should have the following three functions:

1. `powOfThree`: takes in an unsigned integer base, and returns three unsigned integers named secondPow, thirdPow, fourthPow .
2. `moduloPlus`: takes in unsigned integers dividend and divisor as input, and returns two unsigned integers named multiple and remainder .
3. `simplFrac`: takes in unsigned integers named numerator and denominator, and returns two unsigned integers named simplNum and simplDenom

<Accordions>
  <Accordion title="Solution">
    ```solidity title="solidity/interfaces/ICalculatorPlus.sol"
    // SPDX-License-Identifier: MIT

    pragma solidity >=0.8.0;

    interface ICalculatorPlus {
        function powOfThree(uint256 base) external view returns(uint256 secondPow, uint256 thirdPow, uint256 fourthPow);

        function moduloPlus(uint256 dividend, uint256 divisor) external view returns(uint256 multiple, uint256 remainder);

        function simplFrac(uint256 numerator, uint256 denominator) external view returns(uint256 simplNum, uint256 simplDenom);
    }
    ```
  </Accordion>
</Accordions>

## Generate the ABI

Now that we have an interface of our precompile, let's create an ABI of our Solidity interface. Open the terminal (control + \`), change to the `/contracts` directory and run the following command to compile the solidity interface to the ABI:

```bash
# Go to the upper contracts directory of your project
cd contracts

# Compile ICalculatorPlus.sol to ABI
npx solc@latest --abi ./contracts/interfaces/ICalculatorPlus.sol -o ./abis --base-path . --include-path ./node_modules

# Rename using this script or manually
mv ./abis/contracts_interfaces_ICalculatorPlus_sol_ICalculatorPlus.abi ./abis/ICalculatorPlus.abi
```

Now you should have a file called `ICalculatorPlus.abi` in the folder `/contracts/abis` with the following content:

```json title="/contracts/abis/ICalculatorPlus.abi"
[
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "dividend",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "divisor",
        "type": "uint256"
      }
    ],
    "name": "moduloPlus",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "multiple",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "remainder",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "base",
        "type": "uint256"
      }
    ],
    "name": "powOfThree",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "secondPow",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "thirdPow",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "fourthPow",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "numerator",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "denominator",
        "type": "uint256"
      }
    ],
    "name": "simplFrac",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "simplNum",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "simplDenom",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]
```
# Generating the Precompile (/academy/avalanche-l1/customizing-evm/08-calculator-precompile/02-generating-precompile)

In this step, we will again utilize the precompile generation script to generate all the Go files based on the ABI for your calculator.

## Run Generation Script

Change to the root directory of your precompile-evm project and run the command to generate the go files:

```bash
# Change to root
cd ..

# Generate go files
./scripts/generate_precompile.sh --abi ./contracts/abis/ICalculatorPlus.abi --type Calculatorplus --pkg calculatorplus --out ./calculatorplus
```

Now you should have a new directory called `calculatorplus` in the root directory of your project.

If you check our the generated contract.go file you will see right away that it is much longer than in our hash function precompile from earlier. This is due to the fact that our calculator precompile has more functions and parameters. Browse through the code and see if you can spot the new elements:

```go title="contract.go"
// Code generated
// This file is a generated precompile contract config with stubbed abstract functions.
// The file is generated by a template. Please inspect every code and comment in this file before use.

package calculatorplus

import (
    "errors"
    "fmt"
    "math/big"

    "github.com/ava-labs/subnet-evm/accounts/abi"
    "github.com/ava-labs/subnet-evm/precompile/contract"
    "github.com/ava-labs/subnet-evm/vmerrs"

    _ "embed"

    "github.com/ethereum/go-ethereum/common"
)

const (
    // Gas costs for each function. These are set to 1 by default.
    // You should set a gas cost for each function in your contract.
    // Generally, you should not set gas costs very low as this may cause your network to be vulnerable to DoS attacks.
    // There are some predefined gas costs in contract/utils.go that you can use.
    ModuloPlusGasCost uint64 = 1 /* SET A GAS COST HERE */
    PowOfThreeGasCost uint64 = 1 /* SET A GAS COST HERE */
    SimplFracGasCost  uint64 = 1 /* SET A GAS COST HERE */
)

// CUSTOM CODE STARTS HERE
// Reference imports to suppress errors from unused imports. This code and any unnecessary imports can be removed.
var (
    _ = abi.JSON
    _ = errors.New
    _ = big.NewInt
    _ = vmerrs.ErrOutOfGas
    _ = common.Big0
)

// Singleton StatefulPrecompiledContract and signatures.
var (
    // CalculatorplusRawABI contains the raw ABI of Calculatorplus contract.
    //go:embed contract.abi
    CalculatorplusRawABI string

    CalculatorplusABI = contract.ParseABI(CalculatorplusRawABI)

    CalculatorplusPrecompile = createCalculatorplusPrecompile()
)

type ModuloPlusInput struct {
    Dividend *big.Int
    Divisor  *big.Int
}

type ModuloPlusOutput struct {
    Multiple  *big.Int
    Remainder *big.Int
}

type PowOfThreeOutput struct {
    SecondPow *big.Int
    ThirdPow  *big.Int
    FourthPow *big.Int
}

type SimplFracInput struct {
    Numerator   *big.Int
    Denominator *big.Int
}

type SimplFracOutput struct {
    SimplNum   *big.Int
    SimplDenom *big.Int
}

// UnpackModuloPlusInput attempts to unpack [input] as ModuloPlusInput
// assumes that [input] does not include selector (omits first 4 func signature bytes)
func UnpackModuloPlusInput(input []byte) (ModuloPlusInput, error) {
    inputStruct := ModuloPlusInput{}
    err := CalculatorplusABI.UnpackInputIntoInterface(&inputStruct, "moduloPlus", input)

    return inputStruct, err
}

// PackModuloPlus packs [inputStruct] of type ModuloPlusInput into the appropriate arguments for moduloPlus.
func PackModuloPlus(inputStruct ModuloPlusInput) ([]byte, error) {
    return CalculatorplusABI.Pack("moduloPlus", inputStruct.Dividend, inputStruct.Divisor)
}

// PackModuloPlusOutput attempts to pack given [outputStruct] of type ModuloPlusOutput
// to conform the ABI outputs.
func PackModuloPlusOutput(outputStruct ModuloPlusOutput) ([]byte, error) {
    return CalculatorplusABI.PackOutput("moduloPlus",
        outputStruct.Multiple,
        outputStruct.Remainder,
    )
}

// UnpackModuloPlusOutput attempts to unpack [output] as ModuloPlusOutput
// assumes that [output] does not include selector (omits first 4 func signature bytes)
func UnpackModuloPlusOutput(output []byte) (ModuloPlusOutput, error) {
    outputStruct := ModuloPlusOutput{}
    err := CalculatorplusABI.UnpackIntoInterface(&outputStruct, "moduloPlus", output)

    return outputStruct, err
}

func moduloPlus(accessibleState contract.AccessibleState, caller common.Address, addr common.Address, input []byte, suppliedGas uint64, readOnly bool) (ret []byte, remainingGas uint64, err error) {
    if remainingGas, err = contract.DeductGas(suppliedGas, ModuloPlusGasCost); err != nil {
        return nil, 0, err
    }
    // attempts to unpack [input] into the arguments to the ModuloPlusInput.
    // Assumes that [input] does not include selector
    // You can use unpacked [inputStruct] variable in your code
    inputStruct, err := UnpackModuloPlusInput(input)
    if err != nil {
        return nil, remainingGas, err
    }

    // CUSTOM CODE STARTS HERE
    _ = inputStruct             // CUSTOM CODE OPERATES ON INPUT
    var output ModuloPlusOutput // CUSTOM CODE FOR AN OUTPUT
    packedOutput, err := PackModuloPlusOutput(output)
    if err != nil {
        return nil, remainingGas, err
    }

    // Return the packed output and the remaining gas
    return packedOutput, remainingGas, nil
}

// UnpackPowOfThreeInput attempts to unpack [input] into the *big.Int type argument
// assumes that [input] does not include selector (omits first 4 func signature bytes)
func UnpackPowOfThreeInput(input []byte) (*big.Int, error) {
    res, err := CalculatorplusABI.UnpackInput("powOfThree", input)
    if err != nil {
        return new(big.Int), err
    }
    unpacked := *abi.ConvertType(res[0], new(*big.Int)).(**big.Int)
    return unpacked, nil
}

// PackPowOfThree packs [base] of type *big.Int into the appropriate arguments for powOfThree.
// the packed bytes include selector (first 4 func signature bytes).
// This function is mostly used for tests.
func PackPowOfThree(base *big.Int) ([]byte, error) {
    return CalculatorplusABI.Pack("powOfThree", base)
}

// PackPowOfThreeOutput attempts to pack given [outputStruct] of type PowOfThreeOutput
// to conform the ABI outputs.
func PackPowOfThreeOutput(outputStruct PowOfThreeOutput) ([]byte, error) {
    return CalculatorplusABI.PackOutput("powOfThree",
        outputStruct.SecondPow,
        outputStruct.ThirdPow,
        outputStruct.FourthPow,
    )
}

// UnpackPowOfThreeOutput attempts to unpack [output] as PowOfThreeOutput
// assumes that [output] does not include selector (omits first 4 func signature bytes)
func UnpackPowOfThreeOutput(output []byte) (PowOfThreeOutput, error) {
    outputStruct := PowOfThreeOutput{}
    err := CalculatorplusABI.UnpackIntoInterface(&outputStruct, "powOfThree", output)

    return outputStruct, err
}

func powOfThree(accessibleState contract.AccessibleState, caller common.Address, addr common.Address, input []byte, suppliedGas uint64, readOnly bool) (ret []byte, remainingGas uint64, err error) {
    if remainingGas, err = contract.DeductGas(suppliedGas, PowOfThreeGasCost); err != nil {
        return nil, 0, err
    }
    // attempts to unpack [input] into the arguments to the PowOfThreeInput.
    // Assumes that [input] does not include selector
    // You can use unpacked [inputStruct] variable in your code
    inputStruct, err := UnpackPowOfThreeInput(input)
    if err != nil {
        return nil, remainingGas, err
    }

    // CUSTOM CODE STARTS HERE
    _ = inputStruct             // CUSTOM CODE OPERATES ON INPUT
    var output PowOfThreeOutput // CUSTOM CODE FOR AN OUTPUT
    packedOutput, err := PackPowOfThreeOutput(output)
    if err != nil {
        return nil, remainingGas, err
    }

    // Return the packed output and the remaining gas
    return packedOutput, remainingGas, nil
}

// UnpackSimplFracInput attempts to unpack [input] as SimplFracInput
// assumes that [input] does not include selector (omits first 4 func signature bytes)
func UnpackSimplFracInput(input []byte) (SimplFracInput, error) {
    inputStruct := SimplFracInput{}
    err := CalculatorplusABI.UnpackInputIntoInterface(&inputStruct, "simplFrac", input)

    return inputStruct, err
}

// PackSimplFrac packs [inputStruct] of type SimplFracInput into the appropriate arguments for simplFrac.
func PackSimplFrac(inputStruct SimplFracInput) ([]byte, error) {
    return CalculatorplusABI.Pack("simplFrac", inputStruct.Numerator, inputStruct.Denominator)
}

// PackSimplFracOutput attempts to pack given [outputStruct] of type SimplFracOutput
// to conform the ABI outputs.
func PackSimplFracOutput(outputStruct SimplFracOutput) ([]byte, error) {
    return CalculatorplusABI.PackOutput("simplFrac",
        outputStruct.SimplNum,
        outputStruct.SimplDenom,
    )
}

// UnpackSimplFracOutput attempts to unpack [output] as SimplFracOutput
// assumes that [output] does not include selector (omits first 4 func signature bytes)
func UnpackSimplFracOutput(output []byte) (SimplFracOutput, error) {
    outputStruct := SimplFracOutput{}
    err := CalculatorplusABI.UnpackIntoInterface(&outputStruct, "simplFrac", output)

    return outputStruct, err
}

func simplFrac(accessibleState contract.AccessibleState, caller common.Address, addr common.Address, input []byte, suppliedGas uint64, readOnly bool) (ret []byte, remainingGas uint64, err error) {
    if remainingGas, err = contract.DeductGas(suppliedGas, SimplFracGasCost); err != nil {
        return nil, 0, err
    }
    // attempts to unpack [input] into the arguments to the SimplFracInput.
    // Assumes that [input] does not include selector
    // You can use unpacked [inputStruct] variable in your code
    inputStruct, err := UnpackSimplFracInput(input)
    if err != nil {
        return nil, remainingGas, err
    }

    // CUSTOM CODE STARTS HERE
    _ = inputStruct            // CUSTOM CODE OPERATES ON INPUT
    var output SimplFracOutput // CUSTOM CODE FOR AN OUTPUT
    packedOutput, err := PackSimplFracOutput(output)
    if err != nil {
        return nil, remainingGas, err
    }

    // Return the packed output and the remaining gas
    return packedOutput, remainingGas, nil
}

// createCalculatorplusPrecompile returns a StatefulPrecompiledContract with getters and setters for the precompile.

func createCalculatorplusPrecompile() contract.StatefulPrecompiledContract {
    var functions []*contract.StatefulPrecompileFunction

    abiFunctionMap := map[string]contract.RunStatefulPrecompileFunc{
        "moduloPlus": moduloPlus,
        "powOfThree": powOfThree,
        "simplFrac":  simplFrac,
    }

    for name, function := range abiFunctionMap {
        method, ok := CalculatorplusABI.Methods[name]
        if !ok {
            panic(fmt.Errorf("given method (%s) does not exist in the ABI", name))
        }
        functions = append(functions, contract.NewStatefulPrecompileFunction(method.ID, function))
    }
    // Construct the contract with no fallback function.
    statefulContract, err := contract.NewStatefulPrecompileContract(nil, functions)
    if err != nil {
        panic(err)
    }
    return statefulContract
}
```
# Interacting with StringStore Precompile (/academy/avalanche-l1/customizing-evm/09-stateful-precompiles/01-interacting-with-precompile)

Rather than understanding the statefulness of precompiles only in theory, we can also play around with an example of a stateful precompile to learn how they work in practice.

In this section, we'll interact with the **StringStore** precompile, a precompiled smart contract that stores a string.

## Checking the Genesis JSON

As part of all Avalanche Academy branches, your Precompile-EVM should include the **StringStore/** folder along with all other relevant files for StringStore to be recognized by Precompile-EVM. This includes a genesis JSON for StringStore.

Go to `tests/precompile/genesis/` and double-check that you have a `StringStore.json` folder in said directory. This JSON files will instantiate both the **SHA256** precompile and **StringStore**.

```json title="StringStore.json"
{
    "config": {
      "chainId": 99999,
      // ...
      "stringStoreConfig" : {
        "blockTimestamp": 0,
        "defaultString": "Cornell"
     }
    },
    // ...
}
```

## Building the EVM with StringStore Precompile

The **avalanche-academy-start** branch already contains the StringStore and SHA256 precompile. If you are working from that branch, you can simply use the built binary from your latest exercise without making any changes.

To verify, check if the **stringstore** directory is in your workspace and if the precompile is noted in the `plugin/main.go` file. If not, switch to the **avalanche-academy-start** branch and build the VM there.

## Start the Avalanche Network

Use the Avalanche-CLI to start the server and the network. Use the provided genesis file `stringstore.json` mentioned above when you start the network.

If all goes well, you will have successfully deployed a blockchain containing both the StringStore and SHA256 precompile.

## Connecting Core

Similar to previous chapters, navigate to the **Add Network** section in the Core Wallet. You can find the RPC URL in the Avalanche-CLI logs or by executing the command: `avalanche blockchain list --deployed`

Note: Make sure the RPC URL ends with **/rpc**. The RPC URL should look something like this: [http://127.0.0.1:9650/ext/bc/P9nKPGPoAfFGkdvD3Ac6YxZieaG8ahpbR9xZosrWNPbJCzByu/rpc](http://127.0.0.1:9650/ext/bc/P9nKPGPoAfFGkdvD3Ac6YxZieaG8ahpbR9xZosrWNPbJCzByu/rpc)

Once you have added the blockchain network, switch Core Wallet to your blockchain.

## Interact through Remix

We will now load in the Solidity interface letting us interact with the **StringStore** precompile. To do this, open the link below, which will open a Remix workspace containing the StringStore precompile: [Workspace](https://remix.ethereum.org/#url=https://github.com/ava-labs/precompile-evm/blob/avalanche-academy-start/contracts/contracts/interfaces/IStringStore.sol\&lang=en\&optimize=false\&runs=200\&evmVersion=null\&version=soljson-v0.8.26+commit.8a97fa7a.js)

As usual, we will need to compile our Solidity interface.

1. Click the **Solidity** logo on the left sidebar.
2. In the new page, you will see a **Compile IStringStore.sol** button. After clicking the button, a green checkmark should appear next to the Solidity logo.
3. Next, go to the **Environment** tab and select the **Injected Provider** option. If successful, a text saying **Custom \[99999] Network** will appear below. If not, change your network.
4. Enter the precompile address (find it in `precompile/stringstore/module.go`) and click **At Address**.

First, we will call the `getString` function. By default, `getString` will return whatever was specified in the genesis JSON. Since we set our StringStore precompile to store the string **Cornell**, it'll return this value.

<img alt="" src="https://qizat5l3bwvomkny.public.blob.vercel-storage.com/builders-hub/course-images/customizing-evm/48-THf1urUZpFdGgScCm6ZhNWVQITtsiq.png" width="556" height="574" />

As you might have noticed, we can also set the string that **StringStore** stores. For example, if we wanted to change the string to Avalanche, we would type Avalanche in the box next to `setString` method, press the `setString` button, and then you would see in the Remix terminal a message displaying the success of your transaction.

If we call `getString` again, you will see that the string has been changed to Avalanche.

Congrats, you've just interacted with the stateful **StringStore** precompile 🎉

<Callout type="info">
  In contrast to the precompiles we have built earlier, the StringStore precompile has access to the EVM state. This way we can utilize precompile not only to perform calculations, but also persist something to the EVM state. This allows us to move even larger portions of our dApp from the solidity smart contract layer to the precompile layer. 
</Callout>
