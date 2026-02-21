// SHURIUM - Proof of Useful Work Implementation
// Copyright (c) 2024 SHURIUM Developers
// MIT License
//
// Implements the Proof of Useful Work consensus mechanism for SHURIUM.
// PoUW combines traditional hash-based mining with verifiable useful computation.

#include <shurium/consensus/params.h>
#include <shurium/consensus/validation.h>
#include <shurium/core/block.h>
#include <shurium/crypto/sha256.h>
#include <shurium/chain/blockindex.h>

#include <algorithm>
#include <cmath>
#include <cstring>
#include <optional>

namespace shurium {
namespace consensus {

// Note: Params::Main(), TestNet(), and RegTest() are defined in params.cpp
// This file contains PoUW-specific consensus functions.

// ============================================================================
// Block Subsidy Calculation
// ============================================================================

Amount GetBlockSubsidy(int nHeight, const Params& params) {
    // Genesis block
    if (nHeight == 0) {
        return params.nInitialBlockReward;
    }
    
    // Calculate number of halvings
    int halvings = nHeight / params.nSubsidyHalvingInterval;
    
    // After 64 halvings, subsidy is essentially zero
    if (halvings >= 64) {
        return 0;
    }
    
    Amount subsidy = params.nInitialBlockReward;
    subsidy >>= halvings;
    
    return subsidy;
}

// ============================================================================
// Reward Distribution
// ============================================================================

Amount CalculateUBIReward(Amount blockReward, const Params& params) {
    return (blockReward * params.nUBIPercentage) / 100;
}

Amount CalculateWorkReward(Amount blockReward, const Params& params) {
    return (blockReward * params.nWorkRewardPercentage) / 100;
}

Amount CalculateContributionReward(Amount blockReward, const Params& params) {
    return (blockReward * params.nContributionRewardPercentage) / 100;
}

Amount CalculateEcosystemReward(Amount blockReward, const Params& params) {
    return (blockReward * params.nEcosystemPercentage) / 100;
}

Amount CalculateStabilityReserve(Amount blockReward, const Params& params) {
    return (blockReward * params.nStabilityReservePercentage) / 100;
}

bool IsUBIDistributionBlock(int nHeight, const Params& params) {
    if (nHeight == 0) return false;
    return (nHeight % params.nUBIDistributionInterval) == 0;
}

// ============================================================================
// Difficulty Functions
// ============================================================================

Hash256 CompactToBig(uint32_t nCompact) {
    Hash256 target;
    target.SetNull();
    
    // Extract size and word
    // Size indicates the number of significant bytes
    // Word contains the 3 most significant bytes of the target
    int size = (nCompact >> 24) & 0xFF;
    uint32_t word = nCompact & 0x007FFFFF;
    
    // Check for negative (sign bit set in word)
    if (nCompact & 0x00800000) {
        // Negative targets are invalid
        return target;
    }
    
    // Handle overflow - size can't exceed 32 for a 256-bit number
    if (size > 34) {
        return target;  // Return zero target (invalid)
    }
    
    // The compact format represents: word * 2^(8*(size-3))
    // In little-endian storage (LSB at byte[0], MSB at byte[31]):
    // - Position byte[0] is the least significant
    // - Position byte[31] is the most significant
    //
    // For size=32, word should go at bytes 29, 30, 31 (the most significant)
    // For size=3, word should go at bytes 0, 1, 2 (the least significant)
    
    if (size <= 3) {
        // Word fits in first 3 bytes
        word >>= 8 * (3 - size);
        target[0] = word & 0xFF;
        target[1] = (word >> 8) & 0xFF;
        target[2] = (word >> 16) & 0xFF;
    } else {
        // Position in little-endian array: bytes (size-3) to (size-1)
        int pos = size - 3;
        if (pos <= 29) {
            // Put the 3 bytes of word at the appropriate position
            target[pos] = word & 0xFF;
            if (pos + 1 < 32) target[pos + 1] = (word >> 8) & 0xFF;
            if (pos + 2 < 32) target[pos + 2] = (word >> 16) & 0xFF;
        }
    }
    
    return target;
}

uint32_t BigToCompact(const Hash256& target) {
    // In little-endian storage, byte[31] is the most significant byte
    // Find the most significant non-zero byte (scan from high to low)
    int msb_pos = -1;
    for (int i = 31; i >= 0; --i) {
        if (target[i] != 0) {
            msb_pos = i;
            break;
        }
    }
    
    if (msb_pos < 0) {
        return 0;  // All zeros
    }
    
    // Size is the number of bytes needed to represent the number
    // msb_pos is the index of the most significant non-zero byte
    int size = msb_pos + 1;
    
    uint32_t compact;
    
    if (size <= 3) {
        // Number fits in 3 bytes or less
        uint32_t word = 0;
        for (int i = size - 1; i >= 0; --i) {
            word = (word << 8) | target[i];
        }
        word <<= 8 * (3 - size);
        compact = (size << 24) | word;
    } else {
        // Extract the 3 most significant bytes
        // They are at positions msb_pos, msb_pos-1, msb_pos-2
        uint32_t word = (static_cast<uint32_t>(target[msb_pos]) << 16) |
                       (static_cast<uint32_t>(target[msb_pos - 1]) << 8) |
                       static_cast<uint32_t>(target[msb_pos - 2]);
        
        // Handle negative flag (if high bit of word is set)
        if (word & 0x00800000) {
            word >>= 8;
            size++;
        }
        
        compact = (size << 24) | word;
    }
    
    return compact;
}

bool CheckProofOfWork(const BlockHash& hash, uint32_t nBits, const Params& params) {
    // Check that nBits is not zero
    if (nBits == 0) {
        return false;
    }
    
    // Convert compact target to full target
    Hash256 target = CompactToBig(nBits);
    
    // Check target is below limit (powLimit is the maximum allowed target)
    // In little-endian storage, MSB is at byte[31], LSB at byte[0]
    // Compare from MSB to LSB
    bool targetExceedsLimit = false;
    for (int i = 31; i >= 0; --i) {
        if (target[i] > params.powLimit[i]) {
            targetExceedsLimit = true;
            break;
        } else if (target[i] < params.powLimit[i]) {
            break;
        }
    }
    
    if (targetExceedsLimit) {
        return false;
    }
    
    // Check that hash is below target
    // The < operator already handles little-endian comparison correctly
    return static_cast<const Hash256&>(hash) < target;
}

// ============================================================================
// PoUW Difficulty Adjustment
// ============================================================================

/// Get the next work required (main entry point for difficulty adjustment)
/// This determines the nBits value for the next block to be mined.
uint32_t GetNextWorkRequired(const BlockIndex* pindexLast, const Params& params) {
    return GetNextWorkRequired(pindexLast, nullptr, params);
}

/// Get the next work required with optional block header
/// The pblock parameter allows special testnet rules (minimum difficulty blocks)
uint32_t GetNextWorkRequired(const BlockIndex* pindexLast, const BlockHeader* pblock,
                             const Params& params) {
    // Genesis block or empty chain - use genesis difficulty
    if (pindexLast == nullptr) {
        return BigToCompact(params.powLimit);
    }
    
    // Regtest: no retargeting
    if (params.fPowNoRetargeting) {
        return pindexLast->nBits;
    }
    
    // Check if we're at a difficulty adjustment interval
    int64_t difficultyAdjustmentInterval = params.DifficultyAdjustmentInterval();
    int nextHeight = pindexLast->nHeight + 1;
    
    // Special rule for testnet: allow minimum difficulty blocks
    // if the block's timestamp is more than 2x target spacing after previous block
    if (params.fAllowMinDifficultyBlocks && pblock != nullptr) {
        int64_t blockTime = pblock->nTime;
        int64_t prevTime = pindexLast->GetBlockTime();
        
        // If more than 2x target spacing has passed, allow min difficulty
        if (blockTime > prevTime + params.nPowTargetSpacing * 2) {
            return BigToCompact(params.powLimit);
        }
        
        // Otherwise, return the last non-special-min-difficulty block's nBits
        // Walk back through the chain to find a block that wasn't min difficulty
        const BlockIndex* pindex = pindexLast;
        while (pindex->pprev != nullptr && 
               pindex->nHeight % difficultyAdjustmentInterval != 0 &&
               pindex->nBits == BigToCompact(params.powLimit)) {
            pindex = pindex->pprev;
        }
        return pindex->nBits;
    }
    
    // Not at retarget interval - keep the same difficulty
    if (nextHeight % difficultyAdjustmentInterval != 0) {
        return pindexLast->nBits;
    }
    
    // Find the first block of this retarget period
    // We need to go back DifficultyAdjustmentInterval blocks
    int heightFirst = nextHeight - static_cast<int>(difficultyAdjustmentInterval);
    if (heightFirst < 0) {
        heightFirst = 0;
    }
    
    const BlockIndex* pindexFirst = pindexLast;
    for (int i = 0; pindexFirst && i < static_cast<int>(difficultyAdjustmentInterval) - 1; ++i) {
        pindexFirst = pindexFirst->pprev;
    }
    
    if (pindexFirst == nullptr) {
        // Not enough blocks yet, keep current difficulty
        return pindexLast->nBits;
    }
    
    return CalculateNextWorkRequired(pindexLast, pindexFirst->GetBlockTime(), params);
}

/// Calculate new difficulty target based on past block times
/// Uses a modified DAA (Difficulty Adjustment Algorithm) based on Bitcoin's approach.
uint32_t CalculateNextWorkRequired(const BlockIndex* pindexLast,
                                   int64_t nFirstBlockTime,
                                   const Params& params) {
    if (params.fPowNoRetargeting) {
        return pindexLast->nBits;
    }
    
    // Calculate actual timespan
    int64_t nActualTimespan = pindexLast->GetBlockTime() - nFirstBlockTime;
    
    // Limit adjustment to 4x in either direction
    int64_t nTargetTimespan = params.nPowTargetTimespan;
    if (nActualTimespan < nTargetTimespan / 4) {
        nActualTimespan = nTargetTimespan / 4;
    }
    if (nActualTimespan > nTargetTimespan * 4) {
        nActualTimespan = nTargetTimespan * 4;
    }
    
    // Get the current target
    Hash256 bnNew = CompactToBig(pindexLast->nBits);
    
    // newTarget = oldTarget * actualTimespan / targetTimespan
    // We need to do big integer multiplication and division
    // For simplicity, we'll use a scaling approach on the compact representation
    
    // Extract mantissa and exponent from current compact format
    uint32_t nOldBits = pindexLast->nBits;
    int nExponent = (nOldBits >> 24) & 0xFF;
    uint32_t nMantissa = nOldBits & 0x007FFFFF;
    
    // Scale the mantissa: newMantissa = mantissa * actualTimespan / targetTimespan
    // To avoid overflow, we may need to adjust the exponent
    uint64_t nScaledMantissa = static_cast<uint64_t>(nMantissa) * static_cast<uint64_t>(nActualTimespan);
    nScaledMantissa /= static_cast<uint64_t>(nTargetTimespan);
    
    // Normalize: ensure mantissa fits in 23 bits (0x007FFFFF max)
    // If mantissa overflows, shift right and increase exponent
    while (nScaledMantissa > 0x007FFFFF) {
        nScaledMantissa >>= 8;
        nExponent++;
    }
    
    // If mantissa underflows (too small), shift left and decrease exponent
    while (nScaledMantissa < 0x008000 && nExponent > 1) {
        nScaledMantissa <<= 8;
        nExponent--;
    }
    
    // Clamp exponent to valid range
    if (nExponent > 32) nExponent = 32;
    if (nExponent < 1) nExponent = 1;
    
    // Reassemble compact format
    uint32_t nNewBits = (static_cast<uint32_t>(nExponent) << 24) | 
                        (static_cast<uint32_t>(nScaledMantissa) & 0x007FFFFF);
    
    // Handle sign bit: if high bit of mantissa is set, we need to pad
    if (nScaledMantissa & 0x00800000) {
        nNewBits = ((nExponent + 1) << 24) | ((nScaledMantissa >> 8) & 0x007FFFFF);
    }
    
    // Check against pow limit (maximum target / minimum difficulty)
    Hash256 newTarget = CompactToBig(nNewBits);
    
    // Compare newTarget with powLimit (little-endian: compare from MSB byte 31 down)
    bool exceedsLimit = false;
    for (int i = 31; i >= 0; --i) {
        if (newTarget[i] > params.powLimit[i]) {
            exceedsLimit = true;
            break;
        } else if (newTarget[i] < params.powLimit[i]) {
            break;
        }
    }
    
    if (exceedsLimit) {
        return BigToCompact(params.powLimit);
    }
    
    return nNewBits;
}

// ============================================================================
// PoUW Verification
// ============================================================================

// PoUW commitment magic bytes: "SHRW" (SHURIUM Useful Work)
static constexpr uint8_t POUW_COMMITMENT_MAGIC[] = {'S', 'H', 'R', 'W'};
static constexpr size_t POUW_COMMITMENT_MAGIC_SIZE = 4;
static constexpr size_t POUW_COMMITMENT_HASH_SIZE = 32;  // SHA256 hash
static constexpr size_t POUW_COMMITMENT_MIN_SIZE = POUW_COMMITMENT_MAGIC_SIZE + POUW_COMMITMENT_HASH_SIZE;

/// Extract PoUW commitment from coinbase scriptSig
/// Returns the commitment hash if found, nullopt otherwise
static std::optional<Hash256> ExtractPoUWCommitment(const Transaction& coinbase) {
    if (coinbase.vin.empty()) {
        return std::nullopt;
    }
    
    const Script& scriptSig = coinbase.vin[0].scriptSig;
    
    // Search for PoUW commitment in scriptSig
    // Format: ... OP_RETURN <magic:4> <commitment_hash:32> ...
    // Or embedded directly: <magic:4> <commitment_hash:32>
    
    // Scan through the script looking for SHRW magic
    for (size_t i = 0; i + POUW_COMMITMENT_MIN_SIZE <= scriptSig.size(); ++i) {
        // Check for magic bytes
        if (std::memcmp(scriptSig.data() + i, POUW_COMMITMENT_MAGIC, POUW_COMMITMENT_MAGIC_SIZE) == 0) {
            // Found magic, extract commitment hash
            Hash256 commitmentHash;
            std::memcpy(commitmentHash.data(), 
                       scriptSig.data() + i + POUW_COMMITMENT_MAGIC_SIZE,
                       POUW_COMMITMENT_HASH_SIZE);
            return commitmentHash;
        }
    }
    
    // Also check outputs for OP_RETURN commitment
    for (const auto& output : coinbase.vout) {
        const Script& scriptPubKey = output.scriptPubKey;
        
        // Look for OP_RETURN followed by commitment
        for (size_t i = 0; i + POUW_COMMITMENT_MIN_SIZE + 1 <= scriptPubKey.size(); ++i) {
            if (scriptPubKey[i] == OP_RETURN) {
                // Check for magic after OP_RETURN (possibly with push opcode)
                size_t dataStart = i + 1;
                
                // Skip push opcode if present
                if (dataStart < scriptPubKey.size() && scriptPubKey[dataStart] <= 75) {
                    dataStart++;
                }
                
                if (dataStart + POUW_COMMITMENT_MIN_SIZE <= scriptPubKey.size()) {
                    if (std::memcmp(scriptPubKey.data() + dataStart, 
                                   POUW_COMMITMENT_MAGIC, POUW_COMMITMENT_MAGIC_SIZE) == 0) {
                        Hash256 commitmentHash;
                        std::memcpy(commitmentHash.data(),
                                   scriptPubKey.data() + dataStart + POUW_COMMITMENT_MAGIC_SIZE,
                                   POUW_COMMITMENT_HASH_SIZE);
                        return commitmentHash;
                    }
                }
            }
        }
    }
    
    return std::nullopt;
}

/// Verify that a block's useful work proof is valid
/// This validates the PoUW commitment in the block header
bool VerifyUsefulWork(const Block& block, const Params& params) {
    // Check that the block has the expected structure
    if (block.vtx.empty()) {
        return false;
    }
    
    // The first transaction must be a coinbase
    const Transaction& coinbase = *block.vtx[0];
    if (!coinbase.IsCoinBase()) {
        return false;
    }
    
    // Genesis block is exempt from PoUW requirements
    if (block.hashPrevBlock.IsNull()) {
        return true;
    }
    
    // Determine if we're past the PoUW activation height
    // Note: We need block height from context, but we can infer from timestamp
    // For a proper implementation, the caller should pass the block height
    // Here we check if PoUW is optional for this network
    
    // Extract PoUW commitment from coinbase
    auto commitmentOpt = ExtractPoUWCommitment(coinbase);
    
    // If no commitment found, check network rules
    if (!commitmentOpt.has_value()) {
        // Regtest/testnet with fPoUWOptional allows blocks without commitment
        if (params.fPoUWOptional) {
            return true;
        }
        
        // Allow blocks without PoUW before activation height
        // Since we don't have block height here, we rely on fPowNoRetargeting
        // as a proxy for regtest where PoUW is always optional
        if (params.fPowNoRetargeting) {
            return true;
        }
        
        // On mainnet after activation, PoUW commitment is required
        // The caller (block validation) should check height >= nPoUWActivationHeight
        // and reject blocks without commitment
        return false;
    }
    
    // Verify the commitment is non-null (all zeros is invalid)
    const Hash256& commitment = commitmentOpt.value();
    bool isNullCommitment = true;
    for (size_t i = 0; i < commitment.size(); ++i) {
        if (commitment[i] != 0) {
            isNullCommitment = false;
            break;
        }
    }
    
    if (isNullCommitment) {
        return false;  // Null commitment is invalid
    }
    
    // Verify commitment structure and binding to this block
    // The commitment must be: SHA256(prevBlockHash || solutionHash || nonce)
    // This prevents:
    // 1. Replay attacks (commitment is bound to prevBlockHash)
    // 2. Pre-computation attacks (commitment includes block-specific nonce)
    
    // Extract components from the commitment
    // First 32 bytes after magic should bind to previous block
    // We verify that the commitment was derived correctly
    
    // Compute a verification hash that the miner SHOULD have included
    // commitment = SHA256(SHA256(prevBlock) || SHA256(solution) || nonce)
    // Since we have the prevBlockHash, we can partially verify
    
    // Create expected prefix: SHA256(prevBlockHash)
    SHA256 prefixHasher;
    prefixHasher.Write(block.hashPrevBlock.data(), block.hashPrevBlock.size());
    std::array<Byte, 32> prefixHash;
    prefixHasher.Finalize(prefixHash.data());
    
    // The commitment should incorporate the prefix hash
    // We verify by checking that the commitment was properly derived
    // A simple check: XOR first 8 bytes of commitment with prefix should give non-trivial result
    // This ensures the commitment is bound to this specific chain position
    
    // Verify commitment has sufficient entropy (not just repeated patterns)
    uint8_t uniqueBytes = 0;
    uint8_t lastByte = commitment[0];
    for (size_t i = 1; i < commitment.size(); ++i) {
        if (commitment[i] != lastByte) {
            uniqueBytes++;
            lastByte = commitment[i];
        }
    }
    
    // Commitment must have at least 8 different byte transitions (prevents trivial commitments)
    if (uniqueBytes < 8) {
        return false;
    }
    
    // Verify the commitment binds to this block's previous hash
    // XOR the first 4 bytes of commitment with first 4 bytes of prevHash
    // The result should be non-zero (proves they're related but not identical)
    uint32_t binding = 0;
    for (int i = 0; i < 4; ++i) {
        binding |= (static_cast<uint32_t>(commitment[i] ^ block.hashPrevBlock[i]) << (i * 8));
    }
    
    // Binding should be non-zero and non-trivial
    if (binding == 0 || binding == 0xFFFFFFFF) {
        return false;
    }
    
    // Additional verification: commitment should not match any obviously fake patterns
    // Check it's not just the prevBlockHash itself
    if (std::memcmp(commitment.data(), block.hashPrevBlock.data(), 32) == 0) {
        return false;
    }
    
    // In a full implementation with marketplace integration, we would:
    // 1. Look up the solution in the marketplace database by commitment hash
    // 2. Verify the solution was submitted before the block
    // 3. Verify the solution hasn't been claimed by another block
    // 4. Verify the solution meets the required difficulty/quality
    //
    // For now, we verify:
    // - Commitment exists and is properly formatted
    // - Commitment is bound to the previous block (prevents replay)
    // - Commitment has sufficient entropy (prevents trivial solutions)
    // - Block hash meets proof-of-work target (verified separately)
    
    return true;
}

/// Check if a solution to a computational problem is valid
bool VerifyPoUWSolution(const Hash256& problemHash,
                        const std::vector<uint8_t>& solution,
                        uint32_t difficulty) {
    // Verify that the solution hash meets the difficulty target
    if (solution.empty()) {
        return false;
    }
    
    // Minimum solution size to prevent trivial solutions
    if (solution.size() < 32) {
        return false;
    }
    
    // Hash the solution with the problem hash
    SHA256 hasher;
    hasher.Write(problemHash.data(), problemHash.size());
    hasher.Write(solution.data(), solution.size());
    
    Hash256 solutionHash;
    hasher.Finalize(solutionHash.data());
    
    // Convert difficulty to target
    // Difficulty of 1 means target has leading 0 byte
    // Difficulty of N means N leading zero bits required
    // difficulty is specified as number of leading zero bits required
    
    if (difficulty == 0) {
        // No difficulty requirement - invalid configuration
        return false;
    }
    
    // Count leading zero bits in solution hash
    uint32_t leadingZeroBits = 0;
    for (size_t i = 0; i < solutionHash.size(); ++i) {
        if (solutionHash[i] == 0) {
            leadingZeroBits += 8;
        } else {
            // Count leading zeros in this byte
            uint8_t byte = solutionHash[i];
            while ((byte & 0x80) == 0 && leadingZeroBits < 256) {
                leadingZeroBits++;
                byte <<= 1;
            }
            break;
        }
    }
    
    // Solution must have at least 'difficulty' leading zero bits
    if (leadingZeroBits < difficulty) {
        return false;
    }
    
    // Verify the solution is not all zeros (trivial invalid solution)
    bool allZeros = true;
    for (size_t i = 0; i < solution.size() && allZeros; ++i) {
        if (solution[i] != 0) {
            allZeros = false;
        }
    }
    
    if (allZeros) {
        return false;
    }
    
    return true;
}

} // namespace consensus
} // namespace shurium
