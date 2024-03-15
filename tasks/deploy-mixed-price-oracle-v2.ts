import { task } from "hardhat/config";

import protocolConfig from "../protocol.config";
import { filterCTokenDeployments } from "./_utils";

// npx hardhat deploy-mixed-price-oracle-v2 --network linea

task(
    "deploy-mixed-price-oracle-v2",
    "Deploys a mixed price oracle v2 from all tokens in deployments"
).setAction(async (args, hre, runSuper) => {
    const {
        network,
        ethers,
        getNamedAccounts,
        deployments: { deploy, getOrNull, all },
    } = hre;

    const priceFeedConfig = protocolConfig[network.name];

    const { deployer } = await getNamedAccounts();

    const allDeployments = await all();
    const cTokenDeployments = filterCTokenDeployments(allDeployments);

    const existingCTickers = cTokenDeployments.map((cTokenDeployment: any) =>
        !!cTokenDeployment.implementation
            ? cTokenDeployment.execute.args[5]
            : cTokenDeployment.args[5]
    );

    var priceConfig = {};
    for (const [cTicker, marketConfig] of Object.entries(
        priceFeedConfig.markets
    )) {
        var priceId: string = "";
        if (marketConfig.source == "pyth") priceId = marketConfig.priceFeed;
        else if (marketConfig.source == "chainlink")
            priceId = ethers.utils.hexZeroPad(marketConfig.priceFeed, 32);

        priceConfig[cTicker] = {
            priceId: priceId,
            toSymbol: marketConfig.toSymbol || "USD",
            underlyingDecimals: marketConfig.underlyingDecimals,
        };
    }

    for (var deployedTicker of existingCTickers) {
        if (!priceConfig[deployedTicker])
            throw new Error(`${deployedTicker} is not exist in config`);
    }

    var tickers = Object.keys(priceConfig);
    var configs = Object.values(priceConfig);

    const oracle = await deploy("MixedPriceOracleV2", {
        from: deployer,
        log: true,
        contract:
            "contracts/PriceOracle/MixedPriceOracleV2.sol:MixedPriceOracleV2",
        args: [tickers, configs],
    });
});
