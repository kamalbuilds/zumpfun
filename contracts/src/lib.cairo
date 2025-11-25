// SPDX-License-Identifier: MIT
// ZumpFun Smart Contract Library
// Main module exports for the ZumpFun privacy-preserving meme coin launchpad

/// Launchpad Factory - Deploy new token launches
pub mod launchpad_factory;

/// Bonding Curve - Sigmoid pricing mechanism for fair launches
pub mod bonding_curve;

/// Privacy Token - ERC20 with ZK privacy features
pub mod privacy_token;

/// Token Distributor - Privacy-preserving token distribution
pub mod token_distributor;

// TODO: Implement these additional modules for full functionality

/// Privacy Pool - Shielded asset management (future)
// pub mod privacy_pool;

/// AMM Integration - Automated market maker after graduation (future)
// pub mod amm;

/// Governance - DAO governance with private voting (future)
// pub mod governance;

/// Fee Manager - Fee collection and distribution (future)
// pub mod fee_manager;

// Re-export main interfaces
pub use launchpad_factory::{
    ILaunchpadFactory, LaunchConfig, BondingCurveParams, LaunchMetadata
};
pub use bonding_curve::{IBondingCurve, CurveState, TradingParams};
pub use privacy_token::IPrivacyToken;
pub use token_distributor::{ITokenDistributor, VestingSchedule, DistributionTree};
