import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async ({
    getNamedAccounts,
    deployments: { deploy, getOrNull },
    ethers,
    network,
}: HardhatRuntimeEnvironment) => {
    const { deployer } = await getNamedAccounts();

    await deploy("Unitroller", {
        from: deployer,
        log: true,
        contract: "contracts/Unitroller.sol:Unitroller",
        args: [],
    });
};

const tags = ["unitroller"];
export { tags };

export default func;
