import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { setupFixture } from "./_fixtures";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const mendiAddress = "0xd86C8d4279CCaFbec840c782BcC50D201f277419";
const wethAddress = "0xc86c7C0eFbd6A49B35E8714C5f59D99De09A225b";

const lenderAddress = "0x85591bFABB18Be044fA98D72F7093469C588483C";
const wethWhaleAddress = "0x0a4A04e766E9475dC044FBF079aFa6111BcF1f56";

const markets = [
    "0x4E4e3EbB5d55787885a871F3D9b23638A68E3681",
    "0x3ED88159612B029a21174250A9DC03366b1119Ae",
    "0x97799F2Fd7F7Bbb66050cac3774C673e5f5A52af",
];
const supplySpeeds = [
    "15860055827886700",
    "15860055827886700",
    "12976409313725500",
];
const borrowSpeeds = [
    "111026007625272000",
    "111026007625272000",
    "90839460784313700",
];

const MANTISSA = ethers.constants.WeiPerEther;

describe("RewardDistributor", () => {
    let comptroller: Contract;
    let cTokens: { [key: string]: Contract };
    let rewardDistributor: Contract;

    let mendiToken: Contract;
    let wethToken: Contract;

    let lender: SignerWithAddress;
    let wethWhale: SignerWithAddress;

    let rewardStart: BigNumber;

    beforeEach(async () => {
        const setup = await setupFixture();
        comptroller = setup.comptroller;
        rewardDistributor = setup.rewardDistributor;
        cTokens = setup.cTokens;

        const currentBlock = await comptroller.getBlockNumber();
        rewardStart = currentBlock;

        await rewardDistributor._whitelistToken(wethAddress);

        await rewardDistributor._updateRewardSpeeds(
            wethAddress,
            markets,
            supplySpeeds,
            borrowSpeeds
        );

        // impersonate users
        await ethers.provider.send("hardhat_impersonateAccount", [
            lenderAddress,
        ]);
        lender = await ethers.getSigner(lenderAddress);
        await ethers.provider.send("hardhat_impersonateAccount", [
            wethWhaleAddress,
        ]);
        wethWhale = await ethers.getSigner(wethWhaleAddress);

        // tokens
        mendiToken = await ethers.getContractAt("EIP20Interface", mendiAddress);
        wethToken = await ethers.getContractAt("EIP20Interface", wethAddress);

        await wethToken
            .connect(wethWhale)
            .transfer(
                rewardDistributor.address,
                ethers.utils.parseEther("10000")
            );
    });

    it("Should be deployed", async () => {
        expect(rewardDistributor.address).to.be.properAddress;
    });

    describe("Admin", () => {
        it("Should whitelist a token", async () => {
            await expect(rewardDistributor._whitelistToken(mendiAddress)).to.not
                .reverted;
        });

        it("Should revert non admin whitelist", async () => {
            const [deployer, user] = await ethers.getSigners();
            await expect(
                rewardDistributor.connect(user)._whitelistToken(mendiAddress)
            ).to.revertedWith("Ownable: caller is not the owner");
        });

        it("Should revert whitelist zero address", async () => {
            await expect(
                rewardDistributor._whitelistToken(ethers.constants.AddressZero)
            ).to.revertedWith(
                "RewardDistributor: reward token cannot be zero address"
            );
        });

        it("Should revert whitelist a token twice", async () => {
            await expect(rewardDistributor._whitelistToken(mendiAddress)).to.not
                .reverted;

            await expect(
                rewardDistributor._whitelistToken(mendiAddress)
            ).to.revertedWith("RewardDistributor: reward token already exists");
        });

        it("Should update reward speeds", async () => {
            const supplyReward1 = supplySpeeds[0];
            const supplyReward2 = BigNumber.from(supplySpeeds[1]).div(2);
            const borrowReward1 = BigNumber.from(borrowSpeeds[0]).mul(3).div(2);
            const borrowReward2 = BigNumber.from(borrowSpeeds[1]).div(2);

            await expect(
                rewardDistributor._updateRewardSpeeds(
                    wethAddress,
                    markets.slice(0, 2),
                    [supplyReward1, supplyReward2],
                    [borrowReward1, borrowReward2]
                )
            ).to.not.reverted;

            const marketState = await rewardDistributor.rewardMarketState(
                wethAddress,
                markets[0]
            );
            expect(marketState.supplySpeed).to.be.equal(supplyReward1);
            expect(marketState.borrowSpeed).to.be.equal(borrowReward1);
        });

        it("Should revert non admin update reward speeds", async () => {
            const [deployer, user] = await ethers.getSigners();
            await expect(
                rewardDistributor
                    .connect(user)
                    ._updateRewardSpeeds(
                        wethAddress,
                        [
                            "0x58333b7D0644b52E0e56cC3803CA94aF9e0B52C3",
                            "0x0B6c2a9d4d739778dF6cD1cf815754BD1438063c",
                        ],
                        ["15860055827886700", "12976409313725500"],
                        ["111026007625272000", "2883646514161220"]
                    )
            ).to.revertedWith("Ownable: caller is not the owner");
        });

        it("Should revert update reward speeds incorrect input", async () => {
            await expect(
                rewardDistributor._updateRewardSpeeds(
                    wethAddress,
                    [
                        "0x58333b7D0644b52E0e56cC3803CA94aF9e0B52C3",
                        "0x0B6c2a9d4d739778dF6cD1cf815754BD1438063c",
                    ],
                    ["15860055827886700", "12976409313725500"],
                    ["111026007625272000"]
                )
            ).to.revertedWith(
                "RewardDistributor: borrow speed array length mismatch"
            );

            await expect(
                rewardDistributor._updateRewardSpeeds(
                    wethAddress,
                    ["0x5569b83de187375d43FBd747598bfe64fC8f6436"],
                    ["15860055827886700", "12976409313725500"],
                    ["111026007625272000"]
                )
            ).to.revertedWith(
                "RewardDistributor: supply speed array length mismatch"
            );

            await expect(
                rewardDistributor._updateRewardSpeeds(
                    mendiAddress,
                    [
                        "0x58333b7D0644b52E0e56cC3803CA94aF9e0B52C3",
                        "0x0B6c2a9d4d739778dF6cD1cf815754BD1438063c",
                    ],
                    ["15860055827886700", "12976409313725500"],
                    ["111026007625272000", "2883646514161220"]
                )
            ).to.revertedWith("RewardDistributor: reward token does not exist");
        });

        it("Should grant reward to user ", async () => {
            const [deployer, user] = await ethers.getSigners();
            await expect(
                rewardDistributor
                    .connect(deployer)
                    ._grantReward(wethAddress, deployer.address, 1000)
            ).to.not.reverted;

            await expect(
                rewardDistributor
                    .connect(user)
                    ._grantReward(wethAddress, user.address, 1000)
            ).to.revertedWith("Ownable: caller is not the owner");

            await expect(
                rewardDistributor
                    .connect(deployer)
                    ._grantReward(lenderAddress, deployer.address, 1000)
            ).to.revertedWith(
                "RewardDistributor: grant reward token does not exist"
            );
        });

        it("Should revert non admin grant reward", async () => {
            const [deployer, user] = await ethers.getSigners();
            await expect(
                rewardDistributor
                    .connect(user)
                    ._grantReward(wethAddress, deployer.address, 1000)
            ).to.revertedWith("Ownable: caller is not the owner");
        });
    });

    it("Should have a comptroller", async () => {
        const comptrollerSetted = await rewardDistributor.comptroller();
        expect(comptrollerSetted).to.be.properAddress;
        expect(comptrollerSetted).to.be.equal(comptroller.address);
    });

    it("Should claim external rewards", async () => {
        await ethers.provider.send("hardhat_impersonateAccount", [
            lenderAddress,
        ]);
        const user = await ethers.getSigner(lenderAddress);
        const userMarkets = await comptroller.getAssetsIn(user.address);

        // reset sonne reward by claiming
        await comptroller
            .connect(user)
            .functions["claimComp(address,address[])"](
                lenderAddress,
                userMarkets
            );
        //

        const networkNow = (await ethers.provider.getBlock("latest")).timestamp;
        const halfPeriod = 12 * 60 * 60; // 12 hours
        const fullPeriod = 24 * 60 * 60; // 24 hours
        // set block time to reward start
        await ethers.provider.send("evm_setNextBlockTimestamp", [
            networkNow + halfPeriod,
        ]);

        const firstRewards = await calculateRewards(
            networkNow,
            networkNow + halfPeriod,
            comptroller,
            rewardDistributor
        );

        await rewardDistributor._updateRewardSpeeds(
            wethAddress,
            [markets[1]],
            [0],
            ["222052015250544000"]
        );

        // set block time to reward start
        await ethers.provider.send("evm_setNextBlockTimestamp", [
            networkNow + fullPeriod,
        ]);

        const secondRewards = await calculateRewards(
            networkNow + halfPeriod,
            networkNow + fullPeriod,
            comptroller,
            rewardDistributor
        );

        const diffBalances = await watchBalances(
            async () => {
                await comptroller
                    .connect(user)
                    .functions["claimComp(address,address[])"](
                        lenderAddress,
                        userMarkets
                    );
            },
            [mendiAddress, wethAddress],
            lenderAddress
        );

        const expectedWEthReward = firstRewards.add(secondRewards);
        const diffMendi = diffBalances[0];
        const diffWEth = diffBalances[1];

        expect(diffWEth).to.closeTo(
            expectedWEthReward,
            ethers.utils.parseUnits("1", 9)
        );
    });
});

