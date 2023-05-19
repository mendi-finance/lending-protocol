// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

import "../EIP20Interface.sol";
import "../PriceOracle.sol";

interface ComptrollerLensInterface {
    function markets(address) external view returns (bool, uint256);

    function oracle() external view returns (PriceOracle);

    function getAccountLiquidity(
        address
    ) external view returns (uint256, uint256, uint256);

    function getAssetsIn(address) external view returns (CToken[] memory);

    function getCompAddress() external view returns (address);

    function claimComp(address) external;

    function compAccrued(address) external view returns (uint256);

    function compSpeeds(address) external view returns (uint256);

    function compSupplySpeeds(address) external view returns (uint256);

    function compBorrowSpeeds(address) external view returns (uint256);

    function borrowCaps(address) external view returns (uint256);

    function getExternalRewardDistributorAddress()
        external
        view
        returns (address);
}

interface ExternalRewardDistributorInterface {
    function getRewardTokens() external view returns (address[] memory);

    function rewardTokenExists(address token) external view returns (bool);
}

contract BasicLens {
    function rewardsAccrued(
        ComptrollerLensInterface comptroller,
        address account
    )
        external
        returns (address[] memory rewardTokens, uint256[] memory accrued)
    {
        address externalRewardDistributor = comptroller
            .getExternalRewardDistributorAddress();

        rewardTokens = ExternalRewardDistributorInterface(
            externalRewardDistributor
        ).getRewardTokens();

        address defaultRewardToken = comptroller.getCompAddress();
        bool doesDefaultTokenExist = ExternalRewardDistributorInterface(
            externalRewardDistributor
        ).rewardTokenExists(defaultRewardToken);

        if (!doesDefaultTokenExist) {
            address[] memory tempRewardTokens = new address[](
                rewardTokens.length + 1
            );
            tempRewardTokens[0] = defaultRewardToken;
            for (uint256 i = 0; i < rewardTokens.length; i++) {
                tempRewardTokens[i + 1] = rewardTokens[i];
            }
            rewardTokens = tempRewardTokens;
        }

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
