// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./dETH.sol";

/**
 * @title StakedETH Token
 * @dev ERC20 token that users receive when staking dETH
 */
contract StakedETH is ERC20, Ownable, ReentrancyGuard {
    // State variables
    DepositETH public dETHToken;
    uint256 public totalStaked;
    uint256 public totalStakers;
    
    // Staking info for each user
    struct StakeInfo {
        uint256 amount;
        uint256 timestamp;
        uint256 rank; // Current rank in the leaderboard (updated periodically)
    }
    
    // Array to keep track of all staker addresses for leaderboard
    address[] public stakerAddresses;
    
    // Mapping to check if an address is already in the stakerAddresses array
    mapping(address => bool) public isStaker;
    
    // Mapping from address to staking info
    mapping(address => StakeInfo) public userStakes;
    
    // Events
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event LeaderboardUpdated(uint256 timestamp);
    
    // Constructor - Perbaikan: menggunakan address payable
    constructor(address payable _dETHToken) ERC20("Staked ETH Token", "sETH") Ownable(msg.sender) {
        dETHToken = DepositETH(_dETHToken);
    }
    
    /**
     * @dev Allows users to stake dETH and receive sETH tokens
     * @param amount The amount of dETH to stake
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Must stake some dETH");
        require(dETHToken.balanceOf(msg.sender) >= amount, "Insufficient dETH balance");
        
        // Transfer dETH from user to this contract
        require(dETHToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Check if this is a new staker
        if (!isStaker[msg.sender]) {
            stakerAddresses.push(msg.sender);
            isStaker[msg.sender] = true;
            totalStakers++;
        }
        
        // Update user's stake info
        userStakes[msg.sender].amount += amount;
        userStakes[msg.sender].timestamp = block.timestamp;
        
        // Mint sETH tokens to the user at 1:1 ratio
        _mint(msg.sender, amount);
        
        // Update total staked amount
        totalStaked += amount;
        
        emit Staked(msg.sender, amount);
    }
    
    /**
     * @dev Allows users to unstake sETH and receive dETH back
     * @param amount The amount of sETH to unstake
     */
    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient sETH balance");
        require(userStakes[msg.sender].amount >= amount, "Insufficient staked amount");
        
        // Burn sETH tokens
        _burn(msg.sender, amount);
        
        // Update user's stake info
        userStakes[msg.sender].amount -= amount;
        
        // If user has unstaked everything, remove them from stakers list
        if (userStakes[msg.sender].amount == 0) {
            removeStaker(msg.sender);
        }
        
        // Transfer dETH back to the user
        require(dETHToken.transfer(msg.sender, amount), "Transfer failed");
        
        // Update total staked amount
        totalStaked -= amount;
        
        emit Unstaked(msg.sender, amount);
    }
    
    /**
     * @dev Removes a staker from the stakerAddresses array
     * @param staker The address of the staker to remove
     */
    function removeStaker(address staker) internal {
        if (isStaker[staker]) {
            // Find the index of the staker in the array
            uint256 index = 0;
            bool found = false;
            
            for (uint256 i = 0; i < stakerAddresses.length; i++) {
                if (stakerAddresses[i] == staker) {
                    index = i;
                    found = true;
                    break;
                }
            }
            
            // If found, remove the staker
            if (found) {
                // Move the last element to the position of the element to delete
                if (index < stakerAddresses.length - 1) {
                    stakerAddresses[index] = stakerAddresses[stakerAddresses.length - 1];
                }
                
                // Remove the last element
                stakerAddresses.pop();
                isStaker[staker] = false;
                totalStakers--;
            }
        }
    }
    
    /**
     * @dev Returns the staking info for a user
     * @param user The address of the user
     */
    function getStakeInfo(address user) external view returns (uint256 amount, uint256 timestamp, uint256 rank) {
        StakeInfo memory info = userStakes[user];
        return (info.amount, info.timestamp, info.rank);
    }
    
    /**
     * @dev Returns the total number of stakers
     */
    function getTotalStakers() external view returns (uint256) {
        return totalStakers;
    }
    
    /**
     * @dev Returns a list of all staker addresses
     */
    function getAllStakers() external view returns (address[] memory) {
        return stakerAddresses;
    }
    
    /**
     * @dev Returns the top N stakers by amount staked
     * @param count The number of top stakers to return
     */
    function getTopStakers(uint256 count) external view returns (address[] memory, uint256[] memory) {
        // Ensure we don't try to return more stakers than exist
        uint256 resultCount = count > totalStakers ? totalStakers : count;
        
        // Create arrays to store the results
        address[] memory topStakerAddresses = new address[](resultCount);
        uint256[] memory topStakerAmounts = new uint256[](resultCount);
        
        // If there are no stakers, return empty arrays
        if (resultCount == 0) {
            return (topStakerAddresses, topStakerAmounts);
        }
        
        // Create a memory array of all stakers and their amounts
        address[] memory allStakers = new address[](stakerAddresses.length);
        uint256[] memory allAmounts = new uint256[](stakerAddresses.length);
        
        for (uint256 i = 0; i < stakerAddresses.length; i++) {
            allStakers[i] = stakerAddresses[i];
            allAmounts[i] = userStakes[stakerAddresses[i]].amount;
        }
        
        // Sort the stakers by amount (simple bubble sort for on-chain sorting)
        for (uint256 i = 0; i < allStakers.length; i++) {
            for (uint256 j = i + 1; j < allStakers.length; j++) {
                if (allAmounts[i] < allAmounts[j]) {
                    // Swap amounts
                    uint256 tempAmount = allAmounts[i];
                    allAmounts[i] = allAmounts[j];
                    allAmounts[j] = tempAmount;
                    
                    // Swap addresses
                    address tempAddr = allStakers[i];
                    allStakers[i] = allStakers[j];
                    allStakers[j] = tempAddr;
                }
            }
        }
        
        // Take the top N results
        for (uint256 i = 0; i < resultCount; i++) {
            topStakerAddresses[i] = allStakers[i];
            topStakerAmounts[i] = allAmounts[i];
        }
        
        return (topStakerAddresses, topStakerAmounts);
    }
    
    /**
     * @dev Updates the ranks of all stakers in the leaderboard
     * This function can be called periodically to update the ranks
     * Note: This is a gas-intensive operation and should be used carefully
     */
    function updateLeaderboard() external onlyOwner {
        // Get all stakers and their amounts
        address[] memory allStakers = new address[](stakerAddresses.length);
        uint256[] memory allAmounts = new uint256[](stakerAddresses.length);
        
        for (uint256 i = 0; i < stakerAddresses.length; i++) {
            allStakers[i] = stakerAddresses[i];
            allAmounts[i] = userStakes[stakerAddresses[i]].amount;
        }
        
        // Sort the stakers by amount (simple bubble sort)
        for (uint256 i = 0; i < allStakers.length; i++) {
            for (uint256 j = i + 1; j < allStakers.length; j++) {
                if (allAmounts[i] < allAmounts[j]) {
                    // Swap amounts
                    uint256 tempAmount = allAmounts[i];
                    allAmounts[i] = allAmounts[j];
                    allAmounts[j] = tempAmount;
                    
                    // Swap addresses
                    address tempAddr = allStakers[i];
                    allStakers[i] = allStakers[j];
                    allStakers[j] = tempAddr;
                }
            }
        }
        
        // Update the ranks
        for (uint256 i = 0; i < allStakers.length; i++) {
            userStakes[allStakers[i]].rank = i + 1; // Ranks start at 1
        }
        
        emit LeaderboardUpdated(block.timestamp);
    }
    
    /**
     * @dev Returns staking statistics
     */
    function getStakingStats() external view returns (
        uint256 _totalStaked,
        uint256 _totalStakers,
        uint256 _averageStake
    ) {
        _totalStaked = totalStaked;
        _totalStakers = totalStakers;
        _averageStake = totalStakers > 0 ? totalStaked / totalStakers : 0;
        
        return (_totalStaked, _totalStakers, _averageStake);
    }
    
    /**
     * @dev Returns paginated stakers for UI display
     * @param offset Starting index
     * @param limit Maximum number of stakers to return
     */
    function getPaginatedStakers(uint256 offset, uint256 limit) external view returns (
        address[] memory _stakers,
        uint256[] memory _amounts,
        uint256[] memory _timestamps,
        uint256[] memory _ranks
    ) {
        // Ensure we don't try to return more stakers than exist
        uint256 remaining = stakerAddresses.length > offset ? stakerAddresses.length - offset : 0;
        uint256 resultCount = limit > remaining ? remaining : limit;
        
        // Create arrays to store the results
        _stakers = new address[](resultCount);
        _amounts = new uint256[](resultCount);
        _timestamps = new uint256[](resultCount);
        _ranks = new uint256[](resultCount);
        
        // Fill the arrays with data
        for (uint256 i = 0; i < resultCount; i++) {
            address stakerAddr = stakerAddresses[offset + i];
            _stakers[i] = stakerAddr;
            _amounts[i] = userStakes[stakerAddr].amount;
            _timestamps[i] = userStakes[stakerAddr].timestamp;
            _ranks[i] = userStakes[stakerAddr].rank;
        }
        
        return (_stakers, _amounts, _timestamps, _ranks);
    }
}