const calculateRewards = async (start, end, comptroller, rewardDistributor) => {
    const positions = await getWalletPositions(comptroller, lenderAddress);
    const marketStates = await Promise.all(
        positions.map(position =>
            rewardDistributor.rewardMarketState(
                wethAddress,
                position.cToken.address
            )
        )
    );
    const supplySpeeds = marketStates.map(state => state.supplySpeed);
    const supplyBlocks = marketStates.map(state => state.supplyBlock);
    const borrowSpeeds = marketStates.map(state => state.borrowSpeed);
    const borrowBlocks = marketStates.map(state => state.borrowBlock);

    const marketRewards = positions.map((position, i) => {
        const supplyReward = position.supplyRatio
            .mul(supplySpeeds[i])
            .div(MANTISSA)
            .mul(end - start);
        const borrowReward = position.borrowRatio
            .mul(borrowSpeeds[i])
            .div(MANTISSA)
            .mul(end - start);
        return supplyReward.add(borrowReward);
    });

    const totalReward = marketRewards.reduce(
        (acc, reward) => acc.add(reward),
        ethers.BigNumber.from(0)
    );

    return totalReward;
};

const getWalletPositions = async (
    comptroller: Contract,
    userAddress: string
) => {
    const userMarkets = await comptroller.getAssetsIn(userAddress);
    const cTokens = await Promise.all(
        userMarkets.map((market: string) =>
            ethers.getContractAt("CTokenInterface", market)
        )
    );
    const balances = await Promise.all(
        cTokens.map(cToken => cToken.balanceOf(userAddress))
    );
    let borrowBalances = await Promise.all(
        cTokens.map(cToken => cToken.borrowBalanceStored(userAddress))
    );
    const borrowIndexs = await Promise.all(
        cTokens.map(cToken => cToken.borrowIndex())
    );
    const totalSupplies = await Promise.all(
        cTokens.map(cToken => cToken.totalSupply())
    );
    let totalBorrows = await Promise.all(
        cTokens.map(cToken => cToken.totalBorrows())
    );

    borrowBalances = borrowBalances.map((balance, i) =>
        balance.mul(MANTISSA).div(borrowIndexs[i])
    );
    totalBorrows = totalBorrows.map((balance, i) =>
        balance.mul(MANTISSA).div(borrowIndexs[i])
    );

    return cTokens.map((cToken, i) => ({
        address: cToken.address,
        cToken: cToken,
        supplyBalance: balances[i],
        borrowBalance: borrowBalances[i],
        supplyRatio: balances[i].mul(MANTISSA).div(totalSupplies[i]),
        borrowRatio: borrowBalances[i].mul(MANTISSA).div(totalBorrows[i]),
        totalSupply: totalSupplies[i],
        totalBorrow: totalBorrows[i],
    }));
};

const watchBalances = async (
    fn: Function,
    tokens: string[],
    userAddress: string
) => {
    const tokenContracts = await Promise.all(
        tokens.map(token => ethers.getContractAt("EIP20Interface", token))
    );
    const getBalances = async () =>
        await Promise.all(
            tokenContracts.map(contract => contract.balanceOf(userAddress))
        );

    const beforeBalances = await getBalances();
    await fn();
    const afterBalances = await getBalances();

    return afterBalances.map((balance, i) => balance.sub(beforeBalances[i]));
};
