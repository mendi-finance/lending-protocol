// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

import "../PriceOracle.sol";

interface IAggregatorV3 {
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
    bytes32 priceId;
    string toSymbol;
    uint256 underlyingDecimals;
}

contract MixedPriceOracleV2 is PriceOracle {
    address public immutable pyth = 0xA2aa501b19aff244D90cc15a4Cf739D2725B5729;

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
        if (config.priceId == bytes32(0)) revert("missing priceFeed");

        bytes32 priceId = config.priceId;

        // is bytes32 a address?
        if ((priceId << 96) >> 96 == priceId)
            return _getChainlinkPrice(priceId);
        else return _getPythPrice(priceId);
    }

    function _getPythPrice(
        bytes32 priceId
    ) internal view returns (uint256, uint256) {
        PythStructs.Price memory currentBasePrice = IPyth(pyth).getPriceUnsafe(
            priceId
        );
        require(currentBasePrice.price > 0, "price cannot be zero");
        require(currentBasePrice.expo <= 0, "price cannot be zero");

        uint256 price = uint256(uint64(currentBasePrice.price));
        uint256 decimals = uint256(uint32(-currentBasePrice.expo));

        return (price, decimals);
    }

    function _getChainlinkPrice(
        bytes32 priceId
    ) internal view returns (uint256, uint256) {
        address priceFeed = address(uint160(uint256(priceId)));

        int256 price = IAggregatorV3(priceFeed).latestAnswer();
        uint256 decimals = IAggregatorV3(priceFeed).decimals();

        require(price > 0, "price cannot be zero");
        uint256 uPrice = uint256(price);

        return (uPrice, decimals);
    }
}
