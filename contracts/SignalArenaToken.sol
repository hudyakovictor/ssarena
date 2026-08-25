// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title SignalArenaToken ($SIG)
 * @notice ERC-20 utility token for Signal Arena: Proof of Skill
 * @dev Deflationary token with 40% burn rate on all spending
 * 
 * Tokenomics:
 * - Total Supply: 1,000,000,000 SIG
 * - Burn Rate: 40% of all tokens spent
 * - Halving: Emission halves every year
 * - Net Deflationary: By Year 2
 * 
 * Use Cases:
 * - Tournament entry fees
 * - Marketplace purchases (cosmetics, cards, avatars)
 * - Staking for premium features
 * - Governance voting
 * - Season Pass purchases
 */
contract SignalArenaToken is ERC20, ERC20Burnable, ERC20Permit, AccessControl, ReentrancyGuard, Pausable {
    
    // ── ROLES ──
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    // ── TOKENOMICS ──
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 1e18; // 1 billion
    uint256 public constant BURN_RATE = 4000; // 40% (basis points, 10000 = 100%)
    uint256 public constant BURN_RATE_DENOMINATOR = 10000;
    
    // ── EMISSION ──
    uint256 public constant INITIAL_EMISSION = 95_000_000 * 1e18; // 95M Year 1
    uint256 public constant HALVING_INTERVAL = 365 days;
    uint256 public deploymentTime;
    
    // ── SUPPLY TRACKING ──
    uint256 public totalMinted;
    uint256 public totalBurned;
    
    // ── VESTING ──
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 startTime;
        uint256 cliffDuration;
        uint256 vestingDuration;
        uint256 released;
        bool active;
    }
    
    mapping(address => VestingSchedule) public vestingSchedules;
    
    // ── STAKING ──
    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 lockDuration;
        uint256 rewardRate; // basis points per year
    }
    
    mapping(address => StakeInfo) public stakes;
    uint256 public totalStaked;
    
    // ── EVENTS ──
    event TokensMinted(address indexed to, uint256 amount, string reason);
    event TokensBurned(address indexed from, uint256 amount);
    event VestingCreated(address indexed beneficiary, uint256 amount, uint256 cliff, uint256 duration);
    event VestingReleased(address indexed beneficiary, uint256 amount);
    event Staked(address indexed user, uint256 amount, uint256 lockDuration);
    event Unstaked(address indexed user, uint256 amount, uint256 reward);
    event RewardClaimed(address indexed user, uint256 amount);
    
    // ── CONSTRUCTOR ──
    constructor() 
        ERC20("Signal Arena Token", "SIG") 
        ERC20Permit("Signal Arena Token") 
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(TREASURY_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        
        deploymentTime = block.timestamp;
        
        // Initial distribution: 145M to deployer (for initial liquidity + airdrops)
        _mint(msg.sender, 145_000_000 * 1e18);
        totalMinted = 145_000_000 * 1e18;
    }
    
    // ── BURN ON SPEND (core mechanic) ──
    /**
     * @notice Spend tokens with automatic 40% burn
     * @dev Called by game contracts when player buys something
     * @param from Player address
     * @param to Treasury/receiver address  
     * @param amount Total amount to spend
     */
    function spendWithBurn(address from, address to, uint256 amount) external onlyRole(TREASURY_ROLE) nonReentrant {
        uint256 burnAmount = (amount * BURN_RATE) / BURN_RATE_DENOMINATOR;
        uint256 receiverAmount = amount - burnAmount;
        
        _transfer(from, to, receiverAmount);
        _burn(from, burnAmount);
        
        totalBurned += burnAmount;
        
        emit TokensBurned(from, burnAmount);
    }
    
    // ── EMISSION (controlled minting) ──
    /**
     * @notice Mint tokens according to emission schedule
     * @dev Emission halves every year. Only MINTER can call.
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function controlledMint(address to, uint256 amount) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(totalMinted + amount <= MAX_SUPPLY, "Exceeds max supply");
        
        // Calculate current emission cap
        uint256 yearsElapsed = (block.timestamp - deploymentTime) / HALVING_INTERVAL;
        uint256 currentEmissionCap = INITIAL_EMISSION;
        for (uint256 i = 0; i < yearsElapsed && currentEmissionCap > 1e18; i++) {
            currentEmissionCap = currentEmissionCap / 2;
        }
        
        require(amount <= currentEmissionCap, "Exceeds emission cap");
        
        _mint(to, amount);
        totalMinted += amount;
        
        emit TokensMinted(to, amount, "emission");
    }
    
    // ── VESTING ──
    /**
     * @notice Create vesting schedule for team/investors
     */
    function createVesting(
        address beneficiary,
        uint256 amount,
        uint256 cliffDuration,
        uint256 vestingDuration
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(vestingSchedules[beneficiary].totalAmount == 0, "Vesting exists");
        require(amount <= balanceOf(address(this)), "Insufficient balance");
        
        vestingSchedules[beneficiary] = VestingSchedule({
            totalAmount: amount,
            startTime: block.timestamp,
            cliffDuration: cliffDuration,
            vestingDuration: vestingDuration,
            released: 0,
            active: true
        });
        
        emit VestingCreated(beneficiary, amount, cliffDuration, vestingDuration);
    }
    
    /**
     * @notice Release vested tokens
     */
    function releaseVestedTokens() external nonReentrant {
        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        require(schedule.active, "No vesting schedule");
        require(block.timestamp >= schedule.startTime + schedule.cliffDuration, "Cliff not reached");
        
        uint256 vestedAmount;
        if (block.timestamp >= schedule.startTime + schedule.vestingDuration) {
            vestedAmount = schedule.totalAmount;
        } else {
            vestedAmount = (schedule.totalAmount * (block.timestamp - schedule.startTime)) / schedule.vestingDuration;
        }
        
        uint256 releasable = vestedAmount - schedule.released;
        require(releasable > 0, "Nothing to release");
        
        schedule.released += releasable;
        _transfer(address(this), msg.sender, releasable);
        
        emit VestingReleased(msg.sender, releasable);
    }
    
    // ── STAKING ──
    /**
     * @notice Stake tokens for premium features
     * @param amount Amount to stake
     * @param lockDuration Lock period in seconds (30/90/180/365 days)
     */
    function stake(uint256 amount, uint256 lockDuration) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        require(
            lockDuration == 30 days || lockDuration == 90 days || 
            lockDuration == 180 days || lockDuration == 365 days,
            "Invalid lock duration"
        );
        
        // Calculate reward rate based on lock duration
        uint256 rewardRate;
        if (lockDuration == 30 days) rewardRate = 500; // 5% APY
        else if (lockDuration == 90 days) rewardRate = 800; // 8% APY
        else if (lockDuration == 180 days) rewardRate = 1200; // 12% APY
        else rewardRate = 2000; // 20% APY
        
        // If already staked, compound
        if (stakes[msg.sender].amount > 0) {
            uint256 reward = calculateReward(msg.sender);
            stakes[msg.sender].amount += reward + amount;
            stakes[msg.sender].startTime = block.timestamp;
            stakes[msg.sender].lockDuration = lockDuration;
            stakes[msg.sender].rewardRate = rewardRate;
        } else {
            stakes[msg.sender] = StakeInfo({
                amount: amount,
                startTime: block.timestamp,
                lockDuration: lockDuration,
                rewardRate: rewardRate
            });
        }
        
        totalStaked += amount;
        _transfer(msg.sender, address(this), amount);
        
        emit Staked(msg.sender, amount, lockDuration);
    }
    
    /**
     * @notice Unstake tokens (after lock period)
     */
    function unstake() external nonReentrant {
        StakeInfo storage stakeInfo = stakes[msg.sender];
        require(stakeInfo.amount > 0, "No stake");
        require(block.timestamp >= stakeInfo.startTime + stakeInfo.lockDuration, "Lock period active");
        
        uint256 reward = calculateReward(msg.sender);
        uint256 total = stakeInfo.amount + reward;
        
        totalStaked -= stakeInfo.amount;
        delete stakes[msg.sender];
        
        _mint(msg.sender, reward); // Mint rewards
        _transfer(address(this), msg.sender, stakeInfo.amount);
        
        emit Unstaked(msg.sender, stakeInfo.amount, reward);
    }
    
    /**
     * @notice Calculate staking reward
     */
    function calculateReward(address user) public view returns (uint256) {
        StakeInfo storage stakeInfo = stakes[user];
        if (stakeInfo.amount == 0) return 0;
        
        uint256 duration = block.timestamp - stakeInfo.startTime;
        if (duration > stakeInfo.lockDuration) duration = stakeInfo.lockDuration;
        
        return (stakeInfo.amount * stakeInfo.rewardRate * duration) / (365 days * BURN_RATE_DENOMINATOR);
    }
    
    // ── VIEW FUNCTIONS ──
    function circulatingSupply() external view returns (uint256) {
        return totalSupply() - totalBurned;
    }
    
    function burnRate() external pure returns (uint256) {
        return BURN_RATE;
    }
    
    function currentEmissionCap() external view returns (uint256) {
        uint256 yearsElapsed = (block.timestamp - deploymentTime) / HALVING_INTERVAL;
        uint256 cap = INITIAL_EMISSION;
        for (uint256 i = 0; i < yearsElapsed && cap > 1e18; i++) {
            cap = cap / 2;
        }
        return cap;
    }
    
    function timeUntilNextHalving() external view returns (uint256) {
        uint256 yearsElapsed = (block.timestamp - deploymentTime) / HALVING_INTERVAL;
        uint256 nextHalving = deploymentTime + (yearsElapsed + 1) * HALVING_INTERVAL;
        return nextHalving - block.timestamp;
    }
    
    // ── PAUSE ──
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    // ── EMERGENCY ──
    function emergencyWithdraw(address token, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        IERC20(token).transfer(msg.sender, amount);
    }
}
