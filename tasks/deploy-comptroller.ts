import { task } from "hardhat/config";

// npx hardhat deploy-comptroller --network omni_testnet

task("deploy-comptroller", "Deploys a comptroller contract").setAction(
    async (args, hre, runSuper) => {
        const {
            ethers,
            getNamedAccounts,
            deployments: { deploy, getOrNull, all },
        } = hre;

        const { deployer } = await getNamedAccounts();

        const comptrollerDeploy = await deploy("Comptroller", {
            from: deployer,
            log: true,
            contract: "contracts/Comptroller.sol:Comptroller",
            args: [],
        });
    }
);
