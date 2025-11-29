import { useAccount, useBalance, useConnect, useDisconnect, useNetwork } from '@starknet-react/core';
import { useState, useEffect, useCallback } from 'react';

export interface WalletInfo {
  address: string;
  balance: string;
  isConnected: boolean;
  isConnecting: boolean;
  network: string;
  isCorrectNetwork: boolean;
}

const ZTARKNET_CHAIN_ID = '0x534e5f5a454e44'; // 'SN_ZEND' in hex - Ztarknet testnet

export function useWallet() {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();
  const { data: balanceData } = useBalance({
    address,
    watch: true,
  });

  const [walletInfo, setWalletInfo] = useState<WalletInfo>({
    address: '',
    balance: '0',
    isConnected: false,
    isConnecting: false,
    network: '',
    isCorrectNetwork: false,
  });

  // Check if connected to Ztarknet
  const isCorrectNetwork = useCallback(() => {
    if (!chain) return false;
    return chain.id.toString() === ZTARKNET_CHAIN_ID;
  }, [chain]);

  // Format balance from wei to ETH
  const formatBalance = useCallback((balance: bigint | undefined): string => {
    if (!balance) return '0';
    const ethBalance = Number(balance) / 1e18;
    return ethBalance.toFixed(4);
  }, []);

  // Update wallet info whenever dependencies change
  useEffect(() => {
    setWalletInfo({
      address: address || '',
      balance: formatBalance(balanceData?.value),
      isConnected: isConnected || false,
      isConnecting: isConnecting || false,
      network: chain?.name || '',
      isCorrectNetwork: isCorrectNetwork(),
    });
  }, [address, balanceData, isConnected, isConnecting, chain, formatBalance, isCorrectNetwork]);

  // Connect to specific wallet
  const connectWallet = useCallback(
    async (connectorId: string) => {
      try {
        const connector = connectors.find((c) => c.id === connectorId);
        if (!connector) {
          throw new Error(`Connector ${connectorId} not found`);
        }
        await connect({ connector });
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        throw error;
      }
    },
    [connect, connectors]
  );

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw error;
    }
  }, [disconnect]);

  // Get available wallets
  const getAvailableWallets = useCallback(() => {
    return connectors.map((connector) => ({
      id: connector.id,
      name: connector.name,
      icon: connector.icon,
    }));
  }, [connectors]);

  // Format address for display (0x1234...5678)
  const formatAddress = useCallback((addr: string): string => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, []);

  return {
    walletInfo,
    connectWallet,
    disconnectWallet,
    getAvailableWallets,
    formatAddress,
    connectors,
  };
}
