import { useAccount, usePublicClient, useSendCalls } from "wagmi";
import { encodeFunctionData, parseEther, type Address, type Hex } from "viem";
import { PAPJson } from "./assets/abis/PAP";
import { ERC20Deposit } from "./assets/abis/ERC20Deposit";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState } from "react";

const amount = parseEther("1");

export default function App() {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const { sendCallsAsync, error: useSendCallsError } = useSendCalls();

  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [id, setId] = useState<string | null>(null);

  const handleApproveAndDeposit = async () => {
    if (!address) return;
    if (!publicClient) return;

    const approveData = encodeFunctionData({
      abi: PAPJson.abi,
      functionName: "approve",
      args: [ERC20Deposit.address, amount],
    });

    const depositData = encodeFunctionData({
      abi: ERC20Deposit.abi,
      functionName: "deposit",
      args: [PAPJson.address, amount],
    });

    setLoading(true);
    try {
      const startNonce = await publicClient.getTransactionCount({
        address,
        blockTag: "latest",
      });

      const { id } = await sendCallsAsync({
        calls: [
          {
            to: PAPJson.address as Address,
            data: approveData,
          },
          {
            to: ERC20Deposit.address as Address,
            data: depositData,
          },
        ],
        experimental_fallback: true,
      });

      let confirmed = false;
      while (!confirmed) {
        const nonce = await publicClient.getTransactionCount({
          address,
          blockTag: "latest",
        });

        if (nonce > startNonce) {
          confirmed = true;
          console.log("Alguna transacción fue incluida.");
        } else {
          await new Promise((response) => setTimeout(response, 3000));
        }
      }

      setId(id);
      setIsSuccess(true);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center p-6 gap-4">
      <h2 className="text-xl font-semibold">Approve & Deposit</h2>
      <ConnectButton />
      <button
        onClick={handleApproveAndDeposit}
        disabled={!address || loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Processing..." : "Approve and Deposit"}
      </button>
      {isSuccess && (
        <div className="text-green-600">Transaction successful! ID: {id}</div>
      )}
      {useSendCallsError && (
        <div className="text-red-600">Error: {useSendCallsError.message}</div>
      )}
    </div>
  );
}
