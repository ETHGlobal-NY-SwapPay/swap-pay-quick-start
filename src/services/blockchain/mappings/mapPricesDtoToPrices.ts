import type { Prices } from "../../../modals/prices.model";
import type { PricesDto } from "../dtos/prices.dto";

export function mapPricesDtoToPrices(dto: PricesDto): Prices {
  return {
    ethUsd: dto.ethUsd,
    wbtcUsd: dto.wbtcUsd,
    daiUsd: dto.daiUsd,
    usdcUsd: dto.usdcUsd,
    linkUsd: dto.linkUsd,
    wstethUsd: dto.wstethUsd,
  };
}
