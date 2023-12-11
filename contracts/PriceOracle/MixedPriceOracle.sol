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
}

contract MixedPriceOracle is PriceOracle {
    address public immutable pyth = 0xA2aa501b19aff244D90cc15a4Cf739D2725B5729;

    mapping(string => bytes32) public priceIds;
    mapping(string => uint256) public baseUnits;

    constructor(
        string[] memory symbols_,
        bytes32[] memory priceIds_,
        uint256[] memory baseUnits_
    ) {
        for (uint256 i = 0; i < symbols_.length; i++) {
            priceIds[symbols_[i]] = priceIds_[i];
            baseUnits[symbols_[i]] = baseUnits_[i];
        }
    }

    // price in 18 decimals
    function getPrice(CToken cToken) public view returns (uint256) {
        string memory symbol = cToken.symbol();

        (uint256 price, uint256 feedDecimals) = _getLatestPrice(symbol);

        return price * 10 ** (18 - feedDecimals);
    }

    // price is extended for comptroller usage based on decimals of exchangeRate
    function getUnderlyingPrice(
        CToken cToken
    ) external view override returns (uint256) {
        string memory symbol = cToken.symbol();

        (uint256 price, uint256 feedDecimals) = _getLatestPrice(symbol);

        return (price * (10 ** (36 - feedDecimals))) / baseUnits[symbol];
    }

    function _getLatestPrice(
        string memory symbol
    ) internal view returns (uint256, uint256) {
        require(priceIds[symbol] != bytes32(0), "missing priceId");

        bytes32 priceId = priceIds[symbol];

        // is bytes32 a address?
        if ((priceId << 96) >> 96 == priceId) 
            return _getChainlinkPrice(priceId);
        else
            return _getPythPrice(priceId);
        
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

    function _getChainlinkPrice(bytes32 priceId) internal view returns(uint256, uint256) {
        address priceFeed = address(uint160(uint256(priceId)));
        (
            ,
            int256 price,
            ,
            ,

        ) = IAggregatorV3(priceFeed).latestRoundData();
        uint256 decimals = IAggregatorV3(priceFeed).decimals();

        require(price > 0, "price cannot be zero");
        uint256 uPrice = uint256(price);

        return (uPrice, decimals);
    }
}
