// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "../PriceOracle.sol";

interface IDefaultAdapter {
    function decimals() external view returns (uint8);
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
    function latestAnswer() external view returns (int256);

    function latestTimestamp() external view returns (uint256);
}

struct PriceConfig {
    address defaultFeed; // chainlink & eOracle
    string toSymbol;
    uint256 underlyingDecimals;
}

contract MixedPriceOracleV3 is PriceOracle {
    mapping(string => PriceConfig) public configs;

    constructor(string[] memory symbols_, PriceConfig[] memory configs_) {
        for (uint256 i = 0; i < symbols_.length; i++) {
            configs[symbols_[i]] = configs_[i];
        }
    }

    function getPrice(CToken cToken) public view returns (uint256) {
        string memory symbol = cToken.symbol();
        return _getPriceUSD(symbol);
    }

    // price is extended for comptroller usage based on decimals of exchangeRate
    function getUnderlyingPrice(
        CToken cToken
    ) external view override returns (uint256) {
        string memory symbol = cToken.symbol();

        PriceConfig memory config = configs[symbol];

        uint256 priceUsd = _getPriceUSD(symbol);

        return priceUsd * 10 ** (18 - config.underlyingDecimals);
    }

    function _getPriceUSD(
        string memory symbol
    ) internal view returns (uint256) {
        PriceConfig memory config = configs[symbol];

        (uint256 feedPrice, uint256 feedDecimals) = _getLatestPrice(config);
        uint256 price = feedPrice * 10 ** (18 - feedDecimals);

        if (
            keccak256(abi.encodePacked(config.toSymbol)) !=
            keccak256(abi.encodePacked("USD"))
        ) {
            price = (price * _getPriceUSD(config.toSymbol)) / 10 ** 18;
        }

        return price;
    }

    function _getLatestPrice(
        PriceConfig memory config
    ) internal view returns (uint256, uint256) {
        if (config.defaultFeed == address(0)) revert("missing priceFeed");

        int256 price = IDefaultAdapter(config.defaultFeed).latestAnswer();
        uint256 decimals = IDefaultAdapter(config.defaultFeed).decimals();

        require(price > 0, "price cannot be zero");
        uint256 uPrice = uint256(price);

        return (uPrice, decimals);
    }
}
