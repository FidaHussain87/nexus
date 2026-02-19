# SHURIUM Testnet Guide

This guide explains how to connect to and use the SHURIUM testnet for development and testing.

## Overview

The SHURIUM testnet is a separate blockchain network for testing:
- **Free test coins** - No real value, get them from the faucet
- **Faster blocks** - Same 30-second target as mainnet
- **Faster halvings** - 1 week instead of 4 years (for testing economics)
- **Lower thresholds** - Easier UBI requirements for testing

## Network Parameters

| Parameter | Testnet Value | Mainnet Value |
|-----------|---------------|---------------|
| P2P Port | 18333 | 8333 |
| RPC Port | 18332 | 8332 |
| Block Time | 30 seconds | 30 seconds |
| Halving Interval | 20,160 blocks (~1 week) | 4,207,680 blocks (~4 years) |
| Min Difficulty Blocks | Yes | No |
| Address Prefix | `tshr1` | `shr1` |
| UBI Min Identities | 10 | 1,000 |

## Getting Started

### 1. Build SHURIUM

```bash
git clone https://github.com/FidaHussain87/shurium.git
cd shurium
mkdir build && cd build
cmake ..
cmake --build . -j$(nproc)
```

### 2. Start Testnet Node

```bash
# Start testnet daemon
./shuriumd --testnet --daemon

# Wait for startup
sleep 3

# Verify connection
./shurium-cli --testnet getblockchaininfo
```

### 3. Create a Wallet

```bash
# Generate a new address
./shurium-cli --testnet getnewaddress

# Output: tshr1q... (testnet address)
```

### 4. Get Test Coins from Faucet

```bash
# Request 100 SHR from faucet
./shurium-cli --testnet getfaucet <your_address> 100

# Example:
./shurium-cli --testnet getfaucet tshr1qxyz... 100
```

**Faucet Limits:**
- Default: 100 SHR per request
- Maximum: 1,000 SHR per request
- No rate limiting (testnet only)

### 5. Check Balance

```bash
./shurium-cli --testnet getbalance
```

## DNS Seeds

Testnet nodes automatically connect to these DNS seeds:
- `testnet-seed.shurium.io`
- `testnet-seed2.shurium.io`
- `testnet.seed.shurium.community`

## Manual Node Connection

If DNS seeds aren't working, connect manually:

```bash
# Add a known testnet node
./shurium-cli --testnet addnode "testnet-node.example.com:18333" "add"

# Check connections
./shurium-cli --testnet getpeerinfo
```

## Configuration File

Create `~/.shurium/shurium.conf` for custom settings:

```ini
# Testnet configuration
testnet=1

# RPC settings
rpcuser=testuser
rpcpassword=testpassword

# Allow external RPC connections (for development)
rpcallowip=127.0.0.1
rpcbind=127.0.0.1

# Logging
debug=1

# Network
maxconnections=50
```

## Data Directory

Testnet data is stored separately from mainnet:

```
~/.shurium/testnet/
├── blocks/           # Block data
├── chainstate/       # UTXO database
├── wallet.dat        # Wallet keys
├── wallet_data.dat   # Wallet transactions
├── peers.dat         # Known peers
└── debug.log         # Debug log
```

## Testing Features

### Test UBI System

```bash
# Register identity (testnet has lower requirements)
./shurium-cli --testnet registeridentity <proof>

# Check UBI status
./shurium-cli --testnet getubiinfo

# Claim UBI
./shurium-cli --testnet claimubi
```

### Test Governance

```bash
# Create a proposal
./shurium-cli --testnet createproposal "Test Proposal" "Description" 100

# Vote on a proposal
./shurium-cli --testnet vote <proposal_id> true
```

### Test Compute Marketplace

```bash
# Create a problem
./shurium-cli --testnet createproblem "optimization" "Test problem" 10.0 3600

# Get available work
./shurium-cli --testnet getwork

# Submit a solution
./shurium-cli --testnet submitwork <problem_id> <solution_hex>
```

### Test Staking

```bash
# Stake coins
./shurium-cli --testnet stake 1000

# Check staking status
./shurium-cli --testnet getstakinginfo
```

## Troubleshooting

### Node Won't Start

```bash
# Check if already running
pgrep -f shuriumd

# Check logs
tail -50 ~/.shurium/testnet/debug.log
```

### Not Connecting to Peers

```bash
# Check network status
./shurium-cli --testnet getnetworkinfo

# Manually add a peer
./shurium-cli --testnet addnode "testnet-seed.shurium.io:18333" "onetry"
```

### Faucet Says Insufficient Balance

The testnet faucet wallet needs to be funded by mining:

```bash
# If you're running a testnet seed node
./shurium-cli --testnet generatetoaddress 101 <faucet_address>
```

### Clear Testnet Data

To reset your testnet node:

```bash
# Stop daemon
./shurium-cli --testnet stop

# Remove testnet data (keeps config)
rm -rf ~/.shurium/testnet/blocks ~/.shurium/testnet/chainstate

# Restart
./shuriumd --testnet --daemon
```

## Running a Testnet Seed Node

To help the testnet, run a public seed node:

1. **Open firewall** for port 18333
2. **Configure** with `listen=1` in config
3. **Register** your node's IP/hostname with the community

## API Differences

All RPC commands work the same on testnet. Just add `--testnet` flag:

```bash
# Mainnet
./shurium-cli getblockcount

# Testnet
./shurium-cli --testnet getblockcount
```

## Getting Help

- GitHub Issues: https://github.com/FidaHussain87/shurium/issues
- Documentation: https://shurium.io/docs
- Community: https://discord.gg/shurium

## See Also

- [Quick Start Guide](QUICK_START.md)
- [Commands Reference](COMMANDS.md)
- [Wallet Guide](WALLET_GUIDE.md)
- [Mining Guide](MINING_GUIDE.md)
