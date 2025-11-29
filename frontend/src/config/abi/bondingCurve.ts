// BondingCurve Contract ABI
export const BONDING_CURVE_ABI = [
  {
    name: 'calculate_buy_price',
    type: 'function',
    inputs: [{ name: 'amount', type: 'u256' }],
    outputs: [{ type: 'u256' }],
    state_mutability: 'view',
  },
  {
    name: 'calculate_sell_price',
    type: 'function',
    inputs: [{ name: 'amount', type: 'u256' }],
    outputs: [{ type: 'u256' }],
    state_mutability: 'view',
  },
  {
    name: 'buy',
    type: 'function',
    inputs: [
      { name: 'amount', type: 'u256' },
      { name: 'payment_proof', type: 'Array<felt252>' },
      { name: 'commitment', type: 'felt252' },
    ],
    outputs: [{ type: 'felt252' }],
    state_mutability: 'external',
  },
  {
    name: 'sell',
    type: 'function',
    inputs: [
      { name: 'amount', type: 'u256' },
      { name: 'sell_proof', type: 'Array<felt252>' },
      { name: 'nullifier', type: 'felt252' },
    ],
    outputs: [{ type: 'felt252' }],
    state_mutability: 'external',
  },
  {
    name: 'graduate_to_amm',
    type: 'function',
    inputs: [],
    outputs: [{ type: 'ContractAddress' }],
    state_mutability: 'external',
  },
  {
    name: 'get_curve_state',
    type: 'function',
    inputs: [],
    outputs: [
      {
        type: 'struct',
        members: [
          { name: 'current_supply', type: 'u256' },
          { name: 'total_raised', type: 'u256' },
          { name: 'graduated', type: 'bool' },
          { name: 'amm_pool', type: 'ContractAddress' },
        ],
      },
    ],
    state_mutability: 'view',
  },
  {
    name: 'get_trading_params',
    type: 'function',
    inputs: [],
    outputs: [
      {
        type: 'struct',
        members: [
          { name: 'min_buy_amount', type: 'u256' },
          { name: 'max_buy_per_tx', type: 'u256' },
          { name: 'trading_fee_bps', type: 'u16' },
          { name: 'creator_fee_bps', type: 'u16' },
          { name: 'protocol_fee_bps', type: 'u16' },
        ],
      },
    ],
    state_mutability: 'view',
  },
  {
    name: 'is_graduated',
    type: 'function',
    inputs: [],
    outputs: [{ type: 'bool' }],
    state_mutability: 'view',
  },
  {
    name: 'get_current_price',
    type: 'function',
    inputs: [],
    outputs: [{ type: 'u256' }],
    state_mutability: 'view',
  },
] as const;
