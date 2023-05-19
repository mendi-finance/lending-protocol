import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async ({
    getNamedAccounts,
    deployments: { deploy, getOrNull, get },
    ethers,
    network,
}: HardhatRuntimeEnvironment) => {
    const { deployer } = await getNamedAccounts();

    let unitrollerDeploy = await get("Unitroller");

    await deploy("ExternalRewardDistributor", {
        from: deployer,
        log: true,
        contract:
            "contracts/ExternalRewardDistributor.sol:ExternalRewardDistributor",
        args: [],
        proxy: {
            proxyContract: "OpenZeppelinTransparentProxy",
            execute: {
                init: {
                    methodName: "initialize",
                    args: [unitrollerDeploy.address],
                },
            },
        },
    });
};

const tags = ["external-rewards"];
export { tags };

export default func;
