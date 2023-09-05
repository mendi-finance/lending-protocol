// price oracle deploy fixture

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import hre, { ethers, deployments } from "hardhat";
import { pythOracleFixture } from "./_fixtures";

describe.only("Pyth Price Oracle", function () {
    let pythOracle: Contract;

    this.beforeAll(async function () {
        [pythOracle] = await pythOracleFixture();
    });

    it("Should deploy properly", async function () {
        expect(pythOracle.address).properAddress;
    });

    it("Should return proper prices", async function () {
        const markets = [
            "0xAd7f33984bed10518012013D4aB0458D37FEE6F3",
            "0x333D8b480BDB25eA7Be4Dd87EEB359988CE1b30D",
            "0xf669C3C03D9fdF4339e19214A749E52616300E89",
        ];

        const prices = await Promise.all(
            markets.map(m => pythOracle.getPrice(m))
        );
        const underlyingPrices = await Promise.all(
            markets.map(m => pythOracle.getUnderlyingPrice(m))
        );

        console.log(
            prices.map(x => x.toString()),
            underlyingPrices.map(x => x.toString())
        );
    });
});
