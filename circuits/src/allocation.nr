// ZumpFun Allocation Circuit
// Proves: "My token allocation is correct based on contribution"
// Verifies proportion calculation while maintaining contribution privacy

use dep::std;

use crate::{
    verify_commitment,
    calculate_proportion,
    pedersen_commit,
    range_check,
    MIN_CONTRIBUTION,
    MAX_CONTRIBUTION
};

/// Allocation proof structure
struct AllocationProof {
    // Private inputs
    contribution: Field,                // User's contribution amount (private)
    contribution_blinding: Field,       // Blinding factor for contribution commitment

    // Public inputs
    contribution_commitment: Field,     // Commitment to contribution
    allocation: Field,                  // Calculated token allocation (public)
    total_pool: Field,                  // Total contribution pool (public)
    total_tokens: Field,                // Total tokens to distribute (public)
}

/// Main allocation verification circuit
/// Proves: allocation = (contribution / total_pool) * total_tokens
fn main(
    // Private inputs
    contribution: Field,
    contribution_blinding: Field,

    // Public inputs
    contribution_commitment: Field,
    allocation: Field,
    total_pool: Field,
    total_tokens: Field
) {
    // 1. Verify the contribution commitment
    // Ensures contribution is what user claimed
    let is_valid_commitment = verify_commitment(
        contribution,
        contribution_blinding,
        contribution_commitment
    );
    assert(is_valid_commitment, "Invalid contribution commitment");

    // 2. Verify contribution is within valid range
    let is_valid_contribution = range_check(
        contribution,
        MIN_CONTRIBUTION,
        MAX_CONTRIBUTION
    );
    assert(is_valid_contribution, "Contribution out of valid range");

    // 3. Verify total pool is non-zero
    assert(total_pool != 0, "Total pool cannot be zero");
    assert(total_pool as u64 > 0, "Total pool must be positive");

    // 4. Verify contribution doesn't exceed total pool
    assert(contribution as u64 <= total_pool as u64, "Contribution exceeds total pool");

    // 5. Calculate expected allocation
    // allocation = (contribution * total_tokens) / total_pool
    let expected_allocation = calculate_proportion(
        contribution,
        total_pool,
        total_tokens
    );

    // 6. Verify the allocation matches expected value
    assert(allocation == expected_allocation, "Incorrect allocation calculation");

    // 7. Verify allocation is non-negative
    assert(allocation as u64 >= 0, "Allocation must be non-negative");

    // 8. Verify allocation doesn't exceed total tokens
    assert(allocation as u64 <= total_tokens as u64, "Allocation exceeds total tokens");
}

/// Calculate user allocation based on contribution
pub fn calculate_allocation(
    contribution: Field,
    total_pool: Field,
    total_tokens: Field
) -> Field {
    assert(total_pool != 0, "Total pool cannot be zero");
    calculate_proportion(contribution, total_pool, total_tokens)
}

/// Verify allocation fairness across multiple users
pub fn verify_allocation_fairness<let N: u32>(
    contributions: [Field; N],
    allocations: [Field; N],
    total_pool: Field,
    total_tokens: Field
) -> bool {
    let mut sum_contributions: Field = 0;
    let mut sum_allocations: Field = 0;

    // 1. Sum all contributions and allocations
    for i in 0..N {
        sum_contributions = sum_contributions + contributions[i];
        sum_allocations = sum_allocations + allocations[i];
    }

    // 2. Verify sum of contributions equals total pool
    let pool_matches = sum_contributions == total_pool;

    // 3. Verify sum of allocations doesn't exceed total tokens
    let allocation_valid = sum_allocations as u64 <= total_tokens as u64;

    // 4. Verify each individual allocation is correct
    let mut all_correct = true;
    for i in 0..N {
        let expected = calculate_proportion(
            contributions[i],
            total_pool,
            total_tokens
        );
        all_correct = all_correct & (allocations[i] == expected);
    }

    // Use bitwise AND (Noir doesn't support short-circuiting &&)
    pool_matches & allocation_valid & all_correct
}

/// Create allocation proof with commitment
pub fn create_allocation_proof(
    contribution: Field,
    blinding: Field,
    total_pool: Field,
    total_tokens: Field
) -> (Field, Field) {
    // Generate commitment
    let commitment = pedersen_commit(contribution, blinding);

    // Calculate allocation
    let allocation = calculate_allocation(contribution, total_pool, total_tokens);

    (commitment, allocation)
}

/// Verify minimum allocation threshold
pub fn verify_minimum_allocation(
    allocation: Field,
    min_threshold: Field
) -> bool {
    allocation as u64 >= min_threshold as u64
}

