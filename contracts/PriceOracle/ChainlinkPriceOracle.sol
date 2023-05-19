// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.10;

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
}

interface ICToken {
    function underlying() external view returns (address);
}

contract ChainlinkPriceOracle is PriceOracle {
    mapping(string => IAggregatorV3) public priceFeeds;
    mapping(string => uint256) public baseUnits;

    constructor(
        string[] memory symbols_,
        IAggregatorV3[] memory feeds_,
        uint256[] memory baseUnits_
    ) {
        for (uint256 i = 0; i < symbols_.length; i++) {
            priceFeeds[symbols_[i]] = feeds_[i];
            baseUnits[symbols_[i]] = baseUnits_[i];
        }
    }

    // price in 18 decimals
    function getPrice(CToken cToken) public view returns (uint256) {
        string memory symbol = cToken.symbol();
        uint256 feedDecimals = priceFeeds[symbol].decimals();

        (uint256 price, ) = _getLatestPrice(symbol);

        return price * 10 ** (18 - feedDecimals);
    }

    // price is extended for comptroller usage based on decimals of exchangeRate
    function getUnderlyingPrice(
        CToken cToken
    ) external view override returns (uint256) {
        string memory symbol = cToken.symbol();
        uint256 feedDecimals = priceFeeds[symbol].decimals();

        (uint256 price, ) = _getLatestPrice(symbol);
        return (price * (10 ** (36 - feedDecimals))) / baseUnits[symbol];
    }

    function _getLatestPrice(
        string memory symbol
    ) internal view returns (uint256, uint256) {
        require(address(priceFeeds[symbol]) != address(0), "missing priceFeed");

        (
            ,
            //uint80 roundID
            int256 price, //uint256 startedAt
            ,
            uint256 timeStamp, //uint80 answeredInRound

        ) = priceFeeds[symbol].latestRoundData();

        require(price > 0, "price cannot be zero");
        uint256 uPrice = uint256(price);

        return (uPrice, timeStamp);
    }
}
