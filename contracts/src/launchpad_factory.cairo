// SPDX-License-Identifier: MIT
// ZumpFun Launchpad Factory Contract
// Deploys new token launches with privacy-preserving features

use starknet::ContractAddress;

/// Configuration parameters for bonding curve
#[derive(Drop, Serde, starknet::Store)]
pub struct BondingCurveParams {
    /// Curve type: 0=linear, 1=exponential, 2=sigmoid
    pub curve_type: u8,
    /// Base price in wei
    pub base_price: u256,
    /// Price growth slope
    pub slope: u256,
    /// Growth rate parameter for exponential/sigmoid curves
    pub k_param: u256,
    /// Maximum price cap
    pub max_price: u256,
    /// Total supply for launch
    pub initial_supply: u256,
    /// Supply threshold for graduation to AMM (e.g., 800M tokens)
    pub graduation_threshold: u256,
}

/// Launch metadata stored off-chain
#[derive(Drop, Serde)]
pub struct LaunchMetadata {
    /// IPFS hash of token metadata
    pub metadata_uri: felt252,
    /// Creator commitment (ZK proof of identity)
    pub creator_commitment: felt252,
    /// Launch start timestamp
    pub launch_start: u64,
    /// Launch end timestamp (0 = no end)
    pub launch_end: u64,
}

/// Configuration for a new token launch
#[derive(Drop, Serde)]
pub struct LaunchConfig {
    /// Token name
    pub name: felt252,
    /// Token symbol
    pub symbol: felt252,
    /// Bonding curve parameters
    pub curve_params: BondingCurveParams,
    /// Metadata
    pub metadata: LaunchMetadata,
}

#[starknet::interface]
pub trait ILaunchpadFactory<TContractState> {
    /// Creates a new token launch with privacy features
    ///
    /// # Arguments
    /// * `config` - Launch configuration parameters
    /// * `creator_proof` - ZK proof of creator identity (Garaga verified)
    ///
    /// # Returns
    /// * Address of the deployed token launchpad contract
    fn create_launch(
        ref self: TContractState,
        config: LaunchConfig,
        creator_proof: Span<felt252>,
    ) -> ContractAddress;

    /// Gets the address of a launch by token ID
    fn get_launch(self: @TContractState, token_id: u256) -> ContractAddress;

    /// Gets total number of launches created
    fn get_total_launches(self: @TContractState) -> u256;

    /// Gets the launchpad class hash for deployments
    fn get_launchpad_class_hash(self: @TContractState) -> felt252;

    /// Updates the launchpad implementation class hash (owner only)
    fn set_launchpad_class_hash(ref self: TContractState, new_class_hash: felt252);

    /// Gets the Garaga verifier address
    fn get_verifier_address(self: @TContractState) -> ContractAddress;

    /// Updates the Garaga verifier address (owner only)
    fn set_verifier_address(ref self: TContractState, new_verifier: ContractAddress);

    /// Emergency pause (owner only)
    fn pause(ref self: TContractState);

    /// Resume from pause (owner only)
    fn unpause(ref self: TContractState);

    /// Check if factory is paused
    fn is_paused(self: @TContractState) -> bool;
}

#[starknet::contract]
pub mod LaunchpadFactory {
    use super::{
        ILaunchpadFactory, LaunchConfig, BondingCurveParams, LaunchMetadata, ContractAddress
    };
    use starknet::{
        get_caller_address, get_block_timestamp, ClassHash, syscalls::deploy_syscall,
        storage::{StoragePointerReadAccess, StoragePointerWriteAccess}
    };
    use core::num::traits::Zero;

    #[storage]
    struct Storage {
        /// Contract owner (for admin functions)
        owner: ContractAddress,
        /// Class hash of the TokenLaunchpad contract to deploy
        launchpad_class_hash: felt252,
        /// Total number of token launches created
        total_launches: u256,
        /// Mapping: token_id => launchpad_address
        launches: LegacyMap<u256, ContractAddress>,
        /// Mapping: (creator_address, index) => launchpad_address
        creator_launches: LegacyMap<(ContractAddress, u256), ContractAddress>,
        /// Mapping: creator_address => number of launches
        creator_launch_count: LegacyMap<ContractAddress, u256>,
        /// Garaga verifier contract address for ZK proof verification
        garaga_verifier: ContractAddress,
        /// Emergency pause flag
        paused: bool,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        LaunchCreated: LaunchCreated,
        LaunchpadClassHashUpdated: LaunchpadClassHashUpdated,
        VerifierUpdated: VerifierUpdated,
        Paused: Paused,
        Unpaused: Unpaused,
    }

    #[derive(Drop, starknet::Event)]
    pub struct LaunchCreated {
        #[key]
        pub token_id: u256,
        #[key]
        pub launchpad_address: ContractAddress,
        pub creator_commitment: felt252,
        pub curve_type: u8,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct LaunchpadClassHashUpdated {
        pub old_class_hash: felt252,
        pub new_class_hash: felt252,
    }

