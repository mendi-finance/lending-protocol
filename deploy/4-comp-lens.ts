import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async ({
    getNamedAccounts,
    deployments: { deploy },
}: HardhatRuntimeEnvironment) => {
    const { deployer } = await getNamedAccounts();

    await deploy("BasicLens", {
        from: deployer,
        args: [],
        log: true,
    });
};

const tags = ["comp-lens"];
export { tags };

export default func;
