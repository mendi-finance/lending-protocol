import { task } from "hardhat/config";

// npx hardhat deploy-price-oracle --network kava

task("deploy-simple-price-oracle", "Deploys a simple price oracle").setAction(
    async (args, hre, runSuper) => {
        const {
            ethers,
            getNamedAccounts,
            deployments: { deploy, getOrNull, all },
        } = hre;

        const { deployer } = await getNamedAccounts();

        const oracle = await deploy("SimplePriceOracle", {
            from: deployer,
            log: true,
            contract:
                "contracts/PriceOracle/SimplePriceOracle.sol:SimplePriceOracle",
            args: [],
        });
    }
);
