// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.10;

import "../PriceOracle.sol";

interface IStaticOracle {
    function quoteSpecificPoolsWithTimePeriod(
        uint128 _baseAmount,
        address _baseToken,
        address _quoteToken,
        address[] calldata _pools,
        uint32 _period
    ) external view returns (uint256 _quoteAmount);
}

contract UniswapPriceOracle is PriceOracle {
    IStaticOracle public staticOracle;

    // cToken => quoteToken
    mapping(CToken => address) public quoteTokens;

    // cToken => quotePool
    mapping(CToken => address) public quotePools;

    constructor(
        IStaticOracle staticOracle_,
        CToken[] memory cTokens,
        address[] memory quoteTokens_,
        address[] memory quotePools_
    ) {
        staticOracle = staticOracle_;
        for (uint256 i = 0; i < cTokens.length; i++) {
            quoteTokens[cTokens[i]] = quoteTokens_[i];
            quotePools[cTokens[i]] = quotePools_[i];
        }
    }

    // price in 18 decimals
    function getPrice(CToken cToken) public view returns (uint256) {
        return _getLatestPrice(cToken, false);
    }

    // price is extended for comptroller usage based on decimals of exchangeRate
    function getUnderlyingPrice(
        CToken cToken
    ) external view override returns (uint256) {
        return _getLatestPrice(cToken, true);
    }

    function _getLatestPrice(
        CToken cToken,
        bool underlyingPrice
    ) internal view returns (uint256) {
        uint256 period = 1800; // 30 minutes
        address baseToken = CErc20Interface(address(cToken)).underlying();
        uint256 baseTokenDecimals = EIP20Interface(baseToken).decimals();
        uint256 baseAmount = 10 ** baseTokenDecimals;

        address quoteToken = quoteTokens[cToken];
        uint256 quoteTokenDecimals = EIP20Interface(quoteToken).decimals();

        address quotePool = quotePools[cToken];
        address[] memory pools = new address[](1);
        pools[0] = quotePool;

        uint256 quoteAmount = staticOracle.quoteSpecificPoolsWithTimePeriod(
            uint128(baseAmount),
            baseToken,
            quoteToken,
            pools,
            uint32(period)
        );

        if (underlyingPrice) {
            uint256 price = quoteAmount *
                (10 ** (36 - baseTokenDecimals - quoteTokenDecimals));
            return price;
        } else {
            uint256 price = quoteAmount * (10 ** (18 - baseTokenDecimals));
            return price;
        }
    }
}
