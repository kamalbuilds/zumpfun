// SPDX-License-Identifier: MIT
// ZumpFun Token Distributor Contract
// Handles privacy-preserving token distribution and claiming with ZK proofs

use starknet::ContractAddress;

/// Vesting schedule for token distribution
#[derive(Drop, Serde, starknet::Store)]
pub struct VestingSchedule {
    /// Total amount to be vested
    pub total_amount: u256,
    /// Amount already claimed
    pub claimed_amount: u256,
    /// Vesting start timestamp
    pub start_time: u64,
    /// Vesting duration in seconds
    pub duration: u64,
    /// Cliff period in seconds
    pub cliff: u64,
}

/// Distribution merkle tree for whitelist
#[derive(Drop, Serde, starknet::Store)]
pub struct DistributionTree {
    /// Merkle root of allocation tree
    pub merkle_root: felt252,
    /// Total allocated amount
    pub total_allocated: u256,
    /// Number of recipients
    pub recipient_count: u256,
}

#[starknet::interface]
pub trait ITokenDistributor<TContractState> {
    /// Claim tokens with ZK proof of allocation
    ///
    /// # Arguments
    /// * `claim_proof` - ZK proof of allocation in merkle tree
    /// * `amount` - Amount to claim
    /// * `nullifier` - Nullifier to prevent double-claiming
    /// * `commitment` - New balance commitment
    ///
    /// # Returns
    /// * Success boolean
    fn claim_tokens(
        ref self: TContractState,
        claim_proof: Span<felt252>,
        amount: u256,
        nullifier: felt252,
        commitment: felt252,
    ) -> bool;

    /// Claim vested tokens with ZK proof
    ///
    /// # Arguments
    /// * `vesting_proof` - ZK proof of vesting schedule ownership
    /// * `amount` - Amount to claim (must be <= vested amount)
    /// * `nullifier` - Nullifier to prevent double-claiming
    ///
    /// # Returns
    /// * Success boolean
    fn claim_vested(
        ref self: TContractState,
        vesting_proof: Span<felt252>,
        amount: u256,
        nullifier: felt252,
    ) -> bool;

    /// Get total allocated tokens
    fn get_total_allocated(self: @TContractState) -> u256;

    /// Get total claimed tokens
    fn get_total_claimed(self: @TContractState) -> u256;

    /// Get merkle root for allocation verification
    fn get_merkle_root(self: @TContractState) -> felt252;

    /// Check if nullifier has been used
    fn is_nullifier_used(self: @TContractState, nullifier: felt252) -> bool;

    /// Get claimable amount (requires proof generation client-side)
    /// This returns encrypted commitment, not actual amount
    fn get_claimable_commitment(self: @TContractState, account_hash: felt252) -> felt252;

    /// Admin: Set new merkle root for distribution
    fn set_merkle_root(ref self: TContractState, new_root: felt252, total_amount: u256);

    /// Admin: Emergency withdrawal (multisig)
    fn emergency_withdraw(ref self: TContractState, recipient: ContractAddress, amount: u256);

    /// Check if distribution is active
    fn is_active(self: @TContractState) -> bool;

    /// Activate distribution
    fn activate(ref self: TContractState);

    /// Deactivate distribution
    fn deactivate(ref self: TContractState);
}

#[starknet::contract]
pub mod TokenDistributor {
    use super::{
        ITokenDistributor, VestingSchedule, DistributionTree, ContractAddress
    };
    use starknet::{
        get_caller_address, get_block_timestamp, get_contract_address,
        storage::{StoragePointerReadAccess, StoragePointerWriteAccess, Map, StorageMapReadAccess, StorageMapWriteAccess}
    };
    use core::num::traits::Zero;

