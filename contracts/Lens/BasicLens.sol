// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

import "../EIP20Interface.sol";
import "../PriceOracle.sol";

import "../RewardDistributor.sol";

interface ComptrollerLensInterface {
    function claimComp(address) external;

    function rewardDistributor() external view returns (address);
}

contract BasicLens {
    function rewardsAccrued(
        ComptrollerLensInterface comptroller,
        address account
    )
        external
        returns (address[] memory rewardTokens, uint256[] memory accrued)
    {
        address externalRewardDistributor = comptroller.rewardDistributor();

        rewardTokens = RewardDistributor(externalRewardDistributor)
            .getRewardTokens();

        uint256[] memory beforeBalances = getBalancesInternal(
            rewardTokens,
            account
        );

        comptroller.claimComp(account);

        uint256[] memory afterBalances = getBalancesInternal(
            rewardTokens,
            account
        );

        accrued = new uint256[](rewardTokens.length);
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            accrued[i] = afterBalances[i] - beforeBalances[i];
        }
    }

    function getBalancesInternal(
        address[] memory tokens,
        address account
    ) internal view returns (uint256[] memory balances) {
        balances = new uint256[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            balances[i] = EIP20Interface(tokens[i]).balanceOf(account);
        }
    }
}
