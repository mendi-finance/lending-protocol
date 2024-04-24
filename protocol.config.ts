import { ProtocolConfig } from "./types";

const config: ProtocolConfig = {
    linea: {
        markets: {
            meWETH: {
                source: "chainlink",
                priceFeed: "0x3c6Cd9Cc7c7a4c2Cf5a82734CD249D7D593354dA",
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
                priceFeed: "0xB1d9A4Fe9331E28C5588B63343BF064A397aadB8",
                // priceFeed: 0xAeF45ceDf76CA61DF495646c25b1a2015A596835 // api3
                baseUnit: "1000000000000000000",
                underlyingDecimals: 18,
                toSymbol: "meWETH",
            },
        },
    },
};

export default config;
