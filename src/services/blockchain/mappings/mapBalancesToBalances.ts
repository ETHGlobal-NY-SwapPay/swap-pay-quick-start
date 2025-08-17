import type { Balances } from "../../../modals/balances.model";
import type { BalancesDto } from "../dtos/balance.dto";

export function mapBalancesDtoToBalances(dto: BalancesDto): Balances {
  return {
    eth: dto.eth,
    wbtc: dto.wbtc,
    dai: dto.dai,
    usdc: dto.usdc,
    link: dto.link,
    wsteth: dto.wsteth,
  };
}
