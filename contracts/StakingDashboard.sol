// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./sETH.sol";
import "./dETH.sol";

/**
 * @title StakingDashboard
 * @dev Contract for viewing staking statistics and leaderboard
 */
contract StakingDashboard {
    // State variables
    StakedETH public sETHToken;
    DepositETH public dETHToken;
    
    // Constructor - Perbaikan: menggunakan address payable untuk dETHToken
    constructor(address payable _sETHToken, address payable _dETHToken) {
        sETHToken = StakedETH(_sETHToken);
        dETHToken = DepositETH(_dETHToken);
    }
    
    /**
     * @dev Returns comprehensive staking statistics
     */
    function getStakingOverview() external view returns (
        uint256 totalETHDeposited,
        uint256 totalETHStaked,
        uint256 totalStakers,
        uint256 averageStakeAmount
    ) {
        // Get total ETH deposited (total supply of dETH)
        totalETHDeposited = dETHToken.totalSupply();
        
        // Get staking stats
        (totalETHStaked, totalStakers, averageStakeAmount) = sETHToken.getStakingStats();
        
        return (totalETHDeposited, totalETHStaked, totalStakers, averageStakeAmount);
    }
    
    /**
     * @dev Returns the top stakers for the leaderboard
     * @param count Number of top stakers to return
     */
    function getLeaderboard(uint256 count) external view returns (
        address[] memory stakerAddresses,
        uint256[] memory stakedAmounts,
        uint256[] memory percentageOfTotal
    ) {
        // Get top stakers
        (stakerAddresses, stakedAmounts) = sETHToken.getTopStakers(count);
        
        // Calculate percentage of total for each staker
        percentageOfTotal = new uint256[](stakerAddresses.length);
        uint256 totalStaked = sETHToken.totalStaked();
        
        if (totalStaked > 0) {
            for (uint256 i = 0; i < stakerAddresses.length; i++) {
                // Calculate percentage with 2 decimal precision (e.g., 12.34% = 1234)
                percentageOfTotal[i] = (stakedAmounts[i] * 10000) / totalStaked;
            }
        }
        
        return (stakerAddresses, stakedAmounts, percentageOfTotal);
    }
    
    /**
     * @dev Returns detailed information about a specific staker
     * @param staker Address of the staker
     */
    function getStakerDetails(address staker) external view returns (
        uint256 stakedAmount,
        uint256 stakingTimestamp,
        uint256 rank,
        uint256 percentageOfTotal
    ) {
        // Get stake info
        (stakedAmount, stakingTimestamp, rank) = sETHToken.getStakeInfo(staker);
        
        // Calculate percentage of total
        uint256 totalStaked = sETHToken.totalStaked();
        if (totalStaked > 0) {
            // Calculate percentage with 2 decimal precision (e.g., 12.34% = 1234)
            percentageOfTotal = (stakedAmount * 10000) / totalStaked;
        } else {
            percentageOfTotal = 0;
        }
        
        return (stakedAmount, stakingTimestamp, rank, percentageOfTotal);
    }
    
    /**
     * @dev Returns staking activity statistics
     * @param daysAgo Number of days to look back for activity
     */
    function getStakingActivity(uint256 daysAgo) external view returns (
        uint256 activeStakers,
        address[] memory recentStakers
    ) {
        // Calculate the timestamp for daysAgo
        uint256 timestamp = block.timestamp - (daysAgo * 1 days);
        
        // Get all stakers
        address[] memory allStakers = sETHToken.getAllStakers();
        
        // Count active stakers and collect recent stakers
        uint256 count = 0;
        for (uint256 i = 0; i < allStakers.length; i++) {
            (,uint256 stakingTime,) = sETHToken.getStakeInfo(allStakers[i]);
            if (stakingTime >= timestamp) {
                count++;
            }
        }
        
        // Create array for recent stakers
        recentStakers = new address[](count);
        
        // Fill the array with recent stakers
        uint256 index = 0;
        for (uint256 i = 0; i < allStakers.length; i++) {
            (,uint256 stakingTime,) = sETHToken.getStakeInfo(allStakers[i]);
            if (stakingTime >= timestamp) {
                recentStakers[index] = allStakers[i];
                index++;
            }
        }
        
        activeStakers = count;
        
        return (activeStakers, recentStakers);
    }
    
    /**
     * @dev Returns paginated stakers with detailed information
     * @param offset Starting index
     * @param limit Maximum number of stakers to return
     */
    function getPaginatedStakersDetailed(uint256 offset, uint256 limit) external view returns (
        address[] memory stakers,
        uint256[] memory amounts,
        uint256[] memory timestamps,
        uint256[] memory ranks,
        uint256[] memory percentages
    ) {
        // Get paginated stakers
        (stakers, amounts, timestamps, ranks) = sETHToken.getPaginatedStakers(offset, limit);
        
        // Calculate percentages
        percentages = new uint256[](stakers.length);
        uint256 totalStaked = sETHToken.totalStaked();
        
        if (totalStaked > 0) {
            for (uint256 i = 0; i < stakers.length; i++) {
                // Calculate percentage with 2 decimal precision (e.g., 12.34% = 1234)
                percentages[i] = (amounts[i] * 10000) / totalStaked;
            }
        }
        
        return (stakers, amounts, timestamps, ranks, percentages);
    }
}
