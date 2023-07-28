import { task } from "hardhat/config";

import priceFeedConfigs from "../config/price-feeds";
import { filterCTokenDeployments } from "./_utils";

// npx hardhat deploy-price-oracle --network kava

task(
    "deploy-witnet-price-oracle",
    "Deploys a witnet price oracle from all tokens in deployments"
).setAction(async (args, hre, runSuper) => {
    const {
        network,
        ethers,
        getNamedAccounts,
        deployments: { deploy, getOrNull, all },
    } = hre;

    const priceFeedConfig = priceFeedConfigs[network.name];

    const { deployer } = await getNamedAccounts();

    const allDeployments = await all();
    const cTokenDeployments = filterCTokenDeployments(allDeployments);

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
