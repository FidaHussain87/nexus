// SHURIUM - Universal Basic Income (UBI) System Implementation
// Copyright (c) 2024 SHURIUM Developers
// MIT License

#include <shurium/economics/ubi.h>
#include <shurium/crypto/sha256.h>
#include <shurium/crypto/field.h>

#include <algorithm>
#include <chrono>
#include <cstring>
#include <sstream>

namespace shurium {
namespace economics {

// ============================================================================
// ClaimStatus Utilities
// ============================================================================

const char* ClaimStatusToString(ClaimStatus status) {
    switch (status) {
        case ClaimStatus::Pending:          return "Pending";
        case ClaimStatus::Valid:            return "Valid";
        case ClaimStatus::InvalidProof:     return "InvalidProof";
        case ClaimStatus::DoubleClaim:      return "DoubleClaim";
        case ClaimStatus::IdentityNotFound: return "IdentityNotFound";
        case ClaimStatus::EpochExpired:     return "EpochExpired";
        case ClaimStatus::EpochNotComplete: return "EpochNotComplete";
        case ClaimStatus::PoolEmpty:        return "PoolEmpty";
        default:                            return "Unknown";
    }
}

// ============================================================================
// UBIClaim
// ============================================================================

UBIClaim UBIClaim::Create(
    EpochId epoch,
    const identity::IdentitySecrets& secrets,
    const Hash160& recipient,
    const identity::VectorCommitment::MerkleProof& membershipProof
) {
    UBIClaim claim;
    claim.epoch = epoch;
    claim.recipient = recipient;
    claim.status = ClaimStatus::Pending;
    
    // Generate nullifier for this epoch using the correct API
    claim.nullifier = secrets.DeriveNullifier(epoch);
    
    // Generate proper ZK proof using the ProofGenerator
    identity::ProofGenerator& generator = identity::ProofGenerator::Instance();
    
    // Check if we have a valid membership proof
    if (membershipProof.siblings.empty()) {
        // No Merkle proof provided - cannot generate valid proof
        // The claim will fail verification but we return it for error handling upstream
        claim.status = ClaimStatus::InvalidProof;
        return claim;
    }
    
    // Compute the identity root from the Merkle proof and commitment
    // The root is computed by hashing up the path
    identity::IdentityCommitment commitment = secrets.GetCommitment();
    FieldElement currentHash = commitment.ToFieldElement();
    
    for (size_t i = 0; i < membershipProof.siblings.size(); ++i) {
        // Hash with sibling based on path direction
        Poseidon hasher;
        if (i < membershipProof.pathBits.size() && membershipProof.pathBits[i]) {
            // We're on the right, sibling is on the left
            hasher.Absorb(membershipProof.siblings[i]);
            hasher.Absorb(currentHash);
        } else {
            // We're on the left, sibling is on the right
            hasher.Absorb(currentHash);
            hasher.Absorb(membershipProof.siblings[i]);
        }
        currentHash = hasher.Squeeze();
    }
    FieldElement identityRoot = currentHash;
    
    // Generate the actual UBI claim proof using the proper proof generation
    auto proofResult = generator.GenerateUBIClaimProof(
        secrets.secretKey,
        secrets.nullifierKey, 
        secrets.trapdoor,
        identityRoot,
        membershipProof,
        epoch
    );
    
    if (proofResult) {
        // Extract the ZK proof from the identity proof
        claim.proof = proofResult->GetZKProof();
    } else {
        // Proof generation failed
        claim.status = ClaimStatus::InvalidProof;
    }
    
    return claim;
}

std::vector<Byte> UBIClaim::Serialize() const {
    std::vector<Byte> data;
    data.reserve(256);
    
    // Epoch (4 bytes)
    for (int i = 0; i < 4; ++i) {
        data.push_back(static_cast<Byte>((epoch >> (i * 8)) & 0xFF));
    }
    
    // Nullifier (32 bytes + 8 bytes epoch)
    const auto& nullifierHash = nullifier.GetHash();
    data.insert(data.end(), nullifierHash.begin(), nullifierHash.end());
    uint64_t nullifierEpoch = nullifier.GetEpoch();
    for (int i = 0; i < 8; ++i) {
        data.push_back(static_cast<Byte>((nullifierEpoch >> (i * 8)) & 0xFF));
    }
    
    // Recipient (20 bytes)
    data.insert(data.end(), recipient.begin(), recipient.end());
    
    // Submit height (4 bytes)
    for (int i = 0; i < 4; ++i) {
        data.push_back(static_cast<Byte>((submitHeight >> (i * 8)) & 0xFF));
    }
    
    // Status (1 byte)
    data.push_back(static_cast<Byte>(status));
    
    // Amount (8 bytes)
    for (int i = 0; i < 8; ++i) {
        data.push_back(static_cast<Byte>((amount >> (i * 8)) & 0xFF));
    }
    
    // Proof (variable) - using ToBytes()
    auto proofBytes = proof.ToBytes();
    uint32_t proofSize = static_cast<uint32_t>(proofBytes.size());
    for (int i = 0; i < 4; ++i) {
        data.push_back(static_cast<Byte>((proofSize >> (i * 8)) & 0xFF));
    }
    data.insert(data.end(), proofBytes.begin(), proofBytes.end());
    
    return data;
}

std::optional<UBIClaim> UBIClaim::Deserialize(const Byte* data, size_t len) {
    if (len < 77) { // Minimum size: 4 + 32 + 8 + 20 + 4 + 1 + 8 = 77 bytes
        return std::nullopt;
    }
    
    UBIClaim claim;
    size_t offset = 0;
    
    // Epoch
    claim.epoch = 0;
    for (int i = 0; i < 4; ++i) {
        claim.epoch |= static_cast<EpochId>(data[offset++]) << (i * 8);
    }
    
    // Nullifier hash
    identity::NullifierHash nullifierHash;
    std::copy(data + offset, data + offset + 32, nullifierHash.begin());
    offset += 32;
    
    // Nullifier epoch
    uint64_t nullifierEpoch = 0;
    for (int i = 0; i < 8; ++i) {
        nullifierEpoch |= static_cast<uint64_t>(data[offset++]) << (i * 8);
    }
    claim.nullifier = identity::Nullifier(nullifierHash, nullifierEpoch);
    
    // Recipient
    std::copy(data + offset, data + offset + 20, claim.recipient.begin());
    offset += 20;
    
    // Submit height
    claim.submitHeight = 0;
    for (int i = 0; i < 4; ++i) {
        claim.submitHeight |= static_cast<int>(data[offset++]) << (i * 8);
    }
    
    // Status
    claim.status = static_cast<ClaimStatus>(data[offset++]);
    
    // Amount
    claim.amount = 0;
    for (int i = 0; i < 8; ++i) {
        claim.amount |= static_cast<Amount>(data[offset++]) << (i * 8);
    }
    
    // Proof
    if (offset + 4 > len) {
        return std::nullopt;
    }
    uint32_t proofSize = 0;
    for (int i = 0; i < 4; ++i) {
        proofSize |= static_cast<uint32_t>(data[offset++]) << (i * 8);
    }
    
    if (offset + proofSize > len) {
        return std::nullopt;
    }
    
    auto proofOpt = identity::ZKProof::FromBytes(&data[offset], proofSize);
    if (!proofOpt) {
        return std::nullopt;
    }
    claim.proof = *proofOpt;
    
    return claim;
}

Hash256 UBIClaim::GetHash() const {
    auto serialized = Serialize();
    return SHA256Hash(serialized.data(), serialized.size());
}

std::string UBIClaim::ToString() const {
    std::ostringstream ss;
    ss << "UBIClaim {"
       << " epoch: " << epoch
       << ", nullifier: " << nullifier.ToHex().substr(0, 16) << "..."
       << ", status: " << ClaimStatusToString(status)
       << ", amount: " << FormatAmount(amount)
       << " }";
    return ss.str();
}

// ============================================================================
// EpochUBIPool
// ============================================================================

void EpochUBIPool::Finalize(uint32_t identityCount) {
    eligibleCount = identityCount;
    
    if (identityCount >= MIN_IDENTITIES_FOR_UBI) {
        amountPerPerson = totalPool / identityCount;
        // Cap at maximum
        amountPerPerson = std::min(amountPerPerson, MAX_UBI_PER_PERSON);
    } else {
        // Not enough identities, no distribution
        amountPerPerson = 0;
    }
    
    isFinalized = true;
}

bool EpochUBIPool::IsNullifierUsed(const identity::Nullifier& nullifier) const {
    return usedNullifiers.find(nullifier) != usedNullifiers.end();
}

void EpochUBIPool::RecordClaim(const identity::Nullifier& nullifier, Amount amount) {
    usedNullifiers.insert(nullifier);
    amountClaimed += amount;
    claimCount++;
}

Amount EpochUBIPool::UnclaimedAmount() const {
    return totalPool > amountClaimed ? totalPool - amountClaimed : 0;
}

double EpochUBIPool::ClaimRate() const {
    if (eligibleCount == 0) {
        return 0.0;
    }
    return static_cast<double>(claimCount) / eligibleCount * 100.0;
}

bool EpochUBIPool::AcceptingClaims(int currentHeight) const {
    if (!isFinalized) {
        return false;
    }
    return currentHeight <= claimDeadline;
}

std::string EpochUBIPool::ToString() const {
    std::ostringstream ss;
    ss << "EpochUBIPool {"
       << " epoch: " << epoch
       << ", pool: " << FormatAmount(totalPool)
       << ", eligible: " << eligibleCount
       << ", perPerson: " << FormatAmount(amountPerPerson)
       << ", claimed: " << FormatAmount(amountClaimed)
       << " (" << claimCount << " claims)"
       << ", rate: " << ClaimRate() << "%"
       << " }";
    return ss.str();
}

// ============================================================================
// UBIDistributor
// ============================================================================

UBIDistributor::UBIDistributor(const RewardCalculator& calculator)
    : calculator_(calculator) {
}

UBIDistributor::~UBIDistributor() = default;

void UBIDistributor::AddBlockReward(int height, Amount amount) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    EpochId epoch = HeightToEpoch(height);
    
