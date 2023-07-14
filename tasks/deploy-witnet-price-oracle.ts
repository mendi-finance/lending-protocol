import { task } from "hardhat/config";

import priceFeedConfig from "../config/price-feeds";

// npx hardhat deploy-price-oracle --network kava

task(
    "deploy-witnet-price-oracle",
    "Deploys a witnet price oracle from all tokens in deployments"
).setAction(async (args, hre, runSuper) => {
    const {
        ethers,
        getNamedAccounts,
        deployments: { deploy, getOrNull, all },
    } = hre;

    const { deployer } = await getNamedAccounts();

    const allDeployments = await all();
    const cTokenDeployments = Object.entries(allDeployments)
        .filter(
            ([key, value]) =>
                key.startsWith("CErc20Immutable_") ||
                (key.startsWith("CErc20Upgradable_") &&
                    !key.endsWith("_Proxy") &&
                    !key.endsWith("_Implementation"))
        )
        .map(([key, value]) => value);

    const cTickers = cTokenDeployments.map((cTokenDeployment: any) =>
        !!cTokenDeployment.implementation
            ? cTokenDeployment.execute.args[5]
            : cTokenDeployment.args[5]
    );

    const priceFeeds = cTickers.map(cTicker => {
        const soToken = priceFeedConfig[cTicker];
        if (!soToken) throw new Error(`No Ctoken found for ${cTicker}`);
        return soToken.priceFeed;
    });
    const priceDecimals = cTickers.map(cTicker => {
        const soToken = priceFeedConfig[cTicker];
        if (!soToken) throw new Error(`No Ctoken found for ${cTicker}`);
        return soToken.priceDecimals;
    });
    const baseUnits = cTickers.map(cTicker => {
        const soToken = priceFeedConfig[cTicker];
        if (!soToken) throw new Error(`No Ctoken found for ${cTicker}`);
        return soToken.baseUnit;
    });

    const oracle = await deploy("WitnetPriceOracle", {
        from: deployer,
        log: true,
        contract:
            "contracts/PriceOracle/WitnetPriceOracle.sol:WitnetPriceOracle",
        args: [cTickers, priceFeeds, priceDecimals, baseUnits],
    });
});
