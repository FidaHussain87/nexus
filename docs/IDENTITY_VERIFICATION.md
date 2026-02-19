# SHURIUM Identity Verification Guide

This guide explains the identity verification system for UBI claims in SHURIUM.

## Overview

SHURIUM uses a **privacy-preserving identity system** based on zero-knowledge proofs. This allows users to:
- Prove they are human without revealing personal information
- Claim UBI without linking claims to their identity
- Maintain privacy while preventing double-claiming

## Verification Levels

Identities have different verification levels that affect UBI eligibility:

| Level | Name | Description | UBI Eligible |
|-------|------|-------------|--------------|
| 0 | None | Self-attested, no verification | No |
| 1 | Basic | Passed automated checks | Limited |
| 2 | Standard | Verified by one trusted verifier | Yes |
| 3 | Enhanced | Verified by multiple verifiers | Yes |
| 4 | Maximum | Full KYC by trusted authority | Yes (priority) |

## Identity Lifecycle

```
1. REGISTRATION
   ├── User generates identity secrets (local)
   ├── Commits to identity (public commitment only)
   └── Status: Pending
   
2. ACTIVATION
   ├── After activation delay (~100 blocks)
   ├── Identity added to Merkle tree
   └── Status: Active (Level 0)
   
3. VERIFICATION (Optional)
   ├── External verifier validates identity
   ├── Verification level increases
   └── Status: Active (Level 1-4)
   
4. UBI CLAIMS
   ├── Generate ZK proof of membership
   ├── Prove nullifier derivation
   └── Claim UBI without revealing identity
```

## Commands

### Creating an Identity

```bash
# Create a new identity
./shurium-cli createidentity

# Returns:
{
  "identityId": "abc123...",
  "status": "pending",
  "treeIndex": 42,
  "registrationHeight": 12345,
  "message": "Identity created. Becomes active after activation delay."
}
```

### Checking Identity Status

```bash
# Get identity status
./shurium-cli getidentitystatus "IDENTITY_ID"

# Returns:
{
  "identityId": "abc123...",
  "exists": true,
  "status": "active",
  "verificationLevel": "none",
  "verificationLevelNum": 0,
  "isActive": true,
  "canClaimUBI": true,
  "treeIndex": 42,
  "registrationHeight": 12345,
  "currentEpoch": 100,
  "totalIdentities": 5000,
  "activeIdentities": 4500
}
```

### Verifying an Identity

```bash
# Verify identity membership
./shurium-cli verifyidentity "IDENTITY_ID" "PROOF_HEX"

# Returns:
{
  "identityId": "abc123...",
  "valid": true,
  "status": "active",
  "isActive": true,
  "message": "Identity verified successfully"
}
```

### Claiming UBI

```bash
# Claim UBI for an identity
./shurium-cli claimubi "IDENTITY_ID" ["RECIPIENT_ADDRESS"]

# Returns:
{
  "identityId": "abc123...",
  "success": true,
  "amount": "10.00000000",
  "epoch": 99,
  "txid": "def456..."
}
```

### Getting UBI Information

```bash
# Get UBI status
./shurium-cli getubiinfo "IDENTITY_ID"

# Returns:
{
  "identityId": "abc123...",
  "currentEpoch": 100,
  "lastClaimEpoch": 99,
  "claimableAmount": "10.00000000",
  "totalClaimed": "500.00000000",
  "verificationLevel": "basic"
}
```

### Getting UBI History

```bash
# Get claim history
./shurium-cli getubihistory "IDENTITY_ID" [COUNT]

# Returns array of past claims
```

## Technical Details

### Identity Commitment

The identity commitment is:
```
commitment = Poseidon(secretKey, nullifierKey, trapdoor)
```

This commitment is public, but the underlying secrets remain private.

### Nullifier Derivation

For each UBI epoch, a unique nullifier is derived:
```
nullifier = Poseidon(nullifierKey, epoch, DOMAIN_UBI)
```

The nullifier prevents double-claiming without revealing which identity claimed.

### Zero-Knowledge Proof

The ZK proof proves:
1. Knowledge of secrets (sk, nk, td) such that `commitment = Poseidon(sk, nk, td)`
2. The commitment is in the identity Merkle tree
3. The nullifier is correctly derived from nk and the epoch

### Merkle Tree Structure

Identities are stored in a Poseidon-based Merkle tree:
- Tree depth: 20 (supports ~1 million identities)
- Hash function: Poseidon (ZK-friendly)
- Updates: Append-only with recomputed root

## Privacy Guarantees

### What is Private
- Identity secrets (never leave user's device)
- Which identity made a specific UBI claim
- Total UBI claimed by an identity over time

### What is Public
- Identity commitment (hash of secrets)
- Merkle root of all identities
- Nullifiers used for claims (but not linked to identity)
- Total UBI distributed per epoch

## Anti-Sybil Measures

The system prevents Sybil attacks through:

1. **Commitment Uniqueness** - Each commitment can only be registered once
2. **Nullifier Tracking** - Nullifiers prevent double-claims per epoch
3. **Verification Levels** - Higher verification = more confidence in uniqueness
4. **External Verifiers** - Trusted third parties can verify humanness

## Verification Integration

### For Verifiers

Trusted verifiers can validate identities through:
1. **Challenge-Response** - Verifier issues challenge, user proves knowledge
2. **External Attestation** - Government ID, biometric, etc.
3. **Social Verification** - Web-of-trust style vouching

### Becoming a Verifier

To become a trusted verifier:
1. Register as a verifier node
2. Stake required collateral
3. Pass governance approval
4. Follow verification protocols

## Best Practices

### For Users

1. **Backup your identity secrets** - Store your master seed safely
2. **Never share secrets** - Your secrets prove ownership
3. **Claim regularly** - Don't let epochs expire
4. **Upgrade verification** - Higher levels may have benefits

### For Developers

1. **Use the SDK** - Don't implement proofs from scratch
2. **Handle errors** - Check for expired epochs, used nullifiers
3. **Test on testnet** - Use testnet before mainnet
4. **Respect privacy** - Don't try to link claims to identities

## Troubleshooting

### "Identity not found"
- Identity may not be registered
- Check identity ID is correct
- Wait for activation delay if newly created

### "Identity is not active"
- Status may be: Pending, Suspended, Revoked, or Expired
- Check `getidentitystatus` for details
- Contact verifier if suspended

### "Nullifier already used"
- You already claimed for this epoch
- Wait for next epoch
- Check `getubiinfo` for claim history

### "Failed to create claim"
- Wallet may not have identity secrets
- Try recreating identity
- Check wallet is unlocked

## See Also

- [UBI System Explained](UBI_EXPLAINED.md)
- [UBI System Technical](UBI_SYSTEM.md)
- [Commands Reference](COMMANDS.md)
- [Whitepaper](WHITEPAPER.md)
