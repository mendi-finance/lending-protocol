// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./CTokenInterfaces.sol";
import "./EIP20Interface.sol";
import "./ExponentialNoError.sol";

struct RewardMarketState {
    /// @notice The supply speed for each market
    uint256 supplySpeed;
    /// @notice The supply index for each market
    uint224 supplyIndex;
    /// @notice The last block number that Reward accrued for supply
    uint32 supplyBlock;
    /// @notice The borrow speed for each market
    uint256 borrowSpeed;
    /// @notice The borrow index for each market
    uint224 borrowIndex;
    /// @notice The last block number that Reward accrued for borrow
    uint32 borrowBlock;
}

struct RewardAccountState {
    /// @notice The supply index for each market as of the last time the account accrued Reward
    mapping(address => uint256) supplierIndex;
    /// @notice The borrow index for each market as of the last time the account accrued Reward
    mapping(address => uint256) borrowerIndex;
    /// @notice Accrued Reward but not yet transferred
    uint256 rewardAccrued;
}

/**
 * @title Reward Distributor (version 1)
 * @author Sonne Finance
 * @notice This contract is used to distribute rewards to users for supplying and borrowing assets.
 * Each supply and borrow changing action from comptroller will trigger index update for each reward token.
 */
contract RewardDistributor is
    Initializable,
    OwnableUpgradeable,
    ExponentialNoError
{
    event RewardAccrued(
        address indexed rewardToken,
        address indexed user,
        uint256 deltaAccrued,
        uint256 totalAccrued
    );

    event RewardGranted(
        address indexed rewardToken,
        address indexed user,
        uint256 amount
    );

    event SupplySpeedUpdated(
        address indexed rewardToken,
        address indexed cToken,
        uint256 supplySpeed
    );

    event BorrowSpeedUpdated(
        address indexed rewardToken,
        address indexed cToken,
        uint256 borrowSpeed
    );

    /// @notice The initial reward index for a market
    uint224 public constant rewardInitialIndex = 1e36;

    /// @notice The comptroller that rewards are distributed to
    address public comptroller;

    /// @notice The Reward state for each reward token for each market
    mapping(address => mapping(address => RewardMarketState))
        public rewardMarketState;

    /// @notice The Reward state for each reward token for each account
    mapping(address => mapping(address => RewardAccountState))
        public rewardAccountState;

    /// @notice Added reward tokens
    address[] public rewardTokens;
    /// @notice Flag to check if reward token added before
    mapping(address => bool) public rewardTokenExists;

    modifier onlyComptroller() {
        require(
            msg.sender == comptroller,
            "RewardDistributor: only comptroller can call this function"
        );
        _;
    }

    function initialize(address comptroller_) public initializer {
        __Ownable_init();

        comptroller = comptroller_;
    }

    function _whitelistToken(address rewardToken_) public onlyOwner {
        require(
            rewardToken_ != address(0),
            "RewardDistributor: reward token cannot be zero address"
        );
        require(
            !rewardTokenExists[rewardToken_],
            "RewardDistributor: reward token already exists"
        );

        rewardTokens.push(rewardToken_);
        rewardTokenExists[rewardToken_] = true;
    }

    function _updateRewardSpeeds(
        address rewardToken_,
        address[] memory cTokens,
        uint256[] memory supplySpeeds,
        uint256[] memory borrowSpeeds
    ) public onlyOwner {
        require(
            rewardTokenExists[rewardToken_],
            "RewardDistributor: reward token does not exist"
        );
        require(
            cTokens.length == supplySpeeds.length,
            "RewardDistributor: supply speed array length mismatch"
        );
        require(
            cTokens.length == borrowSpeeds.length,
            "RewardDistributor: borrow speed array length mismatch"
        );

        for (uint256 i = 0; i < cTokens.length; i++) {
            updateRewardSpeedInternal(
                rewardToken_,
                cTokens[i],
                supplySpeeds[i],
                borrowSpeeds[i]
            );
        }
    }

    function updateRewardSpeedInternal(
        address rewardToken,
        address cToken,
        uint256 supplySpeed,
        uint256 borrowSpeed
    ) internal {
        RewardMarketState storage marketState = rewardMarketState[rewardToken][
            cToken
        ];

        if (marketState.supplySpeed != supplySpeed) {
            if (marketState.supplyIndex == 0) {
                marketState.supplyIndex = rewardInitialIndex;
            }

            notifySupplyIndexInternal(rewardToken, cToken);
            marketState.supplySpeed = supplySpeed;
            emit SupplySpeedUpdated(rewardToken, cToken, supplySpeed);
        }

        if (marketState.borrowSpeed != borrowSpeed) {
            if (marketState.borrowIndex == 0) {
                marketState.borrowIndex = rewardInitialIndex;
            }

            notifyBorrowIndexInternal(rewardToken, cToken);
            marketState.borrowSpeed = borrowSpeed;
            emit BorrowSpeedUpdated(rewardToken, cToken, borrowSpeed);
        }
    }

    function notifySupplyIndex(address cToken) external onlyComptroller {
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            notifySupplyIndexInternal(rewardTokens[i], cToken);
        }
    }

    function notifySupplyIndexInternal(
        address rewardToken,
        address cToken
    ) internal {
        RewardMarketState storage marketState = rewardMarketState[rewardToken][
            cToken
        ];

        uint32 blockNumber = getBlockNumber();

        if (blockNumber > marketState.supplyBlock) {
            if (marketState.supplySpeed > 0) {
                uint256 deltaBlocks = blockNumber - marketState.supplyBlock;
                uint256 supplyTokens = CTokenInterface(cToken).totalSupply();
                uint256 accrued = mul_(deltaBlocks, marketState.supplySpeed);
                Double memory ratio = supplyTokens > 0
                    ? fraction(accrued, supplyTokens)
                    : Double({mantissa: 0});
                marketState.supplyIndex = safe224(
                    add_(Double({mantissa: marketState.supplyIndex}), ratio)
                        .mantissa,
                    "new index exceeds 224 bits"
                );
            }

            marketState.supplyBlock = blockNumber;
        }
    }

    function notifyBorrowIndex(address cToken) external onlyComptroller {
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            notifyBorrowIndexInternal(rewardTokens[i], cToken);
        }
    }

    function notifyBorrowIndexInternal(
        address rewardToken,
        address cToken
    ) internal {
        Exp memory marketBorrowIndex = Exp({
            mantissa: CTokenInterface(cToken).borrowIndex()
        });

        RewardMarketState storage marketState = rewardMarketState[rewardToken][
            cToken
        ];

        uint32 blockNumber = getBlockNumber();

        if (blockNumber > marketState.borrowBlock) {
            if (marketState.borrowSpeed > 0) {
                uint256 deltaBlocks = blockNumber - marketState.borrowBlock;
                uint256 borrowAmount = div_(
                    CTokenInterface(cToken).totalBorrows(),
                    marketBorrowIndex
                );
                uint256 accrued = mul_(deltaBlocks, marketState.borrowSpeed);
                Double memory ratio = borrowAmount > 0
                    ? fraction(accrued, borrowAmount)
                    : Double({mantissa: 0});
                marketState.borrowIndex = safe224(
                    add_(Double({mantissa: marketState.borrowIndex}), ratio)
                        .mantissa,
                    "new index exceeds 224 bits"
                );
            }

            marketState.borrowBlock = blockNumber;
        }
    }

    function notifySupplier(
        address cToken,
        address supplier
    ) external onlyComptroller {
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            notifySupplierInternal(rewardTokens[i], cToken, supplier);
        }
    }

    function notifySupplierInternal(
        address rewardToken,
        address cToken,
        address supplier
    ) internal {
        RewardMarketState storage marketState = rewardMarketState[rewardToken][
            cToken
        ];
        RewardAccountState storage accountState = rewardAccountState[
            rewardToken
        ][supplier];

        uint256 supplyIndex = marketState.supplyIndex;
        uint256 supplierIndex = accountState.supplierIndex[cToken];

        // Update supplier's index to the current index since we are distributing accrued Reward
        accountState.supplierIndex[cToken] = supplyIndex;

        if (supplierIndex == 0 && supplyIndex >= rewardInitialIndex) {
            supplierIndex = rewardInitialIndex;
        }

        // Calculate change in the cumulative sum of the Reward per cToken accrued
        Double memory deltaIndex = Double({
            mantissa: sub_(supplyIndex, supplierIndex)
        });

        uint256 supplierTokens = CTokenInterface(cToken).balanceOf(supplier);

        // Calculate Reward accrued: cTokenAmount * accruedPerCToken
        uint256 supplierDelta = mul_(supplierTokens, deltaIndex);

        accountState.rewardAccrued = add_(
            accountState.rewardAccrued,
            supplierDelta
        );

        emit RewardAccrued(
            rewardToken,
            supplier,
            supplierDelta,
            accountState.rewardAccrued
        );
    }

    function notifyBorrower(
        address cToken,
        address borrower
    ) external onlyComptroller {
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            notifyBorrowerInternal(rewardTokens[i], cToken, borrower);
        }
    }

    function notifyBorrowerInternal(
        address rewardToken,
        address cToken,
        address borrower
    ) internal {
        Exp memory marketBorrowIndex = Exp({
            mantissa: CTokenInterface(cToken).borrowIndex()
        });

        RewardMarketState storage marketState = rewardMarketState[rewardToken][
            cToken
        ];
        RewardAccountState storage accountState = rewardAccountState[
            rewardToken
        ][borrower];

        uint256 borrowIndex = marketState.borrowIndex;
        uint256 borrowerIndex = accountState.borrowerIndex[cToken];

        // Update borrowers's index to the current index since we are distributing accrued Reward
        accountState.borrowerIndex[cToken] = borrowIndex;

        if (borrowerIndex == 0 && borrowIndex >= rewardInitialIndex) {
            // Covers the case where users borrowed tokens before the market's borrow state index was set.
            // Rewards the user with Reward accrued from the start of when borrower rewards were first
            // set for the market.
            borrowerIndex = rewardInitialIndex;
        }

        // Calculate change in the cumulative sum of the Reward per borrowed unit accrued
        Double memory deltaIndex = Double({
            mantissa: sub_(borrowIndex, borrowerIndex)
        });

        uint256 borrowerAmount = div_(
            CTokenInterface(cToken).borrowBalanceStored(borrower),
            marketBorrowIndex
        );

        // Calculate Reward accrued: cTokenAmount * accruedPerBorrowedUnit
        uint256 borrowerDelta = mul_(borrowerAmount, deltaIndex);

        accountState.rewardAccrued = add_(
            accountState.rewardAccrued,
            borrowerDelta
        );

        emit RewardAccrued(
            rewardToken,
            borrower,
            borrowerDelta,
            accountState.rewardAccrued
        );
    }

    function claim(address[] memory holders) public {
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            claimInternal(rewardTokens[i], holders);
        }
    }

    function claimInternal(
        address rewardToken,
        address[] memory holders
    ) internal {
        for (uint256 j = 0; j < holders.length; j++) {
            RewardAccountState storage accountState = rewardAccountState[
                rewardToken
            ][holders[j]];

            accountState.rewardAccrued = grantRewardInternal(
                rewardToken,
                holders[j],
                accountState.rewardAccrued
            );
        }
    }

    function getBlockNumber() public view returns (uint32) {
        return safe32(block.timestamp, "block number exceeds 32 bits");
    }

    function _grantReward(
        address token,
        address user,
        uint256 amount
    ) public onlyOwner {
        require(
            rewardTokenExists[token],
            "RewardDistributor: grant reward token does not exist"
        );
        grantRewardInternal(token, user, amount);
    }

    /**
     * @notice Transfer Reward to the user
     * @dev Note: If there is not enough Reward, we do not perform the transfer all.
     * @param user The address of the user to transfer Reward to
     * @param amount The amount of Reward to (possibly) transfer
     * @return The amount of Reward which was NOT transferred to the user
     */
    function grantRewardInternal(
        address token,
        address user,
        uint256 amount
    ) internal returns (uint256) {
        uint256 remaining = EIP20Interface(token).balanceOf(address(this));
        if (amount > 0 && amount <= remaining) {
            EIP20Interface(token).transfer(user, amount);

            emit RewardGranted(token, user, amount);

            return 0;
        }
        return amount;
    }

    /** Getters */
    function getRewardTokens() public view returns (address[] memory) {
        return rewardTokens;
    }
}
