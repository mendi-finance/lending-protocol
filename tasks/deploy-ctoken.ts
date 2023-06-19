import { task, types } from "hardhat/config";

/**
 * npx hardhat deploy-ctoken \
 * --network kava \
 * --underlying-address 0xE3F5a90F9cb311505cd691a46596599aA1A0AD7D \
 * --underlying-decimals 18 \
 * --underlying-name "Multichain Ether" \
 * --underlying-symbol "ETH" \
 * --decimals 8 \
 * --comptroller-key "Unitroller" \
 * --interest-rate-model-key "StableRateModel" \
 * --owner 0xfb59ce8986943163f14c590755b29db2998f2322
 */

task("deploy-ctoken", "Deploys a new ctoken")
    .addParam("underlyingAddress", "Underlying asset's address")
    .addParam(
        "underlyingDecimals",
        "Underlying asset's decimals",
        18,
        types.int
    )
    .addParam("underlyingName", "Underlying asset's name")
    .addParam("underlyingSymbol", "Underlying asset's symbol")
    .addParam("decimals", "Decimals of the cToken", 8, types.int)
    .addParam("comptrollerKey", "Key of the comptroller")
    .addParam("interestRateModelKey", "Key of the interest rate model")
    .addParam("owner", "Owner of the cToken")
    .setAction(async (args, hre, runSuper) => {
        const {
            underlyingAddress,
            underlyingDecimals,
            underlyingName,
            underlyingSymbol,
            decimals,
            comptrollerKey,
            interestRateModelKey,
            owner,
        } = args;
        const {
            ethers,
            getNamedAccounts,
            deployments: { deploy, get },
        } = hre;

        const { deployer } = await getNamedAccounts();

        const contractKey = `CErc20Immutable_${underlyingSymbol}`;
        const soName = `Mendi ${underlyingName}`;
        const soSymbol = `me${underlyingSymbol}`;

        let cToken;

        const comptrollerDeploy = await get(comptrollerKey);
        const interestRateModelDeploy = await get(interestRateModelKey);

        const initialExchangeRateMantissa = ethers.utils.parseUnits(
            "0.02",
            underlyingDecimals + 18 - decimals
        );
        console.log(initialExchangeRateMantissa.toString());

        try {
            cToken = await get(contractKey);
        } catch {
            cToken = await deploy(contractKey, {
                from: deployer,
                log: true,
                contract: "contracts/CErc20Immutable.sol:CErc20Immutable",
                args: [
                    underlyingAddress,
                    comptrollerDeploy.address,
                    interestRateModelDeploy.address,
                    initialExchangeRateMantissa,
                    soName,
                    soSymbol,
                    decimals,
                    owner,
                ],
            });
        }
    });
