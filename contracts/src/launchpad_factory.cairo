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
    /// Optional image URL (can be IPFS or HTTP URL encoded as short string)
    pub image_uri: felt252,
    /// Optional Twitter handle (without @)
    pub twitter: felt252,
    /// Optional website URL
    pub website: felt252,
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

    /// Gets the bonding curve address of a launch by token ID
    fn get_launch(self: @TContractState, token_id: u256) -> ContractAddress;

    /// Gets the token address of a launch by token ID
    fn get_token_address(self: @TContractState, token_id: u256) -> ContractAddress;

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
        storage::{StoragePointerReadAccess, StoragePointerWriteAccess, Map, StorageMapReadAccess, StorageMapWriteAccess}
    };
    use core::num::traits::Zero;

    #[storage]
    struct Storage {
        /// Contract owner (for admin functions)
        owner: ContractAddress,
        /// Class hash of the TokenLaunchpad contract to deploy
        launchpad_class_hash: felt252,
        /// Class hash of the PrivacyToken contract to deploy
        token_class_hash: felt252,
        /// Class hash of the BondingCurve contract to deploy
        bonding_curve_class_hash: felt252,
        /// Total number of token launches created
        total_launches: u256,
        /// Mapping: token_id => launchpad_address (bonding curve)
        launches: Map::<u256, ContractAddress>,
        /// Mapping: token_id => token_address
        token_addresses: Map::<u256, ContractAddress>,
        /// Mapping: (creator_address, index) => launchpad_address
        creator_launches: Map::<(ContractAddress, u256), ContractAddress>,
        /// Mapping: creator_address => number of launches
        creator_launch_count: Map::<ContractAddress, u256>,
        /// Garaga verifier contract address for ZK proof verification
        garaga_verifier: ContractAddress,
        /// Payment token (ETH on Starknet)
        payment_token: ContractAddress,
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
        #[key]
        pub token_address: ContractAddress,
        pub creator_commitment: felt252,
        pub curve_type: u8,
        pub name: felt252,
        pub symbol: felt252,
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
        token_class_hash: felt252,
        bonding_curve_class_hash: felt252,
        garaga_verifier: ContractAddress,
        payment_token: ContractAddress,
    ) {
        self.owner.write(owner);
        self.token_class_hash.write(token_class_hash);
        self.bonding_curve_class_hash.write(bonding_curve_class_hash);
        self.launchpad_class_hash.write(bonding_curve_class_hash); // For backwards compatibility
        self.garaga_verifier.write(garaga_verifier);
        self.payment_token.write(payment_token);
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
            let garaga_verifier = self.garaga_verifier.read();
            let payment_token = self.payment_token.read();

            // TODO: Integrate Garaga verifier to validate creator_proof
            // This proves the creator's identity without revealing their address
            // assert!(verify_creator_proof(garaga_verifier, creator_proof, config.metadata.creator_commitment), "Invalid creator proof");

            // Validate bonding curve parameters
            self._validate_curve_params(@config.curve_params);

            // Get next token ID
            let token_id = self.total_launches.read() + 1;

            // ============ Step 1: Deploy PrivacyToken ============
            let mut token_calldata = ArrayTrait::new();
            // PrivacyToken constructor: (name, symbol, initial_supply, recipient, garaga_verifier)
            token_calldata.append(config.name);
            token_calldata.append(config.symbol);
            // initial_supply as u256 (low, high)
            token_calldata.append(config.curve_params.initial_supply.low.into());
            token_calldata.append(config.curve_params.initial_supply.high.into());
            // recipient - the bonding curve will be the recipient, but we deploy it later
            // For now, tokens go to this factory, then transferred to bonding curve
            token_calldata.append(starknet::get_contract_address().into());
            // garaga_verifier
            token_calldata.append(garaga_verifier.into());

            let token_class_hash: ClassHash = self.token_class_hash.read().try_into().unwrap();
            let token_salt: felt252 = (token_id.low * 2).into(); // Unique salt for token
            let (token_address, _) = deploy_syscall(
                token_class_hash, token_salt, token_calldata.span(), false
            )
                .unwrap();

            // ============ Step 2: Deploy BondingCurve ============
            let mut curve_calldata = ArrayTrait::new();
            // BondingCurve constructor:
            // (token_address, payment_token, curve_type, base_price, slope, k_param,
            //  max_price, initial_supply, graduation_threshold, creator_commitment, garaga_verifier)

            // token_address
            curve_calldata.append(token_address.into());
            // payment_token (ETH)
            curve_calldata.append(payment_token.into());
            // curve_type (u8)
            curve_calldata.append(config.curve_params.curve_type.into());
            // base_price (u256 = low, high)
            curve_calldata.append(config.curve_params.base_price.low.into());
            curve_calldata.append(config.curve_params.base_price.high.into());
            // slope (u256)
            curve_calldata.append(config.curve_params.slope.low.into());
            curve_calldata.append(config.curve_params.slope.high.into());
            // k_param (u256)
            curve_calldata.append(config.curve_params.k_param.low.into());
            curve_calldata.append(config.curve_params.k_param.high.into());
            // max_price (u256)
            curve_calldata.append(config.curve_params.max_price.low.into());
            curve_calldata.append(config.curve_params.max_price.high.into());
            // initial_supply (u256)
            curve_calldata.append(config.curve_params.initial_supply.low.into());
            curve_calldata.append(config.curve_params.initial_supply.high.into());
            // graduation_threshold (u256)
            curve_calldata.append(config.curve_params.graduation_threshold.low.into());
            curve_calldata.append(config.curve_params.graduation_threshold.high.into());
            // creator_commitment
            curve_calldata.append(config.metadata.creator_commitment);
            // garaga_verifier
            curve_calldata.append(garaga_verifier.into());

            let curve_class_hash: ClassHash = self.bonding_curve_class_hash.read().try_into().unwrap();
            let curve_salt: felt252 = (token_id.low * 2 + 1).into(); // Unique salt for curve
            let (bonding_curve_address, _) = deploy_syscall(
                curve_class_hash, curve_salt, curve_calldata.span(), false
            )
                .unwrap();

            // ============ Step 3: Transfer tokens to BondingCurve ============
            // The bonding curve needs to hold the initial supply for selling
            // This requires calling transfer on the token - will be done via approve mechanism
            // The bonding curve should be able to sell tokens from its balance

            // Store launch mappings
            self.launches.write(token_id, bonding_curve_address);
            self.token_addresses.write(token_id, token_address);

            // Store creator mapping
            let creator_index = self.creator_launch_count.read(caller);
            self.creator_launches.write((caller, creator_index), bonding_curve_address);
            self.creator_launch_count.write(caller, creator_index + 1);

            // Increment total launches
            self.total_launches.write(token_id);

            // Emit event with full details
            self
                .emit(
                    LaunchCreated {
                        token_id,
                        launchpad_address: bonding_curve_address,
                        token_address,
                        creator_commitment: config.metadata.creator_commitment,
                        curve_type: config.curve_params.curve_type,
                        name: config.name,
                        symbol: config.symbol,
                        timestamp: get_block_timestamp(),
                    }
                );

            bonding_curve_address
        }

        fn get_launch(self: @ContractState, token_id: u256) -> ContractAddress {
            self.launches.read(token_id)
        }

        fn get_token_address(self: @ContractState, token_id: u256) -> ContractAddress {
            self.token_addresses.read(token_id)
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