    // If epoch changed, check if previous epochs need finalization
    // Note: Epochs must be explicitly finalized via FinalizeEpoch() 
    // with the correct identity count from the IdentityManager.
    // This function only updates the current epoch counter.
    if (epoch > currentEpoch_) {
        // Log warning if previous epochs are unfinalized
        for (EpochId e = currentEpoch_; e < epoch; ++e) {
            auto it = pools_.find(e);
            if (it != pools_.end() && !it->second.isFinalized) {
                // Warning: Previous epoch not finalized
                // The node operator should ensure FinalizeEpoch is called
                // with the correct identity count before advancing epochs.
            }
        }
    }
    
    currentEpoch_ = epoch;
    
    EpochUBIPool& pool = GetOrCreatePool(epoch);
    pool.totalPool += amount;
}

void UBIDistributor::FinalizeEpoch(EpochId epoch, uint32_t identityCount) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    auto it = pools_.find(epoch);
    if (it == pools_.end()) {
        return;
    }
    
    EpochUBIPool& pool = it->second;
    pool.endHeight = EpochEndHeight(epoch);
    pool.claimDeadline = pool.endHeight + UBI_CLAIM_WINDOW + (UBI_GRACE_EPOCHS * EPOCH_BLOCKS);
    pool.Finalize(identityCount);
}

