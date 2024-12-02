import { ProtocolConfig } from "./types";

const config: ProtocolConfig = {
    linea: {
        markets: {
            meWETH: {
                source: "chainlink",
                priceFeed: "0x58B375D4A5ddAa7df7C54FE5A6A4B7024747fBE3",
                baseUnit: "1000000000000000000",
                underlyingDecimals: 18,
            },
            meUSDC: {
                source: "chainlink",
                priceFeed: "0xAADAa473C1bDF7317ec07c915680Af29DeBfdCb5",
                baseUnit: "1000000",
                underlyingDecimals: 6,
            },
            meUSDT: {
                source: "chainlink",
                priceFeed: "0xefCA2bbe0EdD0E22b2e0d2F8248E99F4bEf4A7dB",
                baseUnit: "1000000",
                underlyingDecimals: 6,
            },
            meDAI: {
                source: "chainlink",
                priceFeed: "0x5133D67c38AFbdd02997c14Abd8d83676B4e309A",
                baseUnit: "1000000000000000000",
                underlyingDecimals: 18,
            },
            meWBTC: {
                source: "chainlink",
                priceFeed: "0x7A99092816C8BD5ec8ba229e3a6E6Da1E628E1F9",
                baseUnit: "100000000",
                underlyingDecimals: 8,
            },
            mewstETH: {
                source: "chainlink",
                priceFeed: "0x8eCE1AbA32716FdDe8D6482bfd88E9a0ee01f565",
                baseUnit: "1000000000000000000",
                underlyingDecimals: 18,
            },
            meezETH: {
                source: "chainlink",
                priceFeed: "0xD707bD88A6AAe8174C1447af4C746D55676C84BA",
                baseUnit: "1000000000000000000",
                underlyingDecimals: 18,
                toSymbol: "meWETH_api3",
            },
            meweETH: {
                source: "chainlink",
                priceFeed: "0xEAd770C0F71f55D0337B0C7524AC3c72103cc032",
                baseUnit: "1000000000000000000",
                underlyingDecimals: 18,
            },
            mewrsETH: {
                source: "chainlink",
                priceFeed: "0x6feCd2f4798D37fBe64BFDe1eBeCaE3B3fB1Ab9B",
                baseUnit: "1000000000000000000",
                underlyingDecimals: 18,
                toSymbol: "meWETH_api3",
            },
            meWETH_api3: {
                source: "chainlink",
                priceFeed: "0x14D8CA4d05cfd1EA4739AbAB06b28D8dC7C6d6cA",
                baseUnit: "1000000000000000000",
                underlyingDecimals: 18,
            },
        },
    },
};

export default config;
