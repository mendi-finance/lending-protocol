export default {
    linea: {
        meWETH: {
            source: "pyth",
            priceFeed:
                "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
            baseUnit: "1000000000000000000",
            collateralFactor: "0.7",
            reserveFactor: "0.15",
            rateModel: "MediumRateModel",
        },
        meUSDC: {
            source: "pyth",
            priceFeed:
                "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
            baseUnit: "1000000",
            collateralFactor: "0.8",
            reserveFactor: "0.13",
            rateModel: "StableRateModel",
        },
        meUSDT: {
            source: "pyth",
            priceFeed:
                "0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b",
            baseUnit: "1000000",
            collateralFactor: "0.8",
            reserveFactor: "0.13",
            rateModel: "StableRateModel",
        },
        meDAI: {
            source: "pyth",
            priceFeed:
                "0xb0948a5e5313200c632b51bb5ca32f6de0d36e9950a942d19751e833f70dabfd",
            baseUnit: "1000000000000000000",
        },
        meWBTC: {
            source: "pyth",
            priceFeed:
                "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
            baseUnit: "100000000",
        },
        mewstETH: {
            source: "chainlink",
            priceFeed: "0x8ece1aba32716fdde8d6482bfd88e9a0ee01f565",
            baseUnit: "1000000000000000000",
        },
        meezETH: {
            source: "chainlink",
            priceFeed: "0xAeF45ceDf76CA61DF495646c25b1a2015A596835",
            baseUnit: "1000000000000000000"
        }
    },
    linea_goerli: {
        meUSDC: {
            source: "",
            priceFeed: "",
            priceDecimals: "",
            baseUnit: "1000000",
            collateralFactor: "0.8",
            reserveFactor: "0.13",
            rateModel: "StableRateModel",
        },
        meUSDT: {
            source: "",
            priceFeed: "",
            priceDecimals: "",
            baseUnit: "1000000",
            collateralFactor: "0.8",
            reserveFactor: "0.13",
            rateModel: "StableRateModel",
        },
        meWETH: {
            source: "",
            priceFeed: "",
            priceDecimals: "",
            baseUnit: "1000000000000000000",
            collateralFactor: "0.7",
            reserveFactor: "0.15",
            rateModel: "MediumRateModel",
        },
    },
    linea_sepolia: {
        meUSDC: {
            source: "",
            priceFeed: "",
            priceDecimals: "",
            baseUnit: "1000000",
            collateralFactor: "0.8",
            reserveFactor: "0.13",
            rateModel: "StableRateModel",
        },
        meWETH: {
            source: "",
            priceFeed: "",
            priceDecimals: "",
            baseUnit: "1000000000000000000",
            collateralFactor: "0.7",
            reserveFactor: "0.15",
            rateModel: "MediumRateModel",
        },
    },
    omni_testnet: {
        meWOMNI: {
            source: "",
            priceFeed: "",
            priceDecimals: "",
            baseUnit: "1000000000000000000",
            collateralFactor: "0.7",
            reserveFactor: "0.15",
            rateModel: "VolatileRateModel",
        },
        meUSDC: {
            source: "",
            priceFeed: "",
            priceDecimals: "",
            baseUnit: "1000000000000000000",
            collateralFactor: "0.8",
            reserveFactor: "0.13",
            rateModel: "StableRateModel",
        },
        meUSDT: {
            source: "",
            priceFeed: "",
            priceDecimals: "",
            baseUnit: "1000000000000000000",
            collateralFactor: "0.8",
            reserveFactor: "0.13",
            rateModel: "StableRateModel",
        },
    },
} as const;
