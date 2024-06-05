import { task } from "hardhat/config";

// npx hardhat deploy-simple-price-oracle --network linea

task("deploy-simple-price-oracle", "Deploys a simple price oracle").setAction(
    async (args, hre, runSuper) => {
        console.log("running task: deploy-simple-price-oracle");
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