const EpochUBIPool* UBIDistributor::GetPool(EpochId epoch) const {
    std::lock_guard<std::mutex> lock(mutex_);
    
    auto it = pools_.find(epoch);
    if (it == pools_.end()) {
        return nullptr;
    }
    return &it->second;
}

Amount UBIDistributor::GetAmountPerPerson(EpochId epoch) const {
    const EpochUBIPool* pool = GetPool(epoch);
    if (!pool || !pool->isFinalized) {
        return 0;
    }
    return pool->amountPerPerson;
}

ClaimStatus UBIDistributor::ProcessClaim(
    UBIClaim& claim,
    const Hash256& identityTreeRoot,
    int currentHeight
) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    claim.submitHeight = currentHeight;
    
    // Check if epoch pool exists
    auto it = pools_.find(claim.epoch);
    if (it == pools_.end()) {
        claim.status = ClaimStatus::EpochNotComplete;
        return claim.status;
    }
    
    EpochUBIPool& pool = it->second;
    
    // Check if epoch is finalized
    if (!pool.isFinalized) {
        claim.status = ClaimStatus::EpochNotComplete;
        return claim.status;
    }
    
    // Check if still accepting claims
    if (!pool.AcceptingClaims(currentHeight)) {
        claim.status = ClaimStatus::EpochExpired;
        return claim.status;
    }
    
    // Check pool has funds
    if (pool.amountPerPerson == 0) {
        claim.status = ClaimStatus::PoolEmpty;
        return claim.status;
    }
    
    // Check for double-claim
    if (pool.IsNullifierUsed(claim.nullifier)) {
        claim.status = ClaimStatus::DoubleClaim;
        return claim.status;
    }
    
    // Verify the ZK proof using the ProofVerifier
    // The proof must demonstrate knowledge of identity secrets and membership
    // in the identity tree with root `identityTreeRoot`
    identity::ProofVerifier& verifier = identity::ProofVerifier::Instance();
    
    // First, check structural validity
    if (!claim.proof.IsValid()) {
        claim.status = ClaimStatus::InvalidProof;
        return claim.status;
    }
    
    // Verify the proof type is UBI claim
    if (claim.proof.GetType() != identity::ProofType::UBIClaim) {
        claim.status = ClaimStatus::InvalidProof;
        return claim.status;
    }
    
    // Verify the proof's public inputs include the correct identity tree root
    // Public inputs for UBI claim proof should be:
    // [0] = identity tree root
    // [1] = nullifier hash  
    // [2] = epoch
    const auto& publicInputs = claim.proof.GetPublicInputs();
    if (publicInputs.Count() < 3) {
        claim.status = ClaimStatus::InvalidProof;
        return claim.status;
    }
    
    // Convert identity tree root (Hash256) to FieldElement for comparison
    FieldElement expectedRoot = FieldElement::FromBytes(identityTreeRoot.data(), identityTreeRoot.size());
    
    // Verify the root in public inputs matches expected identity tree root
    if (publicInputs.values[0] != expectedRoot) {
        claim.status = ClaimStatus::InvalidProof;
        return claim.status;
    }
    
    // Verify the epoch in public inputs matches claim epoch
    FieldElement expectedEpoch(static_cast<uint64_t>(claim.epoch));
    if (publicInputs.values[2] != expectedEpoch) {
        claim.status = ClaimStatus::InvalidProof;
        return claim.status;
    }
    
    // Verify the ZK proof itself using the UBI claim circuit
    if (!verifier.Verify(claim.proof, "ubi_claim")) {
        claim.status = ClaimStatus::InvalidProof;
        return claim.status;
    }
    
    // Claim is valid!
    claim.amount = pool.amountPerPerson;
    claim.status = ClaimStatus::Valid;
    
    // Record the claim
    pool.RecordClaim(claim.nullifier, claim.amount);
    totalDistributed_ += claim.amount;
    totalClaims_++;
    
    return claim.status;
}

