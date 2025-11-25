// ZumpFun Main Circuit Module
// Common utilities, constants, and helper functions for all circuits
// Includes: contribution, eligibility, allocation, and disclosure circuits

use dep::std;

// Re-export circuit modules
mod contribution;
mod eligibility;
mod allocation;
mod disclosure;

// Maximum contribution amount (2^64 - 1)
global MAX_CONTRIBUTION: Field = 18446744073709551615;

// Minimum contribution amount
global MIN_CONTRIBUTION: Field = 1;

// Merkle tree depth for eligibility proofs
global MERKLE_TREE_DEPTH: u32 = 20;

// Number of disclosed fields for selective disclosure
global MAX_DISCLOSED_FIELDS: u32 = 10;

// Pedersen hash constants
global PEDERSEN_DOMAIN_SEPARATOR: Field = 0x0;

/// Pedersen commitment helper
/// Commits to a value with a blinding factor
/// commitment = hash(value || blinding)
pub fn pedersen_commit(value: Field, blinding: Field) -> Field {
    let mut inputs = [0; 2];
    inputs[0] = value;
    inputs[1] = blinding;
    std::hash::pedersen_hash(inputs)
}

/// Verify a Pedersen commitment
pub fn verify_commitment(value: Field, blinding: Field, commitment: Field) -> bool {
    let computed = pedersen_commit(value, blinding);
    computed == commitment
}

/// Range check: ensures value is within [min, max]
/// Uses bit decomposition for efficient range proofs
pub fn range_check(value: Field, min: Field, max: Field) -> bool {
    // Check lower bound
    let above_min = value as u64 >= min as u64;

    // Check upper bound
    let below_max = value as u64 <= max as u64;

    above_min & below_max
}

/// Hash array of fields using Pedersen hash
pub fn hash_array<N>(arr: [Field; N]) -> Field {
    std::hash::pedersen_hash(arr)
}

/// Calculate proportion: (numerator / denominator) * multiplier
/// Used for allocation calculations with fixed-point arithmetic
pub fn calculate_proportion(numerator: Field, denominator: Field, multiplier: Field) -> Field {
    // Using field arithmetic for division
    // result = (numerator * multiplier) / denominator
    let scaled = numerator * multiplier;

    // Note: In production, implement proper fixed-point division
    // This is a simplified version
    assert(denominator != 0);
    scaled / denominator
}

/// Verify Merkle tree membership
/// Proves that a leaf exists in a Merkle tree with given root
pub fn verify_merkle_proof<N>(
    leaf: Field,
    path: [Field; N],
    indices: [u1; N],
    root: Field
) -> bool {
    let mut current = leaf;

    for i in 0..N {
        let path_element = path[i];
        let index = indices[i];

        // If index is 0, current is left child, otherwise right child
        let left = if index == 0 { current } else { path_element };
        let right = if index == 0 { path_element } else { current };

        // Hash the pair
        let hash_input = [left, right];
        current = std::hash::pedersen_hash(hash_input);
    }

    current == root
}

/// Generate nullifier for preventing double-spending
/// nullifier = hash(secret || commitment)
pub fn generate_nullifier(secret: Field, commitment: Field) -> Field {
    let inputs = [secret, commitment];
    std::hash::pedersen_hash(inputs)
}

/// Verify nullifier
pub fn verify_nullifier(secret: Field, commitment: Field, nullifier: Field) -> bool {
    let computed = generate_nullifier(secret, commitment);
    computed == nullifier
}

/// Bit decomposition helper for range proofs
/// Decomposes a field element into bits
pub fn to_bits<N>(value: Field) -> [u1; N] {
    value.to_le_bits(N)
}

/// Reconstruct field element from bits
pub fn from_bits<N>(bits: [u1; N]) -> Field {
    let mut result: Field = 0;
    let mut power: Field = 1;

    for i in 0..N {
        if bits[i] == 1 {
            result = result + power;
        }
        power = power * 2;
    }

    result
}

#[test]
fn test_pedersen_commit() {
    let value = 100;
    let blinding = 42;
    let commitment = pedersen_commit(value, blinding);

    assert(verify_commitment(value, blinding, commitment));
}

#[test]
fn test_range_check() {
    assert(range_check(50, 0, 100));
    assert(range_check(0, 0, 100));
    assert(range_check(100, 0, 100));
}

#[test]
fn test_calculate_proportion() {
    let numerator = 25;
    let denominator = 100;
    let multiplier = 1000;
    let result = calculate_proportion(numerator, denominator, multiplier);

    // 25/100 * 1000 = 250
    assert(result == 250);
}

#[test]
fn test_nullifier() {
    let secret = 12345;
    let commitment = 67890;
    let nullifier = generate_nullifier(secret, commitment);

    assert(verify_nullifier(secret, commitment, nullifier));
}
