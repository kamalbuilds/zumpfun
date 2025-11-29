import { InjectedConnector } from "starknetkit/injected";
import { Chain, mainnet, sepolia } from "@starknet-react/chains";
import {
  jsonRpcProvider,
  StarknetConfig,
  voyager,
  Connector,
} from "@starknet-react/core";
import { ReactNode } from "react";
import { NETWORK_CONFIG } from "@/config/contracts";

const ztarknet: Chain = {
  id: BigInt(0x534e5f5345504f4c4941), // SN_SEPOLIA - what the RPC reports
  name: "Ztarknet Sepolia",
  network: "ztarknet-sepolia",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
    address: NETWORK_CONFIG.feeTokenAddress as `0x${string}`,
  },
  rpcUrls: {
    default: {
      http: [NETWORK_CONFIG.rpcUrl],
    },
    public: {
      http: [NETWORK_CONFIG.rpcUrl],
    },
  },
  testnet: true,
};

interface StarknetProviderProps {
  children: ReactNode;
}

function ztarknetProvider() {
  return jsonRpcProvider({
    rpc: () => ({
      nodeUrl: NETWORK_CONFIG.rpcUrl,
    }),
  });
}

export default function StarknetProvider({ children }: StarknetProviderProps) {
  const connectors = [
    new InjectedConnector({
      options: { id: "argentX", name: "Argent X" },
    }),
    new InjectedConnector({
      options: { id: "braavos", name: "Braavos" },
    }),
  ] as unknown as Connector[];

  return (
    <StarknetConfig
      chains={[ztarknet, sepolia, mainnet]}
      provider={ztarknetProvider()}
      connectors={connectors}
      explorer={voyager}
    >
      {children}
    </StarknetConfig>
  );
}
