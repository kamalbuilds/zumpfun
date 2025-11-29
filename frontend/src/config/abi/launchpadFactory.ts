// LaunchpadFactory Contract ABI
export const LAUNCHPAD_FACTORY_ABI = [
  {
    name: 'create_launch',
    type: 'function',
    inputs: [
      {
        name: 'config',
        type: 'struct',
        members: [
          { name: 'name', type: 'felt252' },
          { name: 'symbol', type: 'felt252' },
          {
            name: 'curve_params',
            type: 'struct',
            members: [
              { name: 'curve_type', type: 'u8' },
              { name: 'base_price', type: 'u256' },
              { name: 'slope', type: 'u256' },
              { name: 'k_param', type: 'u256' },
              { name: 'max_price', type: 'u256' },
              { name: 'initial_supply', type: 'u256' },
              { name: 'graduation_threshold', type: 'u256' },
            ],
          },
          {
            name: 'metadata',
            type: 'struct',
            members: [
              { name: 'metadata_uri', type: 'felt252' },
              { name: 'creator_commitment', type: 'felt252' },
              { name: 'launch_start', type: 'u64' },
              { name: 'launch_end', type: 'u64' },
              { name: 'image_uri', type: 'felt252' },
              { name: 'twitter', type: 'felt252' },
              { name: 'website', type: 'felt252' },
            ],
          },
        ],
      },
      { name: 'creator_proof', type: 'Array<felt252>' },
    ],
    outputs: [{ type: 'ContractAddress' }],
    state_mutability: 'external',
  },
  {
    name: 'get_launch',
    type: 'function',
    inputs: [{ name: 'token_id', type: 'u256' }],
    outputs: [{ type: 'ContractAddress' }],
    state_mutability: 'view',
  },
  {
    name: 'get_token_address',
    type: 'function',
    inputs: [{ name: 'token_id', type: 'u256' }],
    outputs: [{ type: 'ContractAddress' }],
    state_mutability: 'view',
  },
  {
    name: 'get_total_launches',
    type: 'function',
    inputs: [],
    outputs: [{ type: 'u256' }],
    state_mutability: 'view',
  },
  {
    name: 'get_launchpad_class_hash',
    type: 'function',
    inputs: [],
    outputs: [{ type: 'felt252' }],
    state_mutability: 'view',
  },
  {
    name: 'get_verifier_address',
    type: 'function',
    inputs: [],
    outputs: [{ type: 'ContractAddress' }],
    state_mutability: 'view',
  },
  {
    name: 'is_paused',
    type: 'function',
    inputs: [],
    outputs: [{ type: 'bool' }],
    state_mutability: 'view',
  },
] as const;