    #[derive(Drop, starknet::Event)]
    pub struct VerifierUpdated {
        pub old_verifier: ContractAddress,
        pub new_verifier: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Paused {
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Unpaused {
        pub timestamp: u64,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        launchpad_class_hash: felt252,
        garaga_verifier: ContractAddress,
    ) {
        self.owner.write(owner);
        self.launchpad_class_hash.write(launchpad_class_hash);
        self.garaga_verifier.write(garaga_verifier);
        self.total_launches.write(0);
        self.paused.write(false);
    }

    #[abi(embed_v0)]
    impl LaunchpadFactoryImpl of ILaunchpadFactory<ContractState> {
        fn create_launch(
            ref self: ContractState,
            config: LaunchConfig,
            creator_proof: Span<felt252>,
        ) -> ContractAddress {
            // Check not paused
            assert!(!self.paused.read(), "Factory is paused");

            let caller = get_caller_address();

            // TODO: Integrate Garaga verifier to validate creator_proof
            // This proves the creator's identity without revealing their address
            // let verifier = self.garaga_verifier.read();
            // assert!(verify_creator_proof(verifier, creator_proof, config.metadata.creator_commitment), "Invalid creator proof");

            // Validate bonding curve parameters
            self._validate_curve_params(@config.curve_params);

            // Get next token ID
            let token_id = self.total_launches.read() + 1;

            // Prepare constructor calldata for TokenLaunchpad
            let mut calldata = ArrayTrait::new();
            // TODO: Add proper serialization of config parameters
            // For now, using placeholder values
            calldata.append(config.name);
            calldata.append(config.symbol);
            calldata.append(config.metadata.creator_commitment);

            // Deploy TokenLaunchpad contract using CREATE2-like deterministic deployment
            let class_hash: ClassHash = self.launchpad_class_hash.read().try_into().unwrap();
            let contract_address_salt = token_id.try_into().unwrap(); // Use token_id as salt
            let (launchpad_address, _) = deploy_syscall(
                class_hash, contract_address_salt, calldata.span(), false
            )
                .unwrap();

            // Store launch mapping
            self.launches.write(token_id, launchpad_address);

            // Store creator mapping
            let creator_index = self.creator_launch_count.read(caller);
            self.creator_launches.write((caller, creator_index), launchpad_address);
            self.creator_launch_count.write(caller, creator_index + 1);

            // Increment total launches
            self.total_launches.write(token_id);

            // Emit event
            self
                .emit(
                    LaunchCreated {
                        token_id,
                        launchpad_address,
                        creator_commitment: config.metadata.creator_commitment,
                        curve_type: config.curve_params.curve_type,
                        timestamp: get_block_timestamp(),
                    }
                );

            launchpad_address
        }

        fn get_launch(self: @ContractState, token_id: u256) -> ContractAddress {
            self.launches.read(token_id)
        }

        fn get_total_launches(self: @ContractState) -> u256 {
            self.total_launches.read()
        }

        fn get_launchpad_class_hash(self: @ContractState) -> felt252 {
            self.launchpad_class_hash.read()
        }

        fn set_launchpad_class_hash(ref self: ContractState, new_class_hash: felt252) {
            self._assert_only_owner();
            let old_class_hash = self.launchpad_class_hash.read();
            self.launchpad_class_hash.write(new_class_hash);
            self.emit(LaunchpadClassHashUpdated { old_class_hash, new_class_hash });
        }

        fn get_verifier_address(self: @ContractState) -> ContractAddress {
            self.garaga_verifier.read()
        }

        fn set_verifier_address(ref self: ContractState, new_verifier: ContractAddress) {
            self._assert_only_owner();
            let old_verifier = self.garaga_verifier.read();
            self.garaga_verifier.write(new_verifier);
            self.emit(VerifierUpdated { old_verifier, new_verifier });
        }

        fn pause(ref self: ContractState) {
            self._assert_only_owner();
            self.paused.write(true);
            self.emit(Paused { timestamp: get_block_timestamp() });
        }

        fn unpause(ref self: ContractState) {
            self._assert_only_owner();
            self.paused.write(false);
            self.emit(Unpaused { timestamp: get_block_timestamp() });
        }

        fn is_paused(self: @ContractState) -> bool {
            self.paused.read()
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// Ensures caller is the contract owner
        fn _assert_only_owner(self: @ContractState) {
            let caller = get_caller_address();
            assert!(caller == self.owner.read(), "Caller is not owner");
        }

        /// Validates bonding curve parameters
        fn _validate_curve_params(self: @ContractState, params: @BondingCurveParams) {
            // Validate curve type
            assert!(*params.curve_type <= 2, "Invalid curve type");

            // Validate prices
            assert!(*params.base_price > 0, "Base price must be positive");
            assert!(*params.max_price >= *params.base_price, "Max price < base price");

            // Validate supply
            assert!(*params.initial_supply > 0, "Initial supply must be positive");
            assert!(
                *params.graduation_threshold > 0
                    && *params.graduation_threshold <= *params.initial_supply,
                "Invalid graduation threshold"
            );

            // For sigmoid curves, ensure k_param is reasonable
            if *params.curve_type == 2 {
                assert!(*params.k_param > 0, "k_param must be positive for sigmoid");
            }
        }
    }
}