bool UBIDistributor::VerifyClaim(
    const UBIClaim& claim,
    const Hash256& identityTreeRoot,
    int currentHeight
) const {
    std::lock_guard<std::mutex> lock(mutex_);
    
    // Check if epoch pool exists
    auto it = pools_.find(claim.epoch);
    if (it == pools_.end()) {
        return false;
    }
    
    const EpochUBIPool& pool = it->second;
    
    // Check if epoch is finalized
    if (!pool.isFinalized) {
        return false;
    }
    
    // Check if still accepting claims
    if (!pool.AcceptingClaims(currentHeight)) {
        return false;
    }
    
    // Check for double-claim
    if (pool.IsNullifierUsed(claim.nullifier)) {
        return false;
    }
    
    // Verify the ZK proof against the identity tree root
    // This performs the same verification as ProcessClaim but read-only
    
    // Check structural validity
    if (!claim.proof.IsValid()) {
        return false;
    }
    
    // Verify the proof type is UBI claim
    if (claim.proof.GetType() != identity::ProofType::UBIClaim) {
        return false;
    }
    
    // Verify the proof's public inputs
    const auto& publicInputs = claim.proof.GetPublicInputs();
    if (publicInputs.Count() < 3) {
        return false;
    }
    
    // Convert identity tree root to FieldElement for comparison
    FieldElement expectedRoot = FieldElement::FromBytes(identityTreeRoot.data(), identityTreeRoot.size());
    
    // Verify the root in public inputs matches expected identity tree root
    if (publicInputs.values[0] != expectedRoot) {
        return false;
    }
    
    // Verify the epoch in public inputs matches claim epoch
    FieldElement expectedEpoch(static_cast<uint64_t>(claim.epoch));
    if (publicInputs.values[2] != expectedEpoch) {
        return false;
    }
    
    // Verify the ZK proof itself using the UBI claim circuit
    identity::ProofVerifier& verifier = identity::ProofVerifier::Instance();
    return verifier.Verify(claim.proof, "ubi_claim");
}

