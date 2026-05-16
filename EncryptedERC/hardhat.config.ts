import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@solarity/chai-zkit";
import "@solarity/hardhat-zkit";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import type { HardhatUserConfig } from "hardhat/config";
import "solidity-coverage";

import dotenv from "dotenv";
dotenv.config();

const AVA_RPC_URL = process.env.AVA_RPC_URL || process.env.RPC_URL || "";
const AVA_PK = process.env.AVA_PK || "";
const AVA_PK1 = process.env.AVA_PK1 || "";
const AVA_PK2 = process.env.AVA_PK2 || "";
const AVA_PK3 = process.env.AVA_PK3 || "";
const MAINNET_RPC_URL = "https://api.avax.network/ext/bc/C/rpc";

const normalizePrivateKey = (pk: string): string => {
  if (!pk) return "";
  return pk.startsWith("0x") ? pk : `0x${pk}`;
};

const NETWORK_ACCOUNTS = Array.from(
  new Set([
    normalizePrivateKey(AVA_PK),
    normalizePrivateKey(AVA_PK1),
    normalizePrivateKey(AVA_PK2),
    normalizePrivateKey(AVA_PK3),
  ]),
).filter((pk) => pk.length > 0);

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: AVA_RPC_URL || MAINNET_RPC_URL,
        blockNumber: 59121339,
        enabled: !!process.env.FORKING,
      },
    },
    fuji: {
      url: AVA_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: NETWORK_ACCOUNTS,
    },
    avalanche: {
      url: AVA_RPC_URL || MAINNET_RPC_URL,
      chainId: 43114,
      accounts: NETWORK_ACCOUNTS,
    },
  },
  gasReporter: {
    enabled: !!process.env.REPORT_GAS,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    excludeContracts: ["contracts/mocks/"],
    outputFile: "gas-report.txt",
    L1: "avalanche",
    showMethodSig: true,
  },
  zkit: {
    compilerVersion: "2.1.9",
    circuitsDir: "circom",
    compilationSettings: {
      artifactsDir: "zkit/artifacts",
      onlyFiles: [],
      skipFiles: [],
      c: false,
      json: false,
      optimization: "O2",
    },
    setupSettings: {
      contributionSettings: {
        provingSystem: "groth16",
        contributions: 0,
      },
      onlyFiles: [],
      skipFiles: [],
      ptauDir: undefined,
      ptauDownload: true,
    },
    verifiersSettings: {
      verifiersDir: "contracts/verifiers",
      verifiersType: "sol",
    },
    typesDir: "generated-types/zkit",
    quiet: false,
  },
};

export default config;
