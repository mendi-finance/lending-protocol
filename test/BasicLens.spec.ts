// price oracle deploy fixture

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import hre, { ethers, deployments } from "hardhat";

interface DeployFixture {
    admin: SignerWithAddress;
    lens: Contract;
    comptroller: Contract;
}

describe("Basic Lens", function () {
    let deployment: DeployFixture;

    const deployFixture = deployments.createFixture(
        async ({ deployments, ethers, companionNetworks }, options) => {
            await deployments.fixture(undefined, {
                keepExistingDeployments: true,
            });

            const [admin] = await ethers.getSigners();

            const companionDeployments =
                companionNetworks["mainnet"].deployments;

            const unitrollerDeploy = await companionDeployments.get(
                "Unitroller"
            );
            const lensDeploy = await deployments.get("BasicLens");
            console.log(lensDeploy.address);

            const comptroller = await ethers.getContractAt(
                "Comptroller",
                unitrollerDeploy.address
            );
            const lens = await ethers.getContractAt(
                "BasicLens",
                lensDeploy.address
            );

            return {
                admin,
                comptroller,
                lens,
            };
        }
    );

    this.beforeEach(async function () {
        deployment = await deployFixture();
    });

    it("Should get rewards accrued", async function () {
        const { admin, comptroller, lens } = deployment;

        const user = "0xFb59Ce8986943163F14C590755b29dB2998F2322";

        const { rewardTokens, accrued } = await lens.callStatic.rewardsAccrued(
            comptroller.address,
            user
        );

        console.log(rewardTokens, accrued);
    });
});
