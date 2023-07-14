import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { BigNumber } from "ethers";

interface IModelDefinition {
    blocksPerYear: number;
    baseRatePerYear: BigNumber;
    multiplerPerYear: BigNumber;
    jumpMultiplierPerYear: BigNumber;
    kink: BigNumber;
    owner: string;
    name: string;
}

const func: DeployFunction = async ({
    getNamedAccounts,
    deployments: { deploy, getOrNull },
    ethers,
    network,
}: HardhatRuntimeEnvironment) => {
    const { deployer } = await getNamedAccounts();

    const modelDefinitions: {
        [key: string]: IModelDefinition;
    } = {
        StableRateModel: {
            blocksPerYear: 365 * 24 * 60 * 60,
            baseRatePerYear: ethers.utils.parseEther("0"),
            multiplerPerYear: ethers.utils.parseEther("0.05"),
            jumpMultiplierPerYear: ethers.utils.parseEther("1.365"),
            kink: ethers.utils.parseEther("0.8"),
            owner: deployer,
            name: "StableRateModel",
        },
        MediumRateModel: {
            blocksPerYear: 365 * 24 * 60 * 60,
            baseRatePerYear: ethers.utils.parseEther("0.02"),
            multiplerPerYear: ethers.utils.parseEther("0.225"),
            jumpMultiplierPerYear: ethers.utils.parseEther("1.25"),
            kink: ethers.utils.parseEther("0.8"),
            owner: deployer,
            name: "MediumRateModel",
        },
        VolatileRateModel: {
            blocksPerYear: 365 * 24 * 60 * 60,
            baseRatePerYear: ethers.utils.parseEther("0.025"),
            multiplerPerYear: ethers.utils.parseEther("0.225"),
            jumpMultiplierPerYear: ethers.utils.parseEther("5"),
            kink: ethers.utils.parseEther("0.8"),
            owner: deployer,
            name: "VolatileRateModel",
        },
    };

    for (let key of Object.keys(modelDefinitions)) {
        const def = modelDefinitions[key];
        const existingDeploy = await getOrNull(def.name);
        if (existingDeploy) continue;

        await deploy(def.name, {
            from: deployer,
            log: true,
            contract: "contracts/JumpRateModelV4.sol:JumpRateModelV4",
            args: [
                def.blocksPerYear, // seconds per year
                def.baseRatePerYear, // base rate per year
                def.multiplerPerYear, // multiplier per year
                def.jumpMultiplierPerYear, // jump multiplier per year
                def.kink, // kink
                def.owner,
                def.name,
            ],
        });
    }
};

const tags = ["rate-models"];
export { tags };

export default func;
