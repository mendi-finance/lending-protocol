import * as dotenv from "dotenv";
dotenv.config();

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-network-helpers";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-deploy";
import "solidity-coverage";

import "./tasks";

const config: HardhatUserConfig = {
    solidity: {
        compilers: [
            {
                version: "0.8.10",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    networks: {
        hardhat: {
            companionNetworks: {
                mainnet: process.env.FORKING_NETWORK?.toLowerCase()!,
            },
            forking: {
                enabled: true,
                url: process.env[
                    `${process.env.FORKING_NETWORK?.toUpperCase()}_RPC_URL`
                ]!,
            },
            autoImpersonate: true,
            gasPrice: 1000000000,
        },
        linea: {
            chainId: 59144,
            url: process.env.LINEA_RPC_URL,
            accounts: [process.env.LINEA_DEPLOYER!],
            verify: {
                etherscan: {
                    apiUrl: "https://api.lineascan.build",
                    apiKey: "8UVWD6QA7TJD517ZBJ222Y2GUNIMHDCHXE",
                },
            },
        },
        linea_goerli: {
            chainId: 59140,
            url: process.env.LINEA_GOERLI_RPC_URL,
            accounts: [process.env.LINEA_GOERLI_DEPLOYER!],
            verify: {
                etherscan: {
                    apiUrl: "https://api-testnet.lineascan.build",
                    apiKey: "8UVWD6QA7TJD517ZBJ222Y2GUNIMHDCHXE",
                },
            },
        },
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
};

export default config;