    #[storage]
    struct Storage {
        /// Token contract address
        token_address: ContractAddress,
        /// Distribution parameters
        merkle_root: felt252,
        total_allocated: u256,
        total_claimed: u256,
        recipient_count: u256,
        /// Nullifier set (prevent double-claiming)
        used_nullifiers: Map::<felt252, bool>,
        /// Commitment tracking
        commitments: Map::<felt252, bool>,
        /// Vesting schedules (by commitment)
        vesting_schedules: Map::<felt252, VestingSchedule>,
        /// Distribution active flag
        active: bool,
        /// Admin addresses (multisig)
        owner: ContractAddress,
        /// Garaga verifier for ZK proof verification
        garaga_verifier: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        TokensClaimed: TokensClaimed,
        VestedClaimed: VestedClaimed,
        MerkleRootUpdated: MerkleRootUpdated,
        DistributionActivated: DistributionActivated,
        DistributionDeactivated: DistributionDeactivated,
        EmergencyWithdrawal: EmergencyWithdrawal,
    }

    #[derive(Drop, starknet::Event)]
    pub struct TokensClaimed {
        #[key]
        pub nullifier: felt252,
        #[key]
        pub commitment: felt252,
        pub amount: u256,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct VestedClaimed {
        #[key]
        pub nullifier: felt252,
        pub amount: u256,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct MerkleRootUpdated {
        pub old_root: felt252,
        pub new_root: felt252,
        pub total_amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct DistributionActivated {
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct DistributionDeactivated {
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct EmergencyWithdrawal {
        #[key]
        pub recipient: ContractAddress,
        pub amount: u256,
        pub timestamp: u64,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        token_address: ContractAddress,
        merkle_root: felt252,
        total_allocated: u256,
        recipient_count: u256,
        owner: ContractAddress,
        garaga_verifier: ContractAddress,
    ) {
        self.token_address.write(token_address);
        self.merkle_root.write(merkle_root);
        self.total_allocated.write(total_allocated);
        self.recipient_count.write(recipient_count);
        self.owner.write(owner);
        self.garaga_verifier.write(garaga_verifier);
        self.total_claimed.write(0);
        self.active.write(false);
    }

    #[abi(embed_v0)]
    impl TokenDistributorImpl of ITokenDistributor<ContractState> {
        fn claim_tokens(
            ref self: ContractState,
            claim_proof: Span<felt252>,
            amount: u256,
            nullifier: felt252,
            commitment: felt252,
        ) -> bool {
            // Check distribution is active
            assert!(self.active.read(), "Distribution not active");

            // Check nullifier not used
            assert!(!self.used_nullifiers.read(nullifier), "Already claimed");

            // Check commitment not used
            assert!(!self.commitments.read(commitment), "Commitment already exists");

            // Check sufficient allocation remaining
            let total_allocated = self.total_allocated.read();
            let total_claimed = self.total_claimed.read();
            assert!(total_claimed + amount <= total_allocated, "Insufficient allocation");

            // TODO: Verify claim_proof using Garaga
            // This proves:
            // 1. Claimer is in the merkle tree (whitelist)
            // 2. Amount is <= their allocation
            // 3. Nullifier is correctly computed
            // 4. Commitment is valid for new balance
            // let verifier = self.garaga_verifier.read();
            // let merkle_root = self.merkle_root.read();
            // assert!(verify_claim_proof(verifier, claim_proof, merkle_root, amount, nullifier, commitment), "Invalid claim proof");

            // Mark nullifier as used
            self.used_nullifiers.write(nullifier, true);

            // Store commitment
            self.commitments.write(commitment, true);

            // Update total claimed
            self.total_claimed.write(total_claimed + amount);

            // TODO: Transfer tokens to claimer
            // This would call token.transfer() or shield directly to commitment
            // For privacy, tokens should be shielded immediately
            // let token = self.token_address.read();
            // IPrivacyToken(token).shield(amount, commitment);

            // Emit event
            self
                .emit(
                    TokensClaimed {
                        nullifier, commitment, amount, timestamp: get_block_timestamp()
                    }
                );

            true
        }

        fn claim_vested(
            ref self: ContractState,
            vesting_proof: Span<felt252>,
            amount: u256,
            nullifier: felt252,
        ) -> bool {
            // Check distribution is active
            assert!(self.active.read(), "Distribution not active");

            // Check nullifier not used for this claim
            assert!(!self.used_nullifiers.read(nullifier), "Nullifier already used");

            // TODO: Verify vesting_proof using Garaga
            // This proves:
            // 1. Claimer has a vesting schedule
            // 2. Current time >= cliff + start_time
            // 3. Amount is <= vested amount - already claimed
            // 4. Nullifier is correctly computed
            // let verifier = self.garaga_verifier.read();
            // assert!(verify_vesting_proof(verifier, vesting_proof, amount, nullifier, get_block_timestamp()), "Invalid vesting proof");

            // Mark nullifier as used
            self.used_nullifiers.write(nullifier, true);

            // Update total claimed
            self.total_claimed.write(self.total_claimed.read() + amount);

            // TODO: Transfer vested tokens
            // let token = self.token_address.read();
            // IPrivacyToken(token).transfer(get_caller_address(), amount);

            // Emit event
            self
                .emit(
                    VestedClaimed { nullifier, amount, timestamp: get_block_timestamp() }
                );

            true
        }

        fn get_total_allocated(self: @ContractState) -> u256 {
            self.total_allocated.read()
        }

        fn get_total_claimed(self: @ContractState) -> u256 {
            self.total_claimed.read()
        }

        fn get_merkle_root(self: @ContractState) -> felt252 {
            self.merkle_root.read()
        }

        fn is_nullifier_used(self: @ContractState, nullifier: felt252) -> bool {
            self.used_nullifiers.read(nullifier)
        }

        fn get_claimable_commitment(self: @ContractState, account_hash: felt252) -> felt252 {
            // This would return an encrypted commitment that only the account holder can decrypt
            // The actual claimable amount is computed client-side with ZK proof
            // For now, return placeholder
            account_hash // Simplified
        }

        fn set_merkle_root(ref self: ContractState, new_root: felt252, total_amount: u256) {
            self._assert_only_owner();

            let old_root = self.merkle_root.read();
            self.merkle_root.write(new_root);
            self.total_allocated.write(total_amount);

            self.emit(MerkleRootUpdated { old_root, new_root, total_amount });
        }

        fn emergency_withdraw(
            ref self: ContractState, recipient: ContractAddress, amount: u256
        ) {
            self._assert_only_owner();

            // TODO: Transfer tokens to recipient
            // let token = self.token_address.read();
            // IPrivacyToken(token).transfer(recipient, amount);

            self
                .emit(
                    EmergencyWithdrawal { recipient, amount, timestamp: get_block_timestamp() }
                );
        }

        fn is_active(self: @ContractState) -> bool {
            self.active.read()
        }

        fn activate(ref self: ContractState) {
            self._assert_only_owner();
            self.active.write(true);
            self.emit(DistributionActivated { timestamp: get_block_timestamp() });
        }

        fn deactivate(ref self: ContractState) {
            self._assert_only_owner();
            self.active.write(false);
            self.emit(DistributionDeactivated { timestamp: get_block_timestamp() });
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// Ensures caller is the contract owner
        fn _assert_only_owner(self: @ContractState) {
            let caller = get_caller_address();
            assert!(caller == self.owner.read(), "Caller is not owner");
        }

        /// Calculate vested amount based on schedule and current time
        fn _calculate_vested_amount(
            self: @ContractState, schedule: @VestingSchedule, current_time: u64
        ) -> u256 {
            let start = *schedule.start_time;
            let duration = *schedule.duration;
            let cliff = *schedule.cliff;
            let total = *schedule.total_amount;
            let claimed = *schedule.claimed_amount;

            // Before cliff, nothing vested
            if current_time < start + cliff {
                return 0;
            }

            // After duration, everything vested
            if current_time >= start + duration {
                return total - claimed;
            }

            // Linear vesting between cliff and end
            let elapsed = current_time - start;
            let vested_total = (total * elapsed.into()) / duration.into();
            vested_total - claimed
        }
    }
}
