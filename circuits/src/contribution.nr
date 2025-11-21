// ZumpFun Contribution Circuit
// Proves: "I contributed X amount without revealing X"
// Uses Pedersen commitments and range proofs for privacy

use dep::std;

use crate::{
    pedersen_commit,
    verify_commitment,
    range_check,
    MIN_CONTRIBUTION,
    MAX_CONTRIBUTION
};

/// Contribution proof inputs
struct ContributionProof {
    amount: Field,           // Private: contribution amount
    blinding: Field,         // Private: commitment blinding factor
    commitment: Field,       // Public: Pedersen commitment to amount
    min_amount: Field,       // Public: minimum allowed contribution
    max_amount: Field,       // Public: maximum allowed contribution
}

/// Main contribution circuit
/// Proves valid contribution within range without revealing amount
fn main(
    // Private inputs
    amount: Field,
    blinding: Field,

    // Public inputs
    commitment: Field,
    min_amount: Field,
    max_amount: Field
) {
    // 1. Verify the commitment is correct
    // commitment = Pedersen(amount || blinding)
    let is_valid_commitment = verify_commitment(amount, blinding, commitment);
    assert(is_valid_commitment, "Invalid commitment");

    // 2. Verify amount is within valid range
    // min_amount <= amount <= max_amount
    let is_in_range = range_check(amount, min_amount, max_amount);
    assert(is_in_range, "Amount out of valid range");

    // 3. Verify amount is positive
    assert(amount >= MIN_CONTRIBUTION, "Amount must be positive");

    // 4. Verify amount doesn't exceed maximum
    assert(amount <= MAX_CONTRIBUTION, "Amount exceeds maximum");

    // 5. Additional constraint: amount must be non-zero
    assert(amount != 0, "Amount cannot be zero");
}

/// Helper function to create a contribution proof
pub fn create_contribution_proof(
    amount: Field,
    blinding: Field,
    min_amount: Field,
    max_amount: Field
) -> Field {
    // Generate commitment
    pedersen_commit(amount, blinding)
}

/// Verify contribution is within acceptable bounds
pub fn verify_contribution_bounds(amount: Field) -> bool {
    range_check(amount, MIN_CONTRIBUTION, MAX_CONTRIBUTION)
}

/// Generate a random blinding factor for commitment
/// In production, this should use secure randomness
pub fn generate_blinding(seed: Field) -> Field {
    let input = [seed, 0x1234567890abcdef];
    std::hash::pedersen_hash(input)
}

/// Batch verify multiple contributions
pub fn batch_verify_contributions<N>(
    amounts: [Field; N],
    blindings: [Field; N],
    commitments: [Field; N],
    min_amount: Field,
    max_amount: Field
) -> bool {
    let mut all_valid = true;

    for i in 0..N {
        let is_valid_commitment = verify_commitment(amounts[i], blindings[i], commitments[i]);
        let is_in_range = range_check(amounts[i], min_amount, max_amount);

        all_valid = all_valid & is_valid_commitment & is_in_range;
    }

    all_valid
}

#[test]
fn test_valid_contribution() {
    let amount = 1000;
    let blinding = 42;
    let commitment = pedersen_commit(amount, blinding);
    let min_amount = 100;
    let max_amount = 10000;

    // This should pass all assertions
    main(amount, blinding, commitment, min_amount, max_amount);
}

#[test]
fn test_contribution_proof_creation() {
    let amount = 500;
    let blinding = 12345;
    let min_amount = 100;
    let max_amount = 1000;

    let commitment = create_contribution_proof(amount, blinding, min_amount, max_amount);

    // Verify the commitment
    assert(verify_commitment(amount, blinding, commitment));
}

#[test]
fn test_contribution_bounds() {
    assert(verify_contribution_bounds(100));
    assert(verify_contribution_bounds(1000000));
}

#[test]
fn test_blinding_generation() {
    let seed1 = 123;
    let seed2 = 456;

    let blinding1 = generate_blinding(seed1);
    let blinding2 = generate_blinding(seed2);

    // Different seeds should produce different blindings
    assert(blinding1 != blinding2);
}

#[test]
fn test_batch_verification() {
    let amounts = [100, 200, 300];
    let blindings = [1, 2, 3];
    let commitments = [
        pedersen_commit(100, 1),
        pedersen_commit(200, 2),
        pedersen_commit(300, 3)
    ];

    let result = batch_verify_contributions(amounts, blindings, commitments, 50, 500);
    assert(result);
}

// Circuit specification for documentation
//
// CIRCUIT: Contribution Proof
// PURPOSE: Prove valid contribution amount without revealing the exact value
//
// PRIVATE INPUTS:
//   - amount: Field        (the contribution amount to keep private)
//   - blinding: Field      (random blinding factor for commitment)
//
// PUBLIC INPUTS:
//   - commitment: Field    (Pedersen commitment to amount)
//   - min_amount: Field    (minimum allowed contribution)
//   - max_amount: Field    (maximum allowed contribution)
//
// CONSTRAINTS:
//   1. commitment == Pedersen(amount || blinding)
//   2. min_amount <= amount <= max_amount
//   3. amount > 0
//   4. amount <= MAX_CONTRIBUTION (global constant)
//
// SECURITY:
//   - Pedersen commitments are computationally hiding and binding
//   - Range proofs prevent negative or excessive contributions
//   - Blinding factor ensures commitment privacy
//
// PERFORMANCE:
//   - Expected proof generation: <10s
//   - Proof size: ~128 bytes
//   - Verification time: <100ms