bool UBIDistributor::IsEpochClaimable(EpochId epoch, int currentHeight) const {
    const EpochUBIPool* pool = GetPool(epoch);
    if (!pool) {
        return false;
    }
    return pool->isFinalized && pool->AcceptingClaims(currentHeight);
}

int UBIDistributor::GetClaimDeadline(EpochId epoch) const {
    const EpochUBIPool* pool = GetPool(epoch);
    if (!pool) {
        return -1;
    }
    return pool->claimDeadline;
}

double UBIDistributor::GetAverageClaimRate() const {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (pools_.empty()) {
        return 0.0;
    }
    
    double totalRate = 0.0;
    int count = 0;
    
    for (const auto& [epoch, pool] : pools_) {
        if (pool.isFinalized) {
            totalRate += pool.ClaimRate();
            count++;
        }
    }
    
    return count > 0 ? totalRate / count : 0.0;
}

UBIDistributor::EpochStats UBIDistributor::GetEpochStats(EpochId epoch) const {
    EpochStats stats;
    stats.epoch = epoch;
    
    const EpochUBIPool* pool = GetPool(epoch);
    if (pool) {
        stats.poolSize = pool->totalPool;
        stats.distributed = pool->amountClaimed;
        stats.unclaimed = pool->UnclaimedAmount();
        stats.eligibleCount = pool->eligibleCount;
        stats.claimCount = pool->claimCount;
        stats.claimRate = pool->ClaimRate();
    }
    
    return stats;
}

