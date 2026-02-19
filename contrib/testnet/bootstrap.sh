#!/bin/bash
# SHURIUM Testnet Bootstrap Script
# This script helps you quickly set up and connect to the SHURIUM testnet.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "=============================================="
echo "       SHURIUM Testnet Bootstrap Script"
echo "=============================================="
echo -e "${NC}"

# Find the build directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="${SCRIPT_DIR}/../../build"

if [[ ! -d "$BUILD_DIR" ]]; then
    echo -e "${YELLOW}Build directory not found. Looking for binaries...${NC}"
    if command -v shuriumd &> /dev/null; then
        SHURIUMD="shuriumd"
        SHURIUM_CLI="shurium-cli"
    else
        echo -e "${RED}Error: Cannot find SHURIUM binaries.${NC}"
        echo "Please build SHURIUM first:"
        echo "  mkdir build && cd build && cmake .. && cmake --build . -j\$(nproc)"
        exit 1
    fi
else
    SHURIUMD="${BUILD_DIR}/shuriumd"
    SHURIUM_CLI="${BUILD_DIR}/shurium-cli"
fi

# Check if binaries exist
if [[ ! -f "$SHURIUMD" ]]; then
    echo -e "${RED}Error: shuriumd not found at $SHURIUMD${NC}"
    exit 1
fi

# Configuration
TESTNET_DATA_DIR="${HOME}/.shurium/testnet"
TESTNET_PORT=18333
TESTNET_RPC_PORT=18332

