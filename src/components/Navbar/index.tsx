import type { JSX } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Navbar(): JSX.Element {
  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="flex-1">
        <a className="btn btn-ghost text-xl">SwapPay</a>
      </div>
      <div className="flex-none">
        <ConnectButton />
      </div>
    </div>
  );
}