/// Calculate pro-rata distribution
/// Used for proportional token distribution
pub fn calculate_prorata_share(
    user_contribution: Field,
    total_contributions: Field,
    available_amount: Field
) -> Field {
    calculate_proportion(user_contribution, total_contributions, available_amount)
}

/// Batch verify multiple allocations
pub fn batch_verify_allocations<let N: u32>(
    contributions: [Field; N],
    blindings: [Field; N],
    commitments: [Field; N],
    allocations: [Field; N],
    total_pool: Field,
    total_tokens: Field
) -> bool {
    let mut all_valid = true;

    for i in 0..N {
        // Verify commitment
        let commitment_valid = verify_commitment(
            contributions[i],
            blindings[i],
            commitments[i]
        );

        // Verify allocation
        let expected_allocation = calculate_allocation(
            contributions[i],
            total_pool,
            total_tokens
        );
        let allocation_valid = allocations[i] == expected_allocation;

        all_valid = all_valid & commitment_valid & allocation_valid;
    }

    all_valid
}

#[test]
fn test_allocation_calculation() {
    let contribution = 1000;
    let total_pool = 10000;
    let total_tokens = 100000;

    let allocation = calculate_allocation(contribution, total_pool, total_tokens);

    // 1000 / 10000 * 100000 = 10000
    assert(allocation == 10000);
}

#[test]
fn test_allocation_verification() {
    let contribution = 500;
    let blinding = 12345;
    let commitment = pedersen_commit(contribution, blinding);
    let total_pool = 5000;
    let total_tokens = 50000;

    let allocation = calculate_allocation(contribution, total_pool, total_tokens);

    // Should pass all constraints
    main(contribution, blinding, commitment, allocation, total_pool, total_tokens);
}

#[test]
fn test_allocation_fairness() {
    let contributions = [1000, 2000, 3000];
    let total_pool = 6000;
    let total_tokens = 60000;

    let allocations = [
        calculate_allocation(1000, total_pool, total_tokens),
        calculate_allocation(2000, total_pool, total_tokens),
        calculate_allocation(3000, total_pool, total_tokens)
    ];

    let is_fair = verify_allocation_fairness(
        contributions,
        allocations,
        total_pool,
        total_tokens
    );

    assert(is_fair);
}

#[test]
fn test_prorata_share() {
    let user_contribution = 250;
    let total_contributions = 1000;
    let available_amount = 10000;

    let share = calculate_prorata_share(
        user_contribution,
        total_contributions,
        available_amount
    );

    // 250 / 1000 * 10000 = 2500
    assert(share == 2500);
}

#[test]
fn test_minimum_allocation() {
    let allocation = 1000;
    let min_threshold = 500;

    assert(verify_minimum_allocation(allocation, min_threshold));
}

#[test]
fn test_batch_allocations() {
    let contributions = [100, 200, 300];
    let blindings = [1, 2, 3];
    let commitments = [
        pedersen_commit(100, 1),
        pedersen_commit(200, 2),
        pedersen_commit(300, 3)
    ];
    let total_pool = 600;
    let total_tokens = 6000;

    let allocations = [
        calculate_allocation(100, total_pool, total_tokens),
        calculate_allocation(200, total_pool, total_tokens),
        calculate_allocation(300, total_pool, total_tokens)
    ];

    let result = batch_verify_allocations(
        contributions,
        blindings,
        commitments,
        allocations,
        total_pool,
        total_tokens
    );

    assert(result);
}

// Circuit specification for documentation
//
// CIRCUIT: Token Allocation Verification
// PURPOSE: Prove correct allocation calculation while keeping contribution private
//
// PRIVATE INPUTS:
//   - contribution: Field              (user's contribution amount)
//   - contribution_blinding: Field     (blinding for commitment)
//
// PUBLIC INPUTS:
//   - contribution_commitment: Field   (commitment to contribution)
//   - allocation: Field                (calculated token allocation)
//   - total_pool: Field                (total contribution pool)
//   - total_tokens: Field              (total tokens to distribute)
//
// CONSTRAINTS:
//   1. commitment == Pedersen(contribution || blinding)
//   2. MIN_CONTRIBUTION <= contribution <= MAX_CONTRIBUTION
//   3. total_pool > 0
//   4. contribution <= total_pool
//   5. allocation == (contribution * total_tokens) / total_pool
//   6. allocation >= 0
//   7. allocation <= total_tokens
//
// SECURITY:
//   - Contribution amount remains private via commitment
//   - Allocation calculation is verifiable by all parties
//   - Prevents manipulation of allocation formulas
//   - Ensures fairness in token distribution
//
// PERFORMANCE:
//   - Expected proof generation: <12s
//   - Proof size: ~192 bytes
//   - Verification time: <120ms
//
// USE CASES:
//   - Token sales with privacy
//   - Proportional reward distribution
//   - Fair allocation in DAOs
//   - Private equity distributions
