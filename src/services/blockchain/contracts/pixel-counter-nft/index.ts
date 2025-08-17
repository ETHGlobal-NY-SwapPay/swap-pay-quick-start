import { type Address, type Hex, type WalletClient } from "viem";

import { BaseContract } from "../base-contract";

import { PixelCounterNFT as PixelCounterNFTContract } from "../../../../assets/contracts/PixelCounterNFT";
import { mapUriDtoToUri } from "../../mappings/mapUriDtoToUri";
import type { Uri } from "../../../../modals/uri.model";
import { parseContractError } from "../../../../config/contract.config";
import type { ServiceResult } from "../../../../modals/api.model";

export class PixelCounterNFT extends BaseContract {
  constructor(walletClient?: WalletClient) {
    super(PixelCounterNFTContract, walletClient);
  }

  // =========================
  //        READ METHODS
  // =========================

  async getPrice(): Promise<bigint | null> {
    try {
      const contract = this.getReadContract();
      const price = (await contract.read.getPrice([])) as bigint;
      return price;
    } catch (error) {
      console.error("❌", error);
      return null;
    }
  }

  async getLastUri(): Promise<Uri | null> {
    try {
      const contract = this.getReadContract();
      const uri = (await contract.read.getLastUri([])) as string;
      return mapUriDtoToUri(uri);
    } catch (error) {
      console.error("❌", error);
      return null;
    }
  }

  // =========================
  //        WRITE METHODS
  // =========================

  async buyNFT(to: Address, token: Address): Promise<ServiceResult<Hex>> {
    try {
      const publicClient = this.getPublicClient();
      const contract = this.getWriteContract();
      const hash = await contract.write.buyNFT([to, token]);

      await publicClient.waitForTransactionReceipt({ hash });

      return { success: true, data: hash };
    } catch (error) {
      const parsedError = parseContractError(error, "buyNFT");
      console.error("❌", parsedError);
      return { success: false, error: parsedError };
    }
  }
}
