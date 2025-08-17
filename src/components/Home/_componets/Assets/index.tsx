import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import { chainlinkDataFeedsSepolia } from "../../../../assets/json/chainlink-data-feeds-sepolia";
import { useSwapPay } from "../../../../hooks/contracts/swap-pay";
import type { Balances } from "../../../../modals/balances.model";
import type { Prices } from "../../../../modals/prices.model";
import { encodeFunctionData, formatUnits, type Address, type Hex } from "viem";
import { useAccount, useChainId, usePublicClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import { usePixelCounterNFT } from "../../../../hooks/contracts/pixel-counter-nft";
import { PixelCounterNFT } from "../../../../assets/contracts/PixelCounterNFT";
import { useSendCalls } from "wagmi";
import { SwapPay } from "../../../../assets/contracts/SwapPay";
import confetti from "canvas-confetti";

type PurchaseItem = {
  name: string;
  contractAddress: string | null; // token ERC20 o null
  amountTokenBig: bigint; // base units del token
};

const IERC20_MIN_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

const NATIVE_SENTINEL = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export function Assets(): JSX.Element {
  const publicClient = usePublicClient();
  const [isSuccess, setIsSuccess] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { sendCallsAsync } = useSendCalls();

  console.log("isSuccess:", isSuccess);
  console.log("id:", id);

  // ===== config =====
  const PRICE_DECIMALS = 8; // Chainlink USD feeds
  const TOL = 0.01;
  const EPS = 1e-6;
  const PAYMENT_TOKEN_DECIMALS = 6;

  // SwapPay fee: 0.05% (5 bps)
  const FEE_BPS = 5n; // 5 basis points = 0.05%
  const BPS_DENOM = 10_000n; // 100%

  // ===== connection =====
  const { address, status, isConnected } = useAccount();
  const wagmiChainId = useChainId();
  const [runtimeChainId, setRuntimeChainId] = useState<number | null>(
    wagmiChainId ?? null
  );

  const { price: priceRaw } = usePixelCounterNFT();

  const TOTAL = useMemo(
    () =>
      priceRaw ? Number(formatUnits(priceRaw, PAYMENT_TOKEN_DECIMALS)) : 0,
    [priceRaw]
  );

  useEffect(() => {
    const eth = (window as any)?.ethereum;
    let mounted = true;
    const setFromProvider = async () => {
      try {
        if (!eth?.request) return;
        const hex = await eth.request({ method: "eth_chainId" });
        if (!mounted) return;
        setRuntimeChainId(parseInt(String(hex), 16));
      } catch {}
    };
    setFromProvider();
    const onChainChanged = (hex: string) =>
      setRuntimeChainId(parseInt(hex, 16));
    eth?.on?.("chainChanged", onChainChanged);
    return () => {
      mounted = false;
      eth?.removeListener?.("chainChanged", onChainChanged);
    };
  }, []);

  useEffect(() => {
    if (wagmiChainId && wagmiChainId !== runtimeChainId) {
      setRuntimeChainId(wagmiChainId);
    }
  }, [wagmiChainId]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSepolia = runtimeChainId === sepolia.id;

  // ===== state =====
  const [effective, setEffective] = useState(
    chainlinkDataFeedsSepolia.map(() => 0)
  );
  const [values, setValues] = useState(chainlinkDataFeedsSepolia.map(() => 0));
  const [fade, setFade] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [activeSliderIndex, setActiveSliderIndex] = useState<number | null>(
    null
  );

  // ===== data =====
  const { prices, balances, reFetch } = useSwapPay();
  const reFetchRef = useRef(reFetch);
  const prevPricesRef = useRef<Record<string, number>>({});
  useEffect(() => {
    reFetchRef.current = reFetch;
  }, [reFetch]);

  const globallyLocked = !isConnected || !onSepolia;
  useEffect(() => {
    if (globallyLocked) setActiveSliderIndex(null);
  }, [globallyLocked]);

  // polling (only when enabled)
  useEffect(() => {
    if (globallyLocked) return;
    let timeoutId: number | null = null;
    const tick = async () => {
      setFade(true);
      try {
        await reFetchRef.current();
        setPulse((x) => x + 1);
      } finally {
        if (timeoutId) window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => setFade(false), 250);
      }
    };
    const id = window.setInterval(tick, 5000);
    tick();
    return () => {
      window.clearInterval(id);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [globallyLocked]);

  // feeds (price + trend)
  const feeds = useMemo(() => {
    return chainlinkDataFeedsSepolia.map((feed, index) => {
      const key = `${feed.name.toLowerCase()}Usd` as keyof typeof prices;
      const TREND_ABS_EPS = 0.01;
      const raw = prices?.[key] ?? "0";
      const current = Number(formatUnits(BigInt(raw), PRICE_DECIMALS));
      const previous = prevPricesRef.current[key] ?? current;
      let trend: "up" | "down" | "same" = "same";
      const diff = current - previous;
      if (Math.abs(diff) > TREND_ABS_EPS) trend = diff > 0 ? "up" : "down";
      prevPricesRef.current[key] = current;
      return { ...feed, key, value: values[index], price: current, trend };
    });
  }, [values, prices, pulse]);

  // limits USD per token
  const tokenLimits = useMemo(() => {
    if (!balances || !prices) return chainlinkDataFeedsSepolia.map(() => 0);
    const decimalsMap: Record<keyof Balances, number> = {
      eth: 18,
      wbtc: 8,
      dai: 18,
      usdc: 6,
      link: 18,
      wsteth: 18,
    };
    return chainlinkDataFeedsSepolia.map((feed) => {
      const assetKey = feed.name.toLowerCase() as keyof Balances;
      const priceKey = `${feed.name.toLowerCase()}Usd` as keyof Prices;
      const balanceRaw = balances[assetKey] ?? 0n;
      const decimals = decimalsMap[assetKey] ?? 18;
      const balanceToken = Number(balanceRaw) / 10 ** decimals;
      const priceUSD = Number(formatUnits(BigInt(prices[priceKey] ?? "0"), 8));
      return balanceToken * priceUSD;
    });
  }, [balances, prices]);

  // total allocated USD
  const totalAllocated = useMemo(
    () =>
      effective.reduce((acc, pct, i) => acc + (pct / 100) * tokenLimits[i], 0),
    [effective, tokenLimits]
  );

  // slider disabled
  const isSliderDisabled = (index: number) => {
    if (globallyLocked) return true;
    const reached = totalAllocated >= TOTAL - 0.01;
    return reached ? activeSliderIndex !== index : false;
  };

  // change slider
  const handleChange = (index: number, newValue: number) => {
    if (globallyLocked) return;
    if (totalAllocated >= TOTAL - TOL && newValue > values[index]) return;
    const sliders = [...values];
    sliders[index] = Math.max(0, Math.min(100, Math.round(newValue)));
    setValues(sliders);
    const othersUSD = effective.reduce(
      (acc, pct, i) => (i === index ? acc : acc + (pct / 100) * tokenLimits[i]),
      0
    );
    const missing = TOTAL - othersUSD;
    const denom = Math.max(1e-9, tokenLimits[index]);
    const pctMaxBySlider = sliders[index];
    const pctNeededExact = (missing / denom) * 100;
    let thisEffPct = Math.min(pctNeededExact, pctMaxBySlider, 100);
    if (missing <= EPS) thisEffPct = Math.min(effective[index], pctMaxBySlider);
    thisEffPct = Math.max(0, thisEffPct);
    const nextEff = [...effective];
    nextEff[index] = thisEffPct;
    setEffective(nextEff);
    const newTotal = othersUSD + (thisEffPct / 100) * denom;
    if (Math.abs(newTotal - TOTAL) <= 0.01) setActiveSliderIndex(index);
    else setActiveSliderIndex(null);
  };

  // reset
  const resetAll = () => {
    setValues(chainlinkDataFeedsSepolia.map(() => 0));
    setEffective(chainlinkDataFeedsSepolia.map(() => 0));
    setActiveSliderIndex(null);
  };

  // reset on wallet/disconnect
  const prevAddressRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (prevAddressRef.current !== address || status === "disconnected") {
      resetAll();
      prevAddressRef.current = address;
    }
  }, [address, status]);

  // reset on chain change
  const prevChainIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (prevChainIdRef.current !== runtimeChainId) {
      resetAll();
      setActiveSliderIndex(null);
      prevChainIdRef.current = runtimeChainId;
    }
  }, [runtimeChainId]);

  // ===== Purchase (bigint payload + fee) =====
  const TEN = (n: number) => BigInt(10) ** BigInt(n);

  const buildPurchaseItemsBig = () => {
    if (!prices) return [];

    return chainlinkDataFeedsSepolia
      .map((feed, i) => {
        const amountUsdNum = (effective[i] / 100) * tokenLimits[i];
        if (amountUsdNum <= 0) return null;

        const priceKey = `${feed.name.toLowerCase()}Usd` as keyof Prices;
        const priceBig = prices[priceKey] ?? 0n; // 8 dec

        const amountUsdBig = BigInt(Math.round(amountUsdNum * 1e8)); // 8 dec
        const amountTokenBig =
          priceBig > 0n
            ? (amountUsdBig * TEN(feed.tokenDecimals)) / priceBig
            : 0n;

        const priceUsdNum = Number(priceBig) / 1e8;
        const amountTokenNum =
          Number(amountTokenBig) / Number(TEN(feed.tokenDecimals));

        return {
          name: feed.name,
          contractAddress: feed.contractAddress ?? null,
          tokenDecimals: feed.tokenDecimals,
          priceFeedDecimals: PRICE_DECIMALS,
          // on-chain
          priceBig,
          amountUsdBig,
          amountTokenBig,
          // debug
          debug: {
            priceUsd: priceUsdNum,
            amountUsd: Number(amountUsdNum.toFixed(2)),
            amountToken: amountTokenNum,
          },
        };
      })
      .filter(Boolean) as Array<{
      name: string;
      contractAddress: string | null;
      tokenDecimals: number;
      priceFeedDecimals: number;
      priceBig: bigint;
      amountUsdBig: bigint;
      amountTokenBig: bigint;
      debug: { priceUsd: number; amountUsd: number; amountToken: number };
    }>;
  };

  const handlePurchase = async () => {
    if (loading) return; // evita doble click
    const items = buildPurchaseItemsBig();

    // total USD con 8 decimales
    const totalUsdBig = BigInt(Math.round(totalAllocated * 1e8));

    // ---- SwapPay fee (0.05%) en token nativo (ETH) ----
    const ethPriceBig = prices?.ethUsd ?? 0n; // 8 decimales
    const feeUsdBig = (totalUsdBig * FEE_BPS) / BPS_DENOM; // 8 dec
    const feeEthWei =
      ethPriceBig > 0n ? (feeUsdBig * TEN(18)) / ethPriceBig : 0n; // wei
    const feeEth = Number(feeEthWei) / 1e18; // debug

    console.log({
      networkChainId: runtimeChainId,
      totalUsdBig,
      swapPayFee: {
        rateBps: Number(FEE_BPS),
        feeUsdBig,
        feeEthWei,
        feeEth,
      },
      items,
    });

    if (!address) return;
    if (!publicClient) return;

    // === 1) Construir montos finales con +1% (los que realmente se transferirán)
    const { inTokens, inAmounts, debug } = buildTokenArrays(items);
    console.log("inTokens:", inTokens);
    console.log("inAmounts:", inAmounts);
    console.table(debug);

    // === 2) Construir approvals EXACTOS (+ patrón approve(0) -> approve(monto))
    const approveCalls = buildApproveCallsForInTokenAmounts(
      inTokens,
      inAmounts
    );

    // === 3) Calldata buyNFT y execute
    const buyNFTData = buildBuyNftCalldata(
      PixelCounterNFT.abi,
      address, // to
      "0xE448eAbd8420ED396020F8dDB09A4b6F7E6040D4" // PYUSD
    );

    const target = PixelCounterNFT.address as Address;
    const amountPyusd = priceRaw ?? 0n; // 6 dec

    const executeData = buildSwapPayExecuteCalldata({
      inTokens,
      inAmounts,
      target,
      buyCallData: buyNFTData,
      amountPyusd,
      minOut: 0n, // ignorado por contrato
    });

    const calls: Array<{ to: Address; data: Hex }> = [
      ...approveCalls,
      { to: SwapPay.address as Address, data: executeData },
    ];
    if (calls.length === 0) {
      console.warn("No hay llamadas que enviar.");
      return;
    }

    // ===== Envío + polling de inclusión =====
    setLoading(true);
    try {
      const startNonce = await publicClient.getTransactionCount({
        address,
        blockTag: "latest",
      });

      const { id: batchId } = await sendCallsAsync({ calls });
      console.log("batchId", batchId);

      // Poll hasta que alguna tx del usuario sea minada
      let confirmed = false;
      while (!confirmed) {
        const nonce = await publicClient.getTransactionCount({
          address,
          blockTag: "latest",
        });
        if (nonce > startNonce) {
          confirmed = true;
          console.log("Alguna transacción del batch fue incluida.");
        } else {
          await new Promise((r) => setTimeout(r, 3000));
        }
      }

      // éxito
      setId(String(batchId));
      setIsSuccess(true);

      // confetti + reset de UI + refresh de saldos/precios
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      resetAll();
      try {
        await reFetchRef.current(); // refresca límites
      } catch {}
    } catch (error) {
      console.error("Error en sendCalls:", error);
    } finally {
      setLoading(false); // re-habilita botón
    }
  };

  const purchaseEnabled =
    !globallyLocked && Math.abs(totalAllocated - TOTAL) <= 0.01 && !loading;

  const purchaseLabel = loading ? "Processing…" : "Purchase";

  // ===== UI =====
  return (
    <div
      key={`${runtimeChainId ?? "nochain"}-${address ?? "noaddr"}`}
      className="w-full max-w-[760px] mx-auto flex flex-col gap-3"
    >
      {/* Header */}
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold tracking-tight">Allocation</h1>
          {globallyLocked ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-700 text-[10px] font-medium">
              🔒 Connect wallet on Sepolia to edit
            </span>
          ) : Math.abs(totalAllocated - TOTAL) <= 0.01 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800 text-[10px] font-medium">
              ✅ Ready — totals at ${TOTAL.toLocaleString()}
            </span>
          ) : (
            <span className="text-[11px] text-gray-500">
              Adjust the sliders to reach {TOTAL}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="text-base font-bold tabular-nums">
            ${totalAllocated.toFixed(2)}
            <span className="ml-1 text-gray-500 text-xs">
              / {TOTAL.toLocaleString()}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="text-[11px] rounded-md border px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
              onClick={resetAll}
              disabled={globallyLocked || loading}
            >
              Reset
            </button>
            <button
              type="button"
              className="text-[11px] rounded-md border px-3 py-1 bg-black text-white disabled:opacity-50 disabled:bg-gray-300"
              onClick={handlePurchase}
              disabled={!purchaseEnabled}
              title={
                purchaseEnabled
                  ? "Send purchase"
                  : loading
                  ? "Processing…"
                  : "Allocate exact total to enable"
              }
            >
              {purchaseLabel}
            </button>
          </div>
        </div>

        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gray-900 transition-all"
            style={{
              width: `${Math.min(100, (totalAllocated / TOTAL) * 100)}%`,
            }}
            aria-label="Progress to target"
          />
        </div>
      </div>

      {/* List + overlay */}
      <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-sm relative">
        {globallyLocked && (
          <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[1px] pointer-events-auto" />
        )}
        <ul
          className={`flex flex-col divide-y divide-gray-100 ${
            globallyLocked ? "pointer-events-none select-none opacity-60" : ""
          }`}
        >
          {feeds.map((feed, index) => {
            const priceUsd = feed.price;
            const usdEffective = (effective[index] / 100) * tokenLimits[index];
            const limitUsd = tokenLimits[index];
            const disabled = isSliderDisabled(index) || loading;

            return (
              <li key={index} className="py-2">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[190px_1fr_150px] sm:items-center">
                  {/* Identity */}
                  <div className="flex items-center gap-2">
                    <img
                      src={feed.logo}
                      alt={`${feed.name} logo`}
                      className="h-7 w-7 rounded"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <h2 className="truncate text-[13px] font-semibold">
                          {feed.name}
                        </h2>
                        <span
                          className={[
                            "inline-flex items-center rounded px-1.5 py-[1px] text-[10px] font-medium transition-opacity duration-200",
                            fade ? "opacity-40" : "opacity-100",
                            feed.trend === "up"
                              ? "bg-emerald-100 text-emerald-700"
                              : feed.trend === "down"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-gray-100 text-gray-700",
                          ].join(" ")}
                          title={`$${priceUsd.toFixed(2)} USD`}
                        >
                          {feed.trend === "up"
                            ? "▲"
                            : feed.trend === "down"
                            ? "▼"
                            : "•"}{" "}
                          ${priceUsd.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500">
                        Limit: ${limitUsd.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Slider */}
                  <div className="sm:px-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={values[index]}
                      onChange={(e) =>
                        handleChange(index, Number(e.target.value))
                      }
                      className={`w-full h-1.5 accent-black [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full ${
                        disabled ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      disabled={disabled}
                      aria-label={`Allocation for ${feed.name}`}
                    />
                    <div className="mt-0.5 flex justify-between text-[9px] text-gray-400">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                    {globallyLocked && (
                      <p className="mt-0.5 text-[10px] text-gray-600">
                        Connect your wallet on <b>Sepolia</b> to edit.
                      </p>
                    )}
                    {Math.abs(totalAllocated - TOTAL) <= 0.01 &&
                      activeSliderIndex === index &&
                      !globallyLocked &&
                      !loading && (
                        <p className="mt-0.5 text-[10px] text-amber-700">
                          At target — lower this to free up room.
                        </p>
                      )}
                  </div>

                  {/* Numbers */}
                  <div className="sm:text-right">
                    <div className="text-sm font-semibold tabular-nums">
                      ${usdEffective.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      Slider: {values[index]}% • Effective:{" "}
                      {effective[index].toFixed(2)}%
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="pt-2 w-full text-right text-[10px] text-gray-500">
          Based on <strong>Chainlink Data Feeds</strong>
        </div>
      </div>
    </div>
  );
}

/** Build approvals EXACTOS (con +1%) por token.
 * Patrón seguro: approve(0) -> approve(monto).
 */
function buildApproveCallsForInTokenAmounts(
  inTokens: Address[],
  inAmounts: bigint[],
  spender: Address = SwapPay.address as Address
): Array<{ to: Address; data: Hex }> {
  if (inTokens.length !== inAmounts.length) {
    throw new Error("MISMATCH inTokens vs inAmounts para approvals");
  }
  const calls: Array<{ to: Address; data: Hex }> = [];
  for (let i = 0; i < inTokens.length; i++) {
    const token = inTokens[i];
    const amount = inAmounts[i];
    if (!token) continue;
    if (token.toLowerCase() === NATIVE_SENTINEL.toLowerCase()) continue;
    if (amount === 0n) continue;

    // approve(0)
    calls.push({
      to: token,
      data: encodeFunctionData({
        abi: IERC20_MIN_ABI,
        functionName: "approve",
        args: [spender, 0n],
      }),
    });
    // approve(amount con +1%)
    calls.push({
      to: token,
      data: encodeFunctionData({
        abi: IERC20_MIN_ABI,
        functionName: "approve",
        args: [spender, amount],
      }),
    });
  }
  return calls;
}

function buildBuyNftCalldata(pixelAbi: any, to: Address, token: Address): Hex {
  return encodeFunctionData({
    abi: pixelAbi,
    functionName: "buyNFT",
    args: [to, token],
  });
}

function buildTokenArrays(items: PurchaseItem[]): {
  inTokens: Address[];
  inAmounts: bigint[];
  debug: Array<{ token: Address; amount: bigint; symbol: string }>;
} {
  // 1) Acumula por token (por si hay duplicados)
  const acc = new Map<Address, { amount: bigint; symbol: string }>();

  for (const it of items) {
    const token = it.contractAddress as Address | null;
    const amt = it.amountTokenBig;

    if (!token) continue; // sin address => skip
    if (token.toLowerCase() === NATIVE_SENTINEL.toLowerCase()) continue; // ETH nativo => sin approve/transferFrom
    if (amt === 0n) continue;

    const prev = acc.get(token);
    acc.set(token, { amount: (prev?.amount ?? 0n) + amt, symbol: it.name });
  }

  // 2) Preserva orden de primera aparición en items
  const seen = new Set<string>();
  const inTokens: Address[] = [];
  const inAmounts: bigint[] = [];
  const debug: Array<{ token: Address; amount: bigint; symbol: string }> = [];

  for (const it of items) {
    const token = it.contractAddress as Address | null;
    if (!token) continue;
    if (!acc.has(token as Address)) continue; // ya filtrado arriba
    if (seen.has(token.toLowerCase())) continue;
    seen.add(token.toLowerCase());

    const { amount, symbol } = acc.get(token as Address)!;
    inTokens.push(token as Address);
    // +1% buffer para que siempre sobre (cashback automático del contrato te lo devuelve en PYUSD)
    inAmounts.push((amount * 101n) / 100n);
    debug.push({ token: token as Address, amount, symbol });
  }

  return { inTokens, inAmounts, debug };
}

function buildSwapPayExecuteCalldata(params: {
  inTokens: Address[];
  inAmounts: bigint[];
  target: Address; // PixelCounterNFT.address
  buyCallData: Hex; // encodeFunctionData de buyNFT(...)
  amountPyusd: bigint; // precio del NFT en PYUSD base units (6 dec)
  minOut?: bigint; // por defecto 0n (ignorado)
}): Hex {
  const {
    inTokens,
    inAmounts,
    target,
    buyCallData,
    amountPyusd,
    minOut = 0n,
  } = params;

  if (inTokens.length !== inAmounts.length) {
    throw new Error("MISMATCH: inTokens.length !== inAmounts.length");
  }
  if (inTokens.length === 0) {
    throw new Error("EMPTY_ARRAY: no hay tokens seleccionados");
  }
  if (amountPyusd <= 0n) {
    throw new Error("INVALID_VALUE: amountPyusd debe ser > 0");
  }

  return encodeFunctionData({
    abi: SwapPay.abi,
    functionName: "execute",
    args: [inTokens, inAmounts, target, buyCallData, amountPyusd, minOut],
  });
}
