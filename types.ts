export type ProtocolConfig = {
    [network: string]: ProtocolNetworkConfig;
};

export type ProtocolNetworkConfig = {
    timelock?: `0x${string}`;
    multisig?: `0x${string}`;
    markets: {
        [symbol: string]: MarketConfig;
    };
};

export type MarketConfig = {
    source: "chainlink";
    priceFeed: `0x${string}`;
    baseUnit: `1${string}`;
    underlyingDecimals: number;
    reserveFactor?: number;
    collateralFactor?: number;
    toSymbol?: string;
};
