// price oracle deploy fixture

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import hre, { ethers, deployments } from "hardhat";

interface DeployFixture {
    admin: SignerWithAddress;
    Comptroller: Contract;
    CTokens: Contract[];
    witnetPriceOracle: Contract | null;
    chainlinkPriceOracle?: Contract | null;
}

describe("Price Oracle", function () {
    let deployment: DeployFixture;

    const deployFixture = deployments.createFixture(
        async ({ deployments, ethers }, options) => {
            const [admin] = await ethers.getSigners();

            const ComptrollerProxy = await ethers.getContract("Unitroller");
            const Comptroller = await ethers.getContractAt(
                "Comptroller",
                ComptrollerProxy.address
            );
            const cTokens = await Comptroller.getAllMarkets();

            const CTokens = await Promise.all(
                cTokens.map(cToken => ethers.getContractAt("CToken", cToken))
            );

            const WitnetPriceOracle = await ethers.getContractOrNull(
                "WitnetPriceOracle"
            );
            const ChainlinkPriceOracle = await ethers.getContractOrNull(
                "ChainlinkPriceOracle"
            );

            return {
                admin,
                Comptroller,
                CTokens,
                witnetPriceOracle: WitnetPriceOracle,
                chainlinkPriceOracle: ChainlinkPriceOracle,
            };
        }
    );

    this.beforeEach(async function () {
        deployment = await deployFixture();
    });

    it("Should deploy contracts correctly", async function () {
        const { witnetPriceOracle } = deployment;

        if (witnetPriceOracle)
            expect(witnetPriceOracle.address).to.be.properAddress;
    });

    it("Should lend and borrow", async function () {
        const { admin, Comptroller, CTokens, witnetPriceOracle } = deployment;

        if (!witnetPriceOracle) return;

        const maUSDC = await ethers.getContractAt(
            "CErc20",
            "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
        );
        const maWKAVA = await ethers.getContractAt(
            "CErc20",
            "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e"
        );
        // impersonate
        const usdcWhaleAddress = "0xc35DADB65012eC5796536bD9864eD8773aBc74C4";
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [usdcWhaleAddress],
        });
        const usdcWhale = await ethers.getSigner(usdcWhaleAddress);
        const usdc = await ethers.getContractAt(
            "EIP20Interface",
            "0xfA9343C3897324496A05fC75abeD6bAC29f8A40f"
        );
        await admin.sendTransaction({
            to: usdcWhaleAddress,
            value: ethers.utils.parseEther("1"),
        });
        const kavaWhaleAddress = "0xc35DADB65012eC5796536bD9864eD8773aBc74C4";
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [kavaWhaleAddress],
        });
        const kavaWhale = await ethers.getSigner(kavaWhaleAddress);
        const kava = await ethers.getContractAt(
            "EIP20Interface",
            "0xc86c7C0eFbd6A49B35E8714C5f59D99De09A225b"
        );
        await admin.sendTransaction({
            to: kavaWhaleAddress,
            value: ethers.utils.parseEther("1"),
        });

        // amounts
        const usdcLend = ethers.utils.parseUnits("100", 6);
        const kavaLend = ethers.utils.parseUnits("100", 18);
        const usdcBorrow = ethers.utils.parseUnits("10", 6);
        const kavaBorrow = ethers.utils.parseUnits("10", 18);

        // allowance
        await expect(usdc.connect(usdcWhale).approve(maUSDC.address, usdcLend))
            .not.reverted;
        await expect(kava.connect(kavaWhale).approve(maWKAVA.address, kavaLend))
            .not.reverted;

        // mint
        await expect(maUSDC.connect(usdcWhale).mint(usdcLend)).not.reverted;
        await expect(maWKAVA.connect(kavaWhale).mint(kavaLend)).not.reverted;

        // borrow
        await expect(maUSDC.connect(kavaWhale).borrow(usdcBorrow)).not.reverted;
        await expect(maWKAVA.connect(usdcWhale).borrow(kavaBorrow)).not
            .reverted;

        // check account liquidity
        const {
            0: err,
            1: liquidity,
            2: shortfall,
        } = await Comptroller.getAccountLiquidity(kavaWhale.address);
        const {
            0: err2,
            1: liquidity2,
            2: shortfall2,
        } = await Comptroller.getAccountLiquidity(usdcWhale.address);

        console.log(
            "lended * cf - borrowed",
            ethers.utils.formatEther(kavaLend),
            " kava",
            "*",
            0.35,
            "-",
            ethers.utils.formatUnits(usdcBorrow, 6),
            " usdc"
        );
        console.log("liquidity", ethers.utils.formatEther(liquidity));
        console.log("liqudiity2", ethers.utils.formatEther(liquidity2));
    });
});