std::vector<Byte> UBIDistributor::Serialize() const {
    std::lock_guard<std::mutex> lock(mutex_);
    
    std::vector<Byte> data;
    
    // Version byte
    data.push_back(0x01);
    
    // Current epoch (8 bytes)
    uint64_t epoch64 = currentEpoch_;
    for (int i = 0; i < 8; ++i) {
        data.push_back(static_cast<Byte>((epoch64 >> (i * 8)) & 0xFF));
    }
    
    // Number of pools (4 bytes)
    uint32_t poolCount = static_cast<uint32_t>(pools_.size());
    for (int i = 0; i < 4; ++i) {
        data.push_back(static_cast<Byte>((poolCount >> (i * 8)) & 0xFF));
    }
    
    // Serialize each pool
    for (const auto& [epochId, pool] : pools_) {
        // Epoch ID (8 bytes)
        uint64_t e = epochId;
        for (int i = 0; i < 8; ++i) {
            data.push_back(static_cast<Byte>((e >> (i * 8)) & 0xFF));
        }
        
        // Total pool (8 bytes)
        int64_t tp = pool.totalPool;
        for (int i = 0; i < 8; ++i) {
            data.push_back(static_cast<Byte>((tp >> (i * 8)) & 0xFF));
        }
        
        // Eligible count (4 bytes)
        uint32_t ec = pool.eligibleCount;
        for (int i = 0; i < 4; ++i) {
            data.push_back(static_cast<Byte>((ec >> (i * 8)) & 0xFF));
        }
        
        // Amount per person (8 bytes)
        int64_t app = pool.amountPerPerson;
        for (int i = 0; i < 8; ++i) {
            data.push_back(static_cast<Byte>((app >> (i * 8)) & 0xFF));
        }
        
        // Amount claimed (8 bytes)
        int64_t ac = pool.amountClaimed;
        for (int i = 0; i < 8; ++i) {
            data.push_back(static_cast<Byte>((ac >> (i * 8)) & 0xFF));
        }
        
        // Claim count (4 bytes)
        uint32_t cc = pool.claimCount;
        for (int i = 0; i < 4; ++i) {
            data.push_back(static_cast<Byte>((cc >> (i * 8)) & 0xFF));
        }
        
        // Flags: isFinalized (1 byte)
        data.push_back(pool.isFinalized ? 0x01 : 0x00);
        
        // End height (4 bytes)
        int32_t eh = pool.endHeight;
        for (int i = 0; i < 4; ++i) {
            data.push_back(static_cast<Byte>((eh >> (i * 8)) & 0xFF));
        }
        
        // Claim deadline (4 bytes)
        int32_t cd = pool.claimDeadline;
        for (int i = 0; i < 4; ++i) {
            data.push_back(static_cast<Byte>((cd >> (i * 8)) & 0xFF));
        }
        
        // Number of used nullifiers (4 bytes)
        uint32_t nullifierCount = static_cast<uint32_t>(pool.usedNullifiers.size());
        for (int i = 0; i < 4; ++i) {
            data.push_back(static_cast<Byte>((nullifierCount >> (i * 8)) & 0xFF));
        }
        
        // Serialize each nullifier (32 bytes each)
        for (const auto& nullifier : pool.usedNullifiers) {
            const Byte* nullifierData = nullifier.data();
            data.insert(data.end(), nullifierData, nullifierData + identity::Nullifier::SIZE);
        }
    }
    
    return data;
}

