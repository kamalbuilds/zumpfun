import React from 'react';
import { StarknetConfig, publicProvider, argent, braavos } from '@starknet-react/core';
import { Chain, sepolia, mainnet } from '@starknet-react/chains';

// Ztarknet custom chain configuration
const ztarknet: Chain = {
  id: BigInt('0x534e5f5a454e44'), // 'SN_ZEND' in hex
  name: 'Ztarknet Testnet',
  network: 'ztarknet',
  nativeCurrency: {
    address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  testnet: true,
  rpcUrls: {
    default: {
      http: ['https://ztarknet-madara.d.karnot.xyz'],
    },
    public: {
      http: ['https://ztarknet-madara.d.karnot.xyz'],
    },
  },
};

interface WalletProviderProps {
  children: React.ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  // Configure supported chains - Ztarknet as primary
  const chains = [ztarknet, sepolia, mainnet];

  // Configure wallet connectors
  const connectors = [
    argent(),
    braavos(),
  ];

  return (
    <StarknetConfig
      chains={chains}
      provider={publicProvider()}
      connectors={connectors}
      autoConnect
    >
      {children}
    </StarknetConfig>
  );
}

export default WalletProvider;
