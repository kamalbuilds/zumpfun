// SPDX-License-Identifier: MIT
// ZumpFun Bonding Curve Contract
// Implements sigmoid bonding curve with privacy-preserving trading
// Based on Pump.fun model: 800M tokens, $66K threshold for AMM graduation

use starknet::ContractAddress;

/// Bonding curve state
#[derive(Drop, Serde, starknet::Store)]
pub struct CurveState {
    /// Current supply sold via bonding curve
    pub current_supply: u256,
    /// Total raised in payment token (ETH)
    pub total_raised: u256,
    /// Whether token has graduated to AMM
    pub graduated: bool,
    /// AMM pool address (after graduation)
    pub amm_pool: ContractAddress,
}

/// Trading parameters
#[derive(Drop, Serde, starknet::Store)]
pub struct TradingParams {
    /// Minimum buy amount (anti-dust)
    pub min_buy_amount: u256,
    /// Maximum buy per transaction (anti-whale)
    pub max_buy_per_tx: u256,
    /// Trading fee in basis points (e.g., 30 = 0.3%)
    pub trading_fee_bps: u16,
    /// Creator fee in basis points
    pub creator_fee_bps: u16,
    /// Protocol fee in basis points
    pub protocol_fee_bps: u16,
}

#[starknet::interface]
pub trait IBondingCurve<TContractState> {
    /// Calculate current price for buying tokens
    ///
    /// # Arguments
    /// * `amount` - Number of tokens to buy
    ///
    /// # Returns
    /// * Cost in payment token (wei)
    fn calculate_buy_price(self: @TContractState, amount: u256) -> u256;

    /// Calculate current price for selling tokens
    ///
    /// # Arguments
    /// * `amount` - Number of tokens to sell
    ///
    /// # Returns
    /// * Return amount in payment token (wei)
    fn calculate_sell_price(self: @TContractState, amount: u256) -> u256;

    /// Buy tokens with privacy via ZK proof
    ///
    /// # Arguments
    /// * `amount` - Number of tokens to buy
    /// * `payment_proof` - ZK proof of payment (Garaga verified)
    /// * `commitment` - Pedersen commitment to new balance
    ///
    /// # Returns
    /// * New balance commitment
    fn buy(
        ref self: TContractState,
        amount: u256,
        payment_proof: Span<felt252>,
        commitment: felt252,
    ) -> felt252;

    /// Sell tokens with privacy via ZK proof
    ///
    /// # Arguments
    /// * `amount` - Number of tokens to sell
    /// * `sell_proof` - ZK proof of token ownership
    /// * `nullifier` - Nullifier to prevent double-spending
    ///
    /// # Returns
    /// * New balance commitment
    fn sell(
        ref self: TContractState,
        amount: u256,
        sell_proof: Span<felt252>,
        nullifier: felt252,
    ) -> felt252;

    /// Graduate token to AMM when threshold reached
    ///
    /// # Returns
    /// * Address of created AMM pool
    fn graduate_to_amm(ref self: TContractState) -> ContractAddress;

    /// Get current curve state
    fn get_curve_state(self: @TContractState) -> CurveState;

    /// Get trading parameters
    fn get_trading_params(self: @TContractState) -> TradingParams;

    /// Check if token has graduated to AMM
    fn is_graduated(self: @TContractState) -> bool;

    /// Get current price (latest buy price for 1 token)
    fn get_current_price(self: @TContractState) -> u256;
}

#[starknet::contract]
pub mod BondingCurve {
    use super::{IBondingCurve, CurveState, TradingParams, ContractAddress};
    use starknet::{
        get_caller_address, get_block_timestamp, get_contract_address,
        storage::{StoragePointerReadAccess, StoragePointerWriteAccess}
    };
    use core::num::traits::Zero;

