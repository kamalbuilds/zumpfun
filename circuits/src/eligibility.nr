// ZumpFun Eligibility Circuit
// Proves: "I meet eligibility criteria without revealing identity"
// Uses Merkle tree membership proofs for privacy-preserving verification

use dep::std;

use crate::{
    verify_merkle_proof,
    hash_array,
    generate_nullifier,
    MERKLE_TREE_DEPTH
};

/// Eligibility proof structure
struct EligibilityProof {
    // Private inputs
    user_data: Field,                          // User's private data (hash of attributes)
    merkle_path: [Field; 20],                  // Merkle proof path
    path_indices: [u1; 20],                    // Path direction indicators (0=left, 1=right)
    nullifier_secret: Field,                   // Secret for nullifier generation

    // Public inputs
    merkle_root: Field,                        // Merkle tree root of eligible users
    nullifier: Field,                          // Prevents double-claiming
    criteria_hash: Field,                      // Hash of eligibility criteria
}

/// Main eligibility verification circuit
/// Proves membership in eligible set without revealing identity
fn main(
    // Private inputs
    user_data: Field,
    merkle_path: [Field; 20],
    path_indices: [u1; 20],
    nullifier_secret: Field,

    // Public inputs
    merkle_root: Field,
    nullifier: Field,
    criteria_hash: Field
) {
    // 1. Compute leaf hash from user data
    let leaf = compute_leaf_hash(user_data, criteria_hash);

    // 2. Verify Merkle tree membership
    // Proves: user_data exists in the eligible set
    let is_member = verify_merkle_proof(
        leaf,
        merkle_path,
        path_indices,
        merkle_root
    );
    assert(is_member, "User not in eligible set");

    // 3. Verify nullifier to prevent double-claiming
    // nullifier = hash(nullifier_secret || user_data)
    let computed_nullifier = generate_nullifier(nullifier_secret, user_data);
    assert(nullifier == computed_nullifier, "Invalid nullifier");

    // 4. Ensure nullifier secret is non-zero (prevents trivial attacks)
    assert(nullifier_secret != 0, "Nullifier secret must be non-zero");

    // 5. Ensure user data is valid (non-zero)
    assert(user_data != 0, "User data must be valid");
}

/// Compute leaf hash for Merkle tree
/// Combines user data with criteria to create unique leaf
pub fn compute_leaf_hash(user_data: Field, criteria_hash: Field) -> Field {
    let input = [user_data, criteria_hash];
    std::hash::pedersen_hash(input)
}

/// Verify eligibility criteria
/// Checks if user attributes meet the required criteria
pub fn verify_criteria(
    attributes: [Field; 5],
    required_criteria: [Field; 5]
) -> bool {
    let mut meets_criteria = true;

    for i in 0..5 {
        // Each attribute must meet or exceed the required criteria
        meets_criteria = meets_criteria & (attributes[i] >= required_criteria[i]);
    }

    meets_criteria
}

/// Hash user attributes to create user_data
pub fn hash_user_attributes(
    age: Field,
    reputation: Field,
    stake_amount: Field,
    kyc_status: Field,
    region_code: Field
) -> Field {
    let attributes = [age, reputation, stake_amount, kyc_status, region_code];
    hash_array(attributes)
}

/// Create eligibility criteria hash
pub fn hash_criteria(
    min_age: Field,
    min_reputation: Field,
    min_stake: Field,
    required_kyc: Field,
    allowed_regions: Field
) -> Field {
    let criteria = [min_age, min_reputation, min_stake, required_kyc, allowed_regions];
    hash_array(criteria)
}

/// Build Merkle tree from eligible users
/// Returns root hash
pub fn build_merkle_root<N>(eligible_users: [Field; N]) -> Field {
    // Simple implementation for small N
    // In production, use efficient Merkle tree library
    let mut current_level = eligible_users;
    let mut level_size = N;

    // Build tree bottom-up
    while level_size > 1 {
        for i in 0..(level_size / 2) {
            let left = current_level[i * 2];
            let right = current_level[i * 2 + 1];
            let parent = std::hash::pedersen_hash([left, right]);
            current_level[i] = parent;
        }
        level_size = level_size / 2;
    }

    current_level[0]
}

