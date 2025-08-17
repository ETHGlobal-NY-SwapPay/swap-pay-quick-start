import { type Address, type WalletClient } from "viem";

import { BaseContract } from "../base-contract";

import { SwapPay as SwapPayJson } from "../../../../assets/contracts/SwapPay";
import type { Prices } from "../../../../modals/prices.model";
import { mapPricesDtoToPrices } from "../../mappings/mapPricesDtoToPrices";
import { mapBalancesDtoToBalances } from "../../mappings/mapBalancesToBalances";
import type { Balances } from "../../../../modals/balances.model";
import type { BalancesDto } from "../../dtos/balance.dto";
import type { PricesDto } from "../../dtos/prices.dto";

export class SwapPay extends BaseContract {
  constructor(walletClient?: WalletClient) {
    super(SwapPayJson, walletClient);
  }

  // =========================
  //        READ METHODS
  // =========================

  async getBalances(account: Address): Promise<Balances | null> {
    try {
      const contract = this.getReadContract();
      const dto = (await contract.read.getBalances([account])) as BalancesDto;
      return mapBalancesDtoToBalances(dto);
    } catch (error) {
      console.error("❌", error);
      return null;
    }
  }

  async getPrices(): Promise<Prices | null> {
    try {
      const contract = this.getReadContract();
      const dto = (await contract.read.getPrices([])) as PricesDto;
      return mapPricesDtoToPrices(dto);
    } catch (error) {
      console.error("❌", error);
      return null;
    }
  }

  // =========================
  //        WRITE METHODS
  // =========================
}