    #[storage]
    struct Storage {
        /// Token contract address
        token_address: ContractAddress,
        /// Payment token (ETH) address
        payment_token: ContractAddress,
        /// Bonding curve parameters
        curve_type: u8,
        base_price: u256,
        slope: u256,
        k_param: u256,
        max_price: u256,
        initial_supply: u256,
        graduation_threshold: u256,
        /// Current state
        current_supply: u256,
        total_raised: u256,
        graduated: bool,
        amm_pool: ContractAddress,
        /// Trading parameters
        trading_params: TradingParams,
        /// Nullifier set (prevent double-spending)
        used_nullifiers: LegacyMap<felt252, bool>,
        /// Commitment tracking
        commitments: LegacyMap<felt252, bool>,
        /// Creator commitment (for fee withdrawal)
        creator_commitment: felt252,
        /// Accumulated fees
        creator_fees: u256,
        protocol_fees: u256,
        /// Garaga verifier for ZK proof verification
        garaga_verifier: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        TokensBought: TokensBought,
        TokensSold: TokensSold,
        GraduatedToAMM: GraduatedToAMM,
        FeesCollected: FeesCollected,
    }

    #[derive(Drop, starknet::Event)]
    pub struct TokensBought {
        #[key]
        pub commitment: felt252,
        pub amount: u256,
        pub cost: u256,
        pub new_supply: u256,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct TokensSold {
        #[key]
        pub nullifier: felt252,
        pub amount: u256,
        pub return_amount: u256,
        pub new_supply: u256,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct GraduatedToAMM {
        #[key]
        pub amm_pool: ContractAddress,
        pub final_supply: u256,
        pub total_raised: u256,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct FeesCollected {
        pub creator_fees: u256,
        pub protocol_fees: u256,
        pub timestamp: u64,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        token_address: ContractAddress,
        payment_token: ContractAddress,
        curve_type: u8,
        base_price: u256,
        slope: u256,
        k_param: u256,
        max_price: u256,
        initial_supply: u256,
        graduation_threshold: u256,
        creator_commitment: felt252,
        garaga_verifier: ContractAddress,
    ) {
        self.token_address.write(token_address);
        self.payment_token.write(payment_token);
        self.curve_type.write(curve_type);
        self.base_price.write(base_price);
        self.slope.write(slope);
        self.k_param.write(k_param);
        self.max_price.write(max_price);
        self.initial_supply.write(initial_supply);
        self.graduation_threshold.write(graduation_threshold);
        self.creator_commitment.write(creator_commitment);
        self.garaga_verifier.write(garaga_verifier);

        // Initialize state
        self.current_supply.write(0);
        self.total_raised.write(0);
        self.graduated.write(false);

        // Set default trading parameters (Pump.fun inspired)
        self
            .trading_params
            .write(
                TradingParams {
                    min_buy_amount: 1000000000000000, // 0.001 ETH
                    max_buy_per_tx: 100000000000000000000, // 100 tokens max per tx
                    trading_fee_bps: 30, // 0.3% total
                    creator_fee_bps: 10, // 0.1% to creator
                    protocol_fee_bps: 10, // 0.1% to protocol
                }
            );
    }

    #[abi(embed_v0)]
    impl BondingCurveImpl of IBondingCurve<ContractState> {
        fn calculate_buy_price(self: @ContractState, amount: u256) -> u256 {
            let current_supply = self.current_supply.read();
            let new_supply = current_supply + amount;

            // Calculate price based on curve type
            let curve_type = self.curve_type.read();
            if curve_type == 0 {
                // Linear: price = base_price + (supply * slope)
                self._linear_integral(current_supply, new_supply)
            } else if curve_type == 1 {
                // Exponential: price = base_price * e^(supply * k)
                self._exponential_integral(current_supply, new_supply)
            } else {
                // Sigmoid: price = max_price / (1 + e^(-k * (supply - midpoint)))
                self._sigmoid_integral(current_supply, new_supply)
            }
        }

        fn calculate_sell_price(self: @ContractState, amount: u256) -> u256 {
            let current_supply = self.current_supply.read();
            assert!(amount <= current_supply, "Insufficient supply");

            let new_supply = current_supply - amount;

            // Calculate return based on curve (same integral, reversed)
            let curve_type = self.curve_type.read();
            if curve_type == 0 {
                self._linear_integral(new_supply, current_supply)
            } else if curve_type == 1 {
                self._exponential_integral(new_supply, current_supply)
            } else {
                self._sigmoid_integral(new_supply, current_supply)
            }
        }

        fn buy(
            ref self: ContractState,
            amount: u256,
            payment_proof: Span<felt252>,
            commitment: felt252,
        ) -> felt252 {
            // Check not graduated
            assert!(!self.graduated.read(), "Already graduated to AMM");

            // Validate amount
            let params = self.trading_params.read();
            assert!(amount >= params.min_buy_amount, "Amount too small");
            assert!(amount <= params.max_buy_per_tx, "Amount exceeds max per tx");

            // Check supply limit
            let current_supply = self.current_supply.read();
            let graduation_threshold = self.graduation_threshold.read();
            assert!(current_supply + amount <= graduation_threshold, "Exceeds graduation supply");

            // Calculate cost including fees
            let base_cost = self.calculate_buy_price(amount);
            let total_fee_bps = params.trading_fee_bps;
            let fees = (base_cost * total_fee_bps.into()) / 10000;
            let total_cost = base_cost + fees;

            // TODO: Verify payment_proof using Garaga
            // This proves the buyer has sufficient funds without revealing amount
            // let verifier = self.garaga_verifier.read();
            // assert!(verify_payment_proof(verifier, payment_proof, total_cost, commitment), "Invalid payment proof");

            // Check commitment not already used
            assert!(!self.commitments.read(commitment), "Commitment already used");
            self.commitments.write(commitment, true);

            // Update state
            self.current_supply.write(current_supply + amount);
            self.total_raised.write(self.total_raised.read() + base_cost);

            // Allocate fees
            let creator_fee = (fees * params.creator_fee_bps.into()) / total_fee_bps.into();
            let protocol_fee = fees - creator_fee;
            self.creator_fees.write(self.creator_fees.read() + creator_fee);
            self.protocol_fees.write(self.protocol_fees.read() + protocol_fee);

            // Emit event
            self
                .emit(
                    TokensBought {
                        commitment,
                        amount,
                        cost: total_cost,
                        new_supply: current_supply + amount,
                        timestamp: get_block_timestamp(),
                    }
                );

            // Return new balance commitment (encrypted)
            commitment
        }

        fn sell(
            ref self: ContractState,
            amount: u256,
            sell_proof: Span<felt252>,
            nullifier: felt252,
        ) -> felt252 {
            // Check not graduated
            assert!(!self.graduated.read(), "Already graduated to AMM");

            // Check nullifier not used (prevent double-spending)
            assert!(!self.used_nullifiers.read(nullifier), "Nullifier already used");

            // Calculate return amount
            let return_amount = self.calculate_sell_price(amount);

            // TODO: Verify sell_proof using Garaga
            // This proves the seller owns the tokens without revealing identity
            // let verifier = self.garaga_verifier.read();
            // assert!(verify_sell_proof(verifier, sell_proof, amount, nullifier), "Invalid sell proof");

            // Mark nullifier as used
            self.used_nullifiers.write(nullifier, true);

            // Update state
            let current_supply = self.current_supply.read();
            self.current_supply.write(current_supply - amount);
            self.total_raised.write(self.total_raised.read() - return_amount);

            // Emit event
            self
                .emit(
                    TokensSold {
                        nullifier,
                        amount,
                        return_amount,
                        new_supply: current_supply - amount,
                        timestamp: get_block_timestamp(),
                    }
                );

            // Return new balance commitment (would be computed by frontend)
            nullifier // Placeholder
        }

        fn graduate_to_amm(ref self: ContractState) -> ContractAddress {
            // Check graduation threshold reached
            let current_supply = self.current_supply.read();
            let graduation_threshold = self.graduation_threshold.read();
            assert!(current_supply >= graduation_threshold, "Graduation threshold not reached");

            // Check not already graduated
            assert!(!self.graduated.read(), "Already graduated");

            // TODO: Deploy AMM pool with liquidity from bonding curve
            // This would integrate with a Uniswap V2 style AMM on Ztarknet
            // For now, using placeholder address
            let amm_pool = ContractAddress::from(0x123); // Placeholder

            // Mark as graduated
            self.graduated.write(true);
            self.amm_pool.write(amm_pool);

            // Emit event
            self
                .emit(
                    GraduatedToAMM {
                        amm_pool,
                        final_supply: current_supply,
                        total_raised: self.total_raised.read(),
                        timestamp: get_block_timestamp(),
                    }
                );

            amm_pool
        }

        fn get_curve_state(self: @ContractState) -> CurveState {
            CurveState {
                current_supply: self.current_supply.read(),
                total_raised: self.total_raised.read(),
                graduated: self.graduated.read(),
                amm_pool: self.amm_pool.read(),
            }
        }

        fn get_trading_params(self: @ContractState) -> TradingParams {
            self.trading_params.read()
        }

        fn is_graduated(self: @ContractState) -> bool {
            self.graduated.read()
        }

        fn get_current_price(self: @ContractState) -> u256 {
            // Price for buying 1 token at current supply
            self.calculate_buy_price(1)
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// Calculate integral for linear bonding curve
        fn _linear_integral(self: @ContractState, start: u256, end: u256) -> u256 {
            let base_price = self.base_price.read();
            let slope = self.slope.read();

            // Integral: base_price * (end - start) + slope * (end^2 - start^2) / 2
            let amount = end - start;
            let avg_price = base_price + (slope * (start + end)) / 2;
            avg_price * amount
        }

        /// Calculate integral for exponential bonding curve
        /// Simplified approximation for Cairo (full exp requires oracle)
        fn _exponential_integral(self: @ContractState, start: u256, end: u256) -> u256 {
            let base_price = self.base_price.read();
            let k_param = self.k_param.read();

            // Simplified: assume small k and use Taylor expansion
            // exp(k*x) ≈ 1 + k*x + (k*x)^2/2
            let amount = end - start;
            let mid = (start + end) / 2;
            let exp_approx = 10000 + (k_param * mid) / 1000; // Scaled by 10000
            (base_price * amount * exp_approx) / 10000
        }

        /// Calculate integral for sigmoid bonding curve (Pump.fun style)
        /// Most capital efficient and gradual price discovery
        fn _sigmoid_integral(self: @ContractState, start: u256, end: u256) -> u256 {
            let max_price = self.max_price.read();
            let k_param = self.k_param.read();
            let graduation_threshold = self.graduation_threshold.read();
            let midpoint = graduation_threshold / 2;

            // Sigmoid: P(x) = max_price / (1 + e^(-k*(x - midpoint)))
            // For Cairo efficiency, use piecewise linear approximation
            let amount = end - start;
            let mid = (start + end) / 2;

            // Determine region: early, mid, or late
            if mid < midpoint / 2 {
                // Early phase: linear growth from base_price
                let base_price = self.base_price.read();
                let early_slope = (max_price / 4) / (midpoint / 2);
                base_price * amount + (early_slope * mid * amount) / midpoint
            } else if mid < midpoint * 3 / 2 {
                // Mid phase: steepest growth (inflection point)
                let mid_price = max_price / 2;
                mid_price * amount
            } else {
                // Late phase: approaching max_price asymptotically
                let late_price = (max_price * 9) / 10; // 90% of max
                late_price * amount
            }
        }
    }
}