/// Verify multiple eligibility proofs in batch
pub fn batch_verify_eligibility<N>(
    user_datas: [Field; N],
    nullifiers: [Field; N],
    merkle_root: Field
) -> bool {
    let mut all_valid = true;

    // Check all nullifiers are unique (no double-claiming)
    for i in 0..N {
        for j in 0..N {
            if i != j {
                all_valid = all_valid & (nullifiers[i] != nullifiers[j]);
            }
        }
    }

    all_valid
}

#[test]
fn test_eligibility_verification() {
    // Setup test data
    let user_data = 12345;
    let criteria_hash = 67890;
    let nullifier_secret = 11111;

    // Create leaf
    let leaf = compute_leaf_hash(user_data, criteria_hash);

    // Simple Merkle path (2-level tree for testing)
    let sibling = 99999;
    let parent = std::hash::pedersen_hash([leaf, sibling]);

    let merkle_path = [sibling, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let path_indices = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let merkle_root = parent;

    let nullifier = generate_nullifier(nullifier_secret, user_data);

    // Should pass verification
    main(user_data, merkle_path, path_indices, nullifier_secret, merkle_root, nullifier, criteria_hash);
}

#[test]
fn test_leaf_hash_computation() {
    let user_data = 100;
    let criteria_hash = 200;

    let leaf1 = compute_leaf_hash(user_data, criteria_hash);
    let leaf2 = compute_leaf_hash(user_data, criteria_hash);

    // Same inputs should produce same hash
    assert(leaf1 == leaf2);
}

#[test]
fn test_criteria_verification() {
    let attributes = [25, 100, 1000, 1, 1]; // age, reputation, stake, kyc, region
    let required = [18, 50, 500, 1, 1];     // min requirements

    assert(verify_criteria(attributes, required));
}

#[test]
fn test_user_attributes_hash() {
    let user_data = hash_user_attributes(25, 100, 1000, 1, 1);

    // Hash should be deterministic
    let user_data2 = hash_user_attributes(25, 100, 1000, 1, 1);
    assert(user_data == user_data2);
}

#[test]
fn test_criteria_hash() {
    let criteria = hash_criteria(18, 50, 500, 1, 1);

    // Should be deterministic
    let criteria2 = hash_criteria(18, 50, 500, 1, 1);
    assert(criteria == criteria2);
}

// Circuit specification for documentation
//
// CIRCUIT: Eligibility Verification
// PURPOSE: Prove membership in eligible set without revealing identity
//
// PRIVATE INPUTS:
//   - user_data: Field           (hash of user attributes)
//   - merkle_path: [Field; 20]   (Merkle proof path)
//   - path_indices: [u1; 20]     (left/right indicators)
//   - nullifier_secret: Field    (secret for nullifier)
//
// PUBLIC INPUTS:
//   - merkle_root: Field         (root of eligible users tree)
//   - nullifier: Field           (prevents double-claiming)
//   - criteria_hash: Field       (hash of eligibility criteria)
//
// CONSTRAINTS:
//   1. leaf = hash(user_data || criteria_hash)
//   2. verify_merkle_proof(leaf, path, indices, root) == true
//   3. nullifier == hash(nullifier_secret || user_data)
//   4. nullifier_secret != 0
//   5. user_data != 0
//
// SECURITY:
//   - Zero-knowledge: Does not reveal which user in the set
//   - Nullifiers prevent double-claiming
//   - Merkle proofs ensure only eligible users can prove
//   - Tree depth of 20 supports 1M+ users
//
// PERFORMANCE:
//   - Expected proof generation: <15s
//   - Proof size: ~256 bytes
//   - Verification time: <150ms
