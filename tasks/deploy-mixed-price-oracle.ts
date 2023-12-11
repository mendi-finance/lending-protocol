import { task } from "hardhat/config";

import priceFeedConfigs from "../config/price-feeds";
import { filterCTokenDeployments } from "./_utils";

// npx hardhat deploy-mixed-price-oracle --network linea

task(
    "deploy-mixed-price-oracle",
    "Deploys a mixed price oracle from all tokens in deployments"
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

        if (soToken.source == "pyth") return soToken.priceFeed;
        console.log(soToken.priceFeed);
        if (soToken.source == "chainlink")
            return ethers.utils.hexZeroPad(soToken.priceFeed, 32);

        throw new Error(`Undefined source: ${soToken.source}`);
    });

    const baseUnits = cTickers.map(cTicker => {
        const soToken = priceFeedConfig[cTicker];
        if (!soToken) throw new Error(`No Ctoken found for ${cTicker}`);
        return soToken.baseUnit;
    });
    console.log(cTickers);
    console.log(priceFeeds);
    console.log(baseUnits);

    const oracle = await deploy("MixedPriceOracle", {
        from: deployer,
        log: true,
        contract: "contracts/PriceOracle/MixedPriceOracle.sol:MixedPriceOracle",
        args: [cTickers, priceFeeds, baseUnits],
    });
});
