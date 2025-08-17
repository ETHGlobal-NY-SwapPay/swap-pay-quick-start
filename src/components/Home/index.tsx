import { type JSX } from "react";
import { NFT } from "./_componets/PixelCounterNFT";
import { Assets } from "./_componets/Assets";

export function Home(): JSX.Element {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Columna izquierda (crece) */}
        <div className="min-w-0">
          <Assets />
        </div>

        {/* Columna derecha (ancho fijo) */}
        <div className="min-w-0">
          <NFT />
        </div>
      </div>
    </div>
  );
}
