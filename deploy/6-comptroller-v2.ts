import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async ({
    getNamedAccounts,
    deployments: { deploy, getOrNull, get },
    ethers,
    network,
}: HardhatRuntimeEnvironment) => {
    const { deployer } = await getNamedAccounts();

    let comptrollerImplDeploy = await getOrNull("ComptrollerImplV2");
    if (!comptrollerImplDeploy) {
        comptrollerImplDeploy = await deploy("ComptrollerImplV2", {
            from: deployer,
            log: true,
            contract: "contracts/Comptroller.sol:Comptroller",
            args: [],
        });
    }
};

const tags = ["comptroller"];
export { tags };

export default func;
