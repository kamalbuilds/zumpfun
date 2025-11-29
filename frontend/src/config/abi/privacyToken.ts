// PrivacyToken Contract ABI (ERC20 + Privacy Extensions)
export const PRIVACY_TOKEN_ABI = [
  // Standard ERC20
  {
    name: 'name',
    type: 'function',
    inputs: [],
    outputs: [{ type: 'felt252' }],
    state_mutability: 'view',
  },
  {
    name: 'symbol',
    type: 'function',
    inputs: [],
    outputs: [{ type: 'felt252' }],
    state_mutability: 'view',
  },
  {
    name: 'decimals',
    type: 'function',
    inputs: [],
    outputs: [{ type: 'u8' }],
    state_mutability: 'view',
  },
  {
    name: 'total_supply',
    type: 'function',
    inputs: [],
    outputs: [{ type: 'u256' }],
    state_mutability: 'view',
  },
  {
    name: 'balance_of',
    type: 'function',
    inputs: [{ name: 'account', type: 'ContractAddress' }],
    outputs: [{ type: 'u256' }],
    state_mutability: 'view',
  },
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'ContractAddress' },
      { name: 'spender', type: 'ContractAddress' },
    ],
    outputs: [{ type: 'u256' }],
    state_mutability: 'view',
  },
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'recipient', type: 'ContractAddress' },
      { name: 'amount', type: 'u256' },
    ],
    outputs: [{ type: 'bool' }],
    state_mutability: 'external',
  },
  {
    name: 'transfer_from',
    type: 'function',
    inputs: [
      { name: 'sender', type: 'ContractAddress' },
      { name: 'recipient', type: 'ContractAddress' },
      { name: 'amount', type: 'u256' },
    ],
    outputs: [{ type: 'bool' }],
    state_mutability: 'external',
  },
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'ContractAddress' },
      { name: 'amount', type: 'u256' },
    ],
    outputs: [{ type: 'bool' }],
    state_mutability: 'external',
  },
  // Privacy Extensions
  {
    name: 'shield',
    type: 'function',
    inputs: [
      { name: 'amount', type: 'u256' },
      { name: 'commitment', type: 'felt252' },
    ],
    outputs: [{ type: 'bool' }],
    state_mutability: 'external',
  },
  {
    name: 'unshield',
    type: 'function',
    inputs: [
      { name: 'amount', type: 'u256' },
      { name: 'unshield_proof', type: 'Array<felt252>' },
      { name: 'nullifier', type: 'felt252' },
    ],
    outputs: [{ type: 'bool' }],
    state_mutability: 'external',
  },
  {
    name: 'private_transfer',
    type: 'function',
    inputs: [
      { name: 'transfer_proof', type: 'Array<felt252>' },
      { name: 'sender_nullifier', type: 'felt252' },
      { name: 'recipient_commitment', type: 'felt252' },
      { name: 'change_commitment', type: 'felt252' },
    ],
    outputs: [{ type: 'bool' }],
    state_mutability: 'external',
  },
  {
    name: 'has_commitment',
    type: 'function',
    inputs: [{ name: 'commitment', type: 'felt252' }],
    outputs: [{ type: 'bool' }],
    state_mutability: 'view',
  },
  {
    name: 'is_nullifier_used',
    type: 'function',
    inputs: [{ name: 'nullifier', type: 'felt252' }],
    outputs: [{ type: 'bool' }],
    state_mutability: 'view',
  },
  {
    name: 'total_shielded_supply',
    type: 'function',
    inputs: [],
    outputs: [{ type: 'u256' }],
    state_mutability: 'view',
  },
] as const;