bool UBIDistributor::Deserialize(const Byte* data, size_t len) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (!data || len < 13) {  // Minimum: version(1) + epoch(8) + poolCount(4)
        return false;
    }
    
    size_t offset = 0;
    
    // Version byte
    uint8_t version = data[offset++];
    if (version != 0x01) {
        return false;  // Unsupported version
    }
    
    // Current epoch (8 bytes)
    currentEpoch_ = 0;
    for (int i = 0; i < 8; ++i) {
        currentEpoch_ |= static_cast<EpochId>(data[offset++]) << (i * 8);
    }
    
    // Number of pools (4 bytes)
    uint32_t poolCount = 0;
    for (int i = 0; i < 4; ++i) {
        poolCount |= static_cast<uint32_t>(data[offset++]) << (i * 8);
    }
    
    // Sanity check
    if (poolCount > 10000) {
        return false;  // Too many pools
    }
    
    // Clear existing pools
    pools_.clear();
    
    // Deserialize each pool
    for (uint32_t p = 0; p < poolCount; ++p) {
        if (offset + 53 > len) {  // Minimum pool size without nullifiers
            return false;
        }
        
        EpochUBIPool pool;
        
        // Epoch ID (8 bytes)
        EpochId epochId = 0;
        for (int i = 0; i < 8; ++i) {
            epochId |= static_cast<EpochId>(data[offset++]) << (i * 8);
        }
        pool.epoch = epochId;
        
        // Total pool (8 bytes)
        int64_t tp = 0;
        for (int i = 0; i < 8; ++i) {
            tp |= static_cast<int64_t>(data[offset++]) << (i * 8);
        }
        pool.totalPool = tp;
        
        // Eligible count (4 bytes)
        uint32_t ec = 0;
        for (int i = 0; i < 4; ++i) {
            ec |= static_cast<uint32_t>(data[offset++]) << (i * 8);
        }
        pool.eligibleCount = ec;
        
        // Amount per person (8 bytes)
        int64_t app = 0;
        for (int i = 0; i < 8; ++i) {
            app |= static_cast<int64_t>(data[offset++]) << (i * 8);
        }
        pool.amountPerPerson = app;
        
        // Amount claimed (8 bytes)
        int64_t ac = 0;
        for (int i = 0; i < 8; ++i) {
            ac |= static_cast<int64_t>(data[offset++]) << (i * 8);
        }
        pool.amountClaimed = ac;
        
        // Claim count (4 bytes)
        uint32_t cc = 0;
        for (int i = 0; i < 4; ++i) {
            cc |= static_cast<uint32_t>(data[offset++]) << (i * 8);
        }
        pool.claimCount = cc;
        
        // Flags: isFinalized (1 byte)
        pool.isFinalized = (data[offset++] != 0);
        
        // End height (4 bytes)
        int32_t eh = 0;
        for (int i = 0; i < 4; ++i) {
            eh |= static_cast<int32_t>(data[offset++]) << (i * 8);
        }
        pool.endHeight = eh;
        
        // Claim deadline (4 bytes)
        int32_t cd = 0;
        for (int i = 0; i < 4; ++i) {
            cd |= static_cast<int32_t>(data[offset++]) << (i * 8);
        }
        pool.claimDeadline = cd;
        
        // Number of used nullifiers (4 bytes)
        uint32_t nullifierCount = 0;
        for (int i = 0; i < 4; ++i) {
            nullifierCount |= static_cast<uint32_t>(data[offset++]) << (i * 8);
        }
        
        // Sanity check
        if (nullifierCount > 1000000) {
            return false;  // Too many nullifiers
        }
        
        // Check we have enough data for nullifiers
        if (offset + nullifierCount * identity::Nullifier::SIZE > len) {
            return false;
        }
        
        // Deserialize each nullifier (32 bytes each)
        for (uint32_t n = 0; n < nullifierCount; ++n) {
            identity::NullifierHash hash;
            std::memcpy(hash.data(), data + offset, identity::Nullifier::SIZE);
            offset += identity::Nullifier::SIZE;
            
            identity::Nullifier nullifier(hash, epochId);
            pool.usedNullifiers.insert(nullifier);
        }
        
        pools_[epochId] = std::move(pool);
    }
    
    return true;
}

EpochUBIPool& UBIDistributor::GetOrCreatePool(EpochId epoch) {
    auto it = pools_.find(epoch);
    if (it == pools_.end()) {
        EpochUBIPool pool;
        pool.epoch = epoch;
        pool.endHeight = EpochEndHeight(epoch);
        pools_[epoch] = pool;
        return pools_[epoch];
    }
    return it->second;
}

void UBIDistributor::PruneOldPools(EpochId currentEpoch) {
    // Keep pools for the grace period + some buffer
    EpochId cutoff = currentEpoch > (UBI_GRACE_EPOCHS + 10) 
                   ? currentEpoch - UBI_GRACE_EPOCHS - 10 
                   : 0;
    
    for (auto it = pools_.begin(); it != pools_.end(); ) {
        if (it->first < cutoff) {
            it = pools_.erase(it);
        } else {
            ++it;
        }
    }
}

