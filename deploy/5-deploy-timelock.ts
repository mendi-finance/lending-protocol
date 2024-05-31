import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async ({
    getNamedAccounts,
    deployments: { deploy, getOrNull },
    ethers,
    network,
}: HardhatRuntimeEnvironment) => {
    const { deployer } = await getNamedAccounts();

    await deploy("TimelockController", {
        from: deployer,
        log: true,
        contract:
            "@openzeppelin/contracts/governance/TimelockController.sol:TimelockController",
        args: [
            10,
            [
                "0xe3CDa0A0896b70F0eBC6A1848096529AA7AEe9eE",
                "0x57cd331C7b2c7582625810465Ea3CF9bdcA21236",
            ],
            ["0x0000000000000000000000000000000000000000"],
            "0x0000000000000000000000000000000000000000",
        ],
    });
};

const tags = ["timelock-controller"];
export { tags };

export default func;
