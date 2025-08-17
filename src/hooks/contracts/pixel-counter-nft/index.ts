import { type WalletClient } from "viem";
import { useBuyNFT } from "./useBuyNFT";
import { PixelCounterNFT } from "../../../services/blockchain/contracts/pixel-counter-nft";
import { useEffect, useState } from "react";
import type { Uri } from "../../../modals/uri.model";

export function usePixelCounterNFT(walletClient?: WalletClient) {
  const pixelCounterNFT = new PixelCounterNFT();

  if (walletClient) {
    pixelCounterNFT.setWalletClient(walletClient);
  }

  const [uri, setUri] = useState<Uri | null>(null);
  const [price, setPrice] = useState<bigint | null>(null);

  const load = async () => {
    const [lastUri, price] = await Promise.all([
      await pixelCounterNFT.getLastUri(),
      await pixelCounterNFT.getPrice(),
    ]);

    setUri(lastUri);
    setPrice(price);
  };

  useEffect(() => {
    load();
  }, []);

  const buyNFT = useBuyNFT(pixelCounterNFT);

  return { buyNFT, price, uri, reFetch: load };
}
