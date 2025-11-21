// ZumpFun - Main Noir Circuit
// Zero-knowledge proof circuits for anonymous token creation

use dep::std;

// Main circuit for anonymous token creation proof
fn main(
    // Private inputs (hidden from verifier)
    creator_secret: Field,
    randomness: Field,

    // Public inputs (visible to verifier)
    commitment: pub Field,
    nullifier: pub Field,
) {
    // 1. Verify commitment
    // commitment = hash(creator_secret, randomness)
    let computed_commitment = std::hash::pedersen_hash([creator_secret, randomness]);
    assert(commitment == computed_commitment);

    // 2. Verify nullifier uniqueness
    // nullifier = hash(creator_secret, 0)
    let computed_nullifier = std::hash::pedersen_hash([creator_secret, 0]);
    assert(nullifier == computed_nullifier);

    // 3. Range checks (ensure values are within valid range)
    assert(creator_secret != 0);
    assert(randomness != 0);
}

// Helper function for commitment generation
fn generate_commitment(secret: Field, randomness: Field) -> Field {
    std::hash::pedersen_hash([secret, randomness])
}

// Helper function for nullifier generation
fn generate_nullifier(secret: Field) -> Field {
    std::hash::pedersen_hash([secret, 0])
}

#[test]
fn test_commitment_generation() {
    let secret = 12345;
    let randomness = 67890;
    let commitment = generate_commitment(secret, randomness);
    assert(commitment != 0);
}

#[test]
fn test_nullifier_generation() {
    let secret = 12345;
    let nullifier = generate_nullifier(secret);
    assert(nullifier != 0);
}
