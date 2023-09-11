import { Contract } from "ethers";
import { deployments, ethers } from "hardhat";

const setupFixture = deployments.createFixture(
    async ({ deployments, companionNetworks }, options) => {
        await deployments.fixture(undefined, {
            keepExistingDeployments: true,
        });

        const companionDeployments = companionNetworks["mainnet"].deployments;
        const [deployer] = await ethers.getSigners();

        const comptrollerImplDeploy = await deployments.get("Comptroller");

        const unitrollerDeploy = await companionDeployments.get("Unitroller");
        // set storage to new comptroller deploy
        await ethers.provider.send("hardhat_setStorageAt", [
            unitrollerDeploy.address,
            "0x2",
            ethers.utils.hexZeroPad(comptrollerImplDeploy.address, 32),
        ]);

        const comptroller = await ethers.getContractAt(
            "Comptroller",
            unitrollerDeploy.address
        );

        const rewardDistributorDeploy = await deployments.get(
            "ExternalRewardDistributor"
        );
        const rewardDistributor = await ethers.getContractAt(
            "ExternalRewardDistributor",
            rewardDistributorDeploy.address
        );

        // read markets from comptroller and create contracts
        const markets = await comptroller.getAllMarkets();
        const cTokens = {};
        for (let i = 0; i < markets.length; i++) {
            const market = markets[i];
            const cToken = await ethers.getContractAt("CToken", market);
            const symbol = await cToken.symbol();
            cTokens[symbol] = cToken;
        }

        return {
            comptroller,
            rewardDistributor,
            cTokens,
        };
    }
);

type PythOracleFixtureOutput = [Contract];
const pythOracleFixture = deployments.createFixture<
    PythOracleFixtureOutput,
    any
>(async ({ deployments, companionNetworks }, options) => {
    await deployments.fixture(undefined, {
        keepExistingDeployments: true,
    });

    const [deployer] = await ethers.getSigners();

    const pythPriceOracleDeploy = await deployments.deploy("PythPriceOracle", {
        from: deployer.address,
        args: [
            ["meWETH", "meUSDC", "meUSDT", "meDAI", "meWBTC"],
            [
                "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
                "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
                "0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b",
                "0xb0948a5e5313200c632b51bb5ca32f6de0d36e9950a942d19751e833f70dabfd",
                "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
            ],
            [
                "1000000000000000000",
                "1000000",
                "1000000",
                "1000000000000000000",
                "100000000",
            ],
        ],
    });
    const pythPriceOracle = await ethers.getContract("PythPriceOracle");

    return [pythPriceOracle];
});

export { setupFixture, pythOracleFixture };
