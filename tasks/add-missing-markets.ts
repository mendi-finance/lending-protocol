import { task } from "hardhat/config";

import priceFeedConfig from "../config/price-feeds";

// npx hardhat deploy-price-oracle --network optimism

task(
    "add-missing-markets",
    "Adds missing markets to the comptroller"
).setAction(async (args, hre, runSuper) => {
    const {
        ethers,
        getNamedAccounts,
        deployments: { deploy, getOrNull, all },
    } = hre;

    console.log("running task: add-missing-markets");

    const { deployer } = await getNamedAccounts();

    const allDeployments = await all();
    const cTokenDeployments = Object.entries(allDeployments)
        .filter(([key, value]) => key.startsWith("CErc20Immutable_"))
        .map(([key, value]) => value);

    const ComptrollerProxy = await ethers.getContract("Unitroller");
    const Comptroller = await ethers.getContractAt(
        "Comptroller",
        ComptrollerProxy.address
    );

    const existingCTokens = await Comptroller.getAllMarkets();
    const missingCTokens = cTokenDeployments
        //.filter(
        //    cTokenDeployment =>
        //        !existingCTokens.includes(cTokenDeployment.address)
        //)
        .map(cTokenDeployment => cTokenDeployment.address);

    const txPromises: any[] = [];

    for (const cToken of missingCTokens) {
        const cTokenContract = await ethers.getContractAt(
            "CErc20Immutable",
            cToken
        );
        const symbol = await cTokenContract.symbol();
        const config = priceFeedConfig[symbol];

        console.log("adding market", symbol);

        // set reserve factor
        const reserveFactor = await cTokenContract.reserveFactorMantissa();
        const newReserveFactor = ethers.utils.parseEther(config.reserveFactor);
        if (!reserveFactor.eq(newReserveFactor)) {
            const tx2 = await cTokenContract._setReserveFactor(
                newReserveFactor
            );
            txPromises.push(tx2.wait());

            console.log(
                "set reserve factor",
                symbol,
                newReserveFactor.toString()
            );
        }

        // support market
        const tx = await Comptroller._supportMarket(cToken);
        txPromises.push(tx.wait());

        // set collateral factor
        const collateralFactor = (await Comptroller.markets(cToken))
            .collateralFactorMantissa;
        const newCollateralFactor = ethers.utils.parseEther(
            config.collateralFactor
        );
        if (!collateralFactor.eq(newCollateralFactor)) {
            const tx3 = await Comptroller._setCollateralFactor(
                cToken,
                newCollateralFactor
            );
            txPromises.push(tx3.wait());

            console.log(
                "set collateral factor",
                symbol,
                newCollateralFactor.toString()
            );
        }
    }

    await Promise.all(txPromises);
});
