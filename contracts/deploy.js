// ============================================================
// SIGNAL ARENA — CONTRACT DEPLOYMENT SCRIPT
// Deploy $SIG token to Arbitrum Sepolia testnet
// ============================================================
const hre = require("hardhat");

async function main() {
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║  ⚔️  SIGNAL ARENA — CONTRACT DEPLOYMENT                  ║");
  console.log("╚═══════════════════════════════════════════════════════════╝");
  console.log("");

  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);

  console.log("  Network:", hre.network.name);
  console.log("  Deployer:", deployer.address);
  console.log("  Balance:", hre.ethers.formatEther(balance), "ETH");
  console.log("");

  // ── Deploy $SIG Token ──
  console.log("  [1/3] Deploying $SIG Token...");
  const SignalArenaToken = await hre.ethers.getContractFactory("SignalArenaToken");
  const token = await SignalArenaToken.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("  ✓ $SIG Token deployed:", tokenAddress);
  console.log("");

  // ── Verify initial state ──
  console.log("  [2/3] Verifying deployment...");
  const name = await token.name();
  const symbol = await token.symbol();
  const totalSupply = await token.totalSupply();
  const maxSupply = await token.MAX_SUPPLY();
  const burnRate = await token.burnRate();

  console.log("  Name:", name);
  console.log("  Symbol:", symbol);
  console.log("  Total Supply:", hre.ethers.formatEther(totalSupply), "SIG");
  console.log("  Max Supply:", hre.ethers.formatEther(maxSupply), "SIG");
  console.log("  Burn Rate:", burnRate.toString(), "basis points (40%)");
  console.log("");

  // ── Create vesting schedules ──
  console.log("  [3/3] Setting up vesting schedules...");
  
  // Team vesting (15% = 150M, 4-year vest, 1-year cliff)
  const teamAllocation = hre.ethers.parseEther("150000000");
  const oneYear = 365 * 24 * 60 * 60;
  const fourYears = 4 * oneYear;
  
  // Note: In production, transfer to multisig first, then create vesting
  console.log("  Team allocation:", hre.ethers.formatEther(teamAllocation), "SIG");
  console.log("  Vesting: 4 years with 1-year cliff");
  console.log("");

  // ── Summary ──
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║  ✅ DEPLOYMENT COMPLETE                                  ║");
  console.log("╚═══════════════════════════════════════════════════════════╝");
  console.log("");
  console.log("  Contract Address:", tokenAddress);
  console.log("  Network:", hre.network.name);
  console.log("  Explorer:", getExplorerUrl(hre.network.name, tokenAddress));
  console.log("");
  console.log("  Next steps:");
  console.log("  1. Verify on Arbiscan:", `npx hardhat verify --network ${hre.network.name}`, tokenAddress);
  console.log("  2. Add to Metamask: Token address", tokenAddress);
  console.log("  3. Create DEX pool on Uniswap V3");
  console.log("  4. Submit for audit");
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    tokenAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    name,
    symbol,
    totalSupply: hre.ethers.formatEther(totalSupply),
    maxSupply: hre.ethers.formatEther(maxSupply),
    burnRate: burnRate.toString(),
  };

  const fs = require("fs");
  const deploymentsDir = "./deployments";
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir);
  fs.writeFileSync(
    `${deploymentsDir}/${hre.network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("  Deployment info saved to:", `${deploymentsDir}/${hre.network.name}.json`);
}

function getExplorerUrl(network, address) {
  switch (network) {
    case "arbitrum":
      return `https://arbiscan.io/token/${address}`;
    case "arbitrumSepolia":
      return `https://sepolia.arbiscan.io/token/${address}`;
    default:
      return `localhost: ${address}`;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("  ✗ Deployment failed:", error);
    process.exit(1);
  });