# Function to check if daemon is running
check_daemon() {
    if pgrep -f "shuriumd.*testnet" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to wait for RPC
wait_for_rpc() {
    echo -n "Waiting for RPC to become available"
    for i in {1..30}; do
        if $SHURIUM_CLI --testnet --rpcport=$TESTNET_RPC_PORT getblockcount > /dev/null 2>&1; then
            echo -e " ${GREEN}OK${NC}"
            return 0
        fi
        echo -n "."
        sleep 1
    done
    echo -e " ${RED}FAILED${NC}"
    return 1
}

# Main menu
echo "What would you like to do?"
echo ""
echo "  1) Start testnet node"
echo "  2) Stop testnet node"
echo "  3) Get testnet coins from faucet"
echo "  4) Check testnet status"
echo "  5) View testnet logs"
echo "  6) Reset testnet data"
echo "  7) Exit"
echo ""
read -p "Enter choice [1-7]: " choice

case $choice in
    1)
        echo ""
        if check_daemon; then
            echo -e "${YELLOW}Testnet daemon is already running.${NC}"
        else
            echo -e "${BLUE}Starting SHURIUM testnet node...${NC}"
            $SHURIUMD --testnet --daemon
            
            if wait_for_rpc; then
                echo -e "${GREEN}Testnet node started successfully!${NC}"
                echo ""
                
                # Show status
                BLOCK_COUNT=$($SHURIUM_CLI --testnet --rpcport=$TESTNET_RPC_PORT getblockcount 2>/dev/null || echo "0")
                PEER_COUNT=$($SHURIUM_CLI --testnet --rpcport=$TESTNET_RPC_PORT getconnectioncount 2>/dev/null || echo "0")
                
                echo "Status:"
                echo "  Block height: $BLOCK_COUNT"
                echo "  Peers: $PEER_COUNT"
                echo ""
                echo "To get test coins, run this script again and choose option 3."
            else
                echo -e "${RED}Failed to start testnet node. Check logs:${NC}"
                echo "  tail -50 $TESTNET_DATA_DIR/debug.log"
            fi
        fi
        ;;
        
    2)
        echo ""
        if check_daemon; then
            echo -e "${BLUE}Stopping testnet node...${NC}"
            $SHURIUM_CLI --testnet --rpcport=$TESTNET_RPC_PORT stop 2>/dev/null || true
            sleep 2
            
            if check_daemon; then
                echo -e "${YELLOW}Force stopping...${NC}"
                pkill -f "shuriumd.*testnet" 2>/dev/null || true
            fi
            
            echo -e "${GREEN}Testnet node stopped.${NC}"
        else
            echo -e "${YELLOW}Testnet node is not running.${NC}"
        fi
        ;;
        
    3)
        echo ""
        if ! check_daemon; then
            echo -e "${RED}Error: Testnet node is not running.${NC}"
            echo "Please start the node first (option 1)."
            exit 1
        fi
        
        # Get or create address
        echo "Enter your testnet address (or press Enter to generate a new one):"
        read -p "Address: " ADDRESS
        
        if [[ -z "$ADDRESS" ]]; then
            ADDRESS=$($SHURIUM_CLI --testnet --rpcport=$TESTNET_RPC_PORT getnewaddress 2>/dev/null)
            echo -e "Generated new address: ${GREEN}$ADDRESS${NC}"
        fi
        
        # Get amount
        read -p "Amount of SHR to request [100]: " AMOUNT
        AMOUNT=${AMOUNT:-100}
        
        echo ""
        echo -e "${BLUE}Requesting $AMOUNT SHR from faucet...${NC}"
        
        RESULT=$($SHURIUM_CLI --testnet --rpcport=$TESTNET_RPC_PORT getfaucet "$ADDRESS" "$AMOUNT" 2>&1)
        
        if echo "$RESULT" | grep -q '"success": true'; then
            echo -e "${GREEN}Success!${NC}"
            echo "$RESULT" | grep -E "txid|amount|fee" | sed 's/^/  /'
            echo ""
            echo "Your test coins will be available after the next block."
        else
            echo -e "${RED}Faucet request failed:${NC}"
            echo "$RESULT"
            echo ""
            echo "If the faucet wallet is empty, you may need to mine some blocks first."
        fi
        ;;
        
    4)
        echo ""
        if ! check_daemon; then
            echo -e "${RED}Testnet node is not running.${NC}"
            exit 1
        fi
        
        echo -e "${BLUE}Testnet Status:${NC}"
        echo "=============="
        
        # Get various info
        BLOCK_COUNT=$($SHURIUM_CLI --testnet --rpcport=$TESTNET_RPC_PORT getblockcount 2>/dev/null || echo "N/A")
        PEER_COUNT=$($SHURIUM_CLI --testnet --rpcport=$TESTNET_RPC_PORT getconnectioncount 2>/dev/null || echo "N/A")
        BALANCE=$($SHURIUM_CLI --testnet --rpcport=$TESTNET_RPC_PORT getbalance 2>/dev/null || echo "N/A")
        
        echo "  Block Height:  $BLOCK_COUNT"
        echo "  Connections:   $PEER_COUNT"
        echo "  Wallet Balance: $BALANCE SHR"
        echo ""
        
        # Get blockchain info
        echo "Blockchain Info:"
        $SHURIUM_CLI --testnet --rpcport=$TESTNET_RPC_PORT getblockchaininfo 2>/dev/null | grep -E "chain|blocks|difficulty|progress" | sed 's/^/  /'
        ;;
        
    5)
        echo ""
        LOG_FILE="$TESTNET_DATA_DIR/debug.log"
        if [[ -f "$LOG_FILE" ]]; then
            echo -e "${BLUE}Last 50 lines of testnet log:${NC}"
            echo ""
            tail -50 "$LOG_FILE"
        else
            echo -e "${YELLOW}No log file found at $LOG_FILE${NC}"
        fi
        ;;
        
    6)
        echo ""
        echo -e "${RED}WARNING: This will delete all testnet blockchain data!${NC}"
        echo "Your wallet will be preserved but you'll need to resync."
        read -p "Are you sure? [y/N]: " CONFIRM
        
        if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
            # Stop daemon if running
            if check_daemon; then
                echo "Stopping daemon..."
                $SHURIUM_CLI --testnet --rpcport=$TESTNET_RPC_PORT stop 2>/dev/null || true
                sleep 2
                pkill -f "shuriumd.*testnet" 2>/dev/null || true
            fi
            
            echo "Removing blockchain data..."
            rm -rf "$TESTNET_DATA_DIR/blocks" "$TESTNET_DATA_DIR/chainstate"
            
            echo -e "${GREEN}Testnet data reset. Start the node to resync.${NC}"
        else
            echo "Cancelled."
        fi
        ;;
        
    7)
        echo "Goodbye!"
        exit 0
        ;;
        
    *)
        echo -e "${RED}Invalid choice. Please run the script again.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}For more information, see docs/TESTNET_GUIDE.md${NC}"
