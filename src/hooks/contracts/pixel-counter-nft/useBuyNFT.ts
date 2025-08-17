import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { type Address, type Hex } from "viem";
import type { PixelCounterNFT } from "../../../services/blockchain/contracts/pixel-counter-nft";
import type { ContractError, ServiceResult } from "../../../modals/api.model";

type Params = {
  to: Address;
  token: Address;
};

export function useBuyNFT(
  pixelCounterNFT: PixelCounterNFT
): UseMutationResult<Hex, ContractError, Params> {
  return useMutation<Hex, ContractError, Params>({
    mutationFn: async ({ to, token }): Promise<Hex> => {
      const result: ServiceResult<Hex> = await pixelCounterNFT.buyNFT(
        to,
        token
      );

      if (!result.success) throw result.error;
      return result.data!; // Hex string of the transaction hash
    },
  });
}