// ============================================================================
// UBITransactionBuilder
// ============================================================================

std::vector<std::pair<std::vector<Byte>, Amount>> UBITransactionBuilder::BuildClaimOutputs(
    const UBIClaim& claim,
    Amount amount
) const {
    std::vector<std::pair<std::vector<Byte>, Amount>> outputs;
    
    // Create P2PKH script for recipient
    std::vector<Byte> script;
    script.reserve(25);
    script.push_back(0x76); // OP_DUP
    script.push_back(0xa9); // OP_HASH160
    script.push_back(0x14); // Push 20 bytes
    script.insert(script.end(), claim.recipient.begin(), claim.recipient.end());
    script.push_back(0x88); // OP_EQUALVERIFY
    script.push_back(0xac); // OP_CHECKSIG
    
    outputs.emplace_back(std::move(script), amount);
    
    return outputs;
}

bool UBITransactionBuilder::VerifyClaimOutputs(
    const UBIClaim& claim,
    const std::vector<std::pair<std::vector<Byte>, Amount>>& outputs
) const {
    if (outputs.empty()) {
        return false;
    }
    
    // Verify at least one output goes to the claim recipient
    for (const auto& [script, amount] : outputs) {
        if (script.size() >= 25 && 
            script[0] == 0x76 && script[1] == 0xa9 && script[2] == 0x14) {
            // Extract the hash from the script
            Hash160 scriptHash;
            std::copy(script.begin() + 3, script.begin() + 23, scriptHash.begin());
            
            if (scriptHash == claim.recipient && amount > 0) {
                return true;
            }
        }
    }
    
    return false;
}

// ============================================================================
// UBIClaimGenerator
// ============================================================================

UBIClaim UBIClaimGenerator::GenerateClaim(
    EpochId epoch,
    const identity::IdentitySecrets& secrets,
    const Hash160& recipient,
    const identity::VectorCommitment::MerkleProof& membershipProof
) {
    return UBIClaim::Create(epoch, secrets, recipient, membershipProof);
}

bool UBIClaimGenerator::CanClaim(
    EpochId epoch,
    const identity::IdentitySecrets& secrets,
    const UBIDistributor& distributor
) {
    // Check if epoch is claimable (using a high block height to ensure we're past it)
    int checkHeight = EpochEndHeight(epoch) + 1;
    
    if (!distributor.IsEpochClaimable(epoch, checkHeight)) {
        return false;
    }
    
    // Generate the nullifier that would be used
    identity::Nullifier nullifier = secrets.DeriveNullifier(epoch);
    
    // Check if this nullifier has already been used
    const EpochUBIPool* pool = distributor.GetPool(epoch);
    if (!pool) {
        return false;
    }
    
    return !pool->IsNullifierUsed(nullifier);
}

// ============================================================================
// Utility Functions
// ============================================================================

Amount CalculateExpectedUBI(uint32_t identityCount, const RewardCalculator& calculator) {
    if (identityCount < MIN_IDENTITIES_FOR_UBI) {
        return 0;
    }
    
    // Calculate total UBI pool for one epoch
    Amount epochPool = 0;
    for (int i = 0; i < EPOCH_BLOCKS; ++i) {
        epochPool += calculator.GetUBIPoolAmount(i);
    }
    
    return epochPool / identityCount;
}

Amount EstimateAnnualUBI(uint32_t identityCount, const RewardCalculator& calculator) {
    // ~365 epochs per year (one per day)
    constexpr int EPOCHS_PER_YEAR = 365;
    
    Amount perEpoch = CalculateExpectedUBI(identityCount, calculator);
    return perEpoch * EPOCHS_PER_YEAR;
}

} // namespace economics
} // namespace shurium
