import { useEffect, useState } from "react";
import { SwapPay } from "../../../services/blockchain/contracts/swap-pay";
import type { WalletClient, Address } from "viem";
import type { Prices } from "../../../modals/prices.model";
import type { Balances } from "../../../modals/balances.model";
import { useAccount } from "wagmi";

export function useSwapPay(walletClient?: WalletClient) {
  const { address, isConnected } = useAccount();

  const swapPay = new SwapPay();
  if (walletClient) {
    swapPay.setWalletClient(walletClient);
  }

  const [prices, setPrices] = useState<Prices | null>(null);
  const [balances, setBalances] = useState<Balances | null>(null);

  const getBalances = async (account: Address): Promise<Balances | null> => {
    return await swapPay.getBalances(account);
  };

  const load = async () => {
    const lastPrices = await swapPay.getPrices();
    setPrices(lastPrices);

    if (isConnected && address) {
      const lastBalances = await swapPay.getBalances(address);
      setBalances(lastBalances);
    }
  };

  useEffect(() => {
    load();
  }, [address, isConnected]);

  return { prices, balances, getBalances, reFetch: load };
}
