// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title DepositETH Token
 * @dev ERC20 token that users receive when depositing ETH
 */
contract DepositETH is ERC20, Ownable, ReentrancyGuard {
    // Events
    event ETHDeposited(address indexed user, uint256 amount);
    event ETHWithdrawn(address indexed user, uint256 amount);
    
    // Constructor
    constructor() ERC20("Deposit ETH Token", "dETH") Ownable(msg.sender) {}
    
    /**
     * @dev Allows users to deposit ETH and receive dETH tokens at 1:1 ratio
     */
    function deposit() external payable nonReentrant {
        require(msg.value > 0, "Must deposit some ETH");
        
        // Mint dETH tokens to the sender at 1:1 ratio
        _mint(msg.sender, msg.value);
        
        emit ETHDeposited(msg.sender, msg.value);
    }
    
    /**
     * @dev Allows users to withdraw ETH by burning dETH tokens
     * @param amount The amount of dETH tokens to burn
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient dETH balance");
        
        // Burn dETH tokens
        _burn(msg.sender, amount);
        
        // Transfer ETH to the user
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "ETH transfer failed");
        
        emit ETHWithdrawn(msg.sender, amount);
    }
    
    /**
     * @dev Returns the ETH balance of the contract
     */
    function getContractETHBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    // Allow the contract to receive ETH
    receive() external payable {}
}
