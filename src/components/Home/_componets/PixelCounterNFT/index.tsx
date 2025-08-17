import { type JSX } from "react";
import { useSendCalls, useWalletClient } from "wagmi";
import { usePixelCounterNFT } from "../../../../hooks/contracts/pixel-counter-nft";

export function NFT(): JSX.Element {
  // hooks

  // external hooks
  const { data: walletClient } = useWalletClient();
  const { error: useSendCallsError } = useSendCalls();

  const { uri, buyNFT: buyNFTHook } = usePixelCounterNFT(walletClient);
  const { isPending: isBuyingNFT } = buyNFTHook;

  console.log("isBuyingNFT:", isBuyingNFT);

  // hooks

  return (
    <div className="flex flex-col justify-center items-center space-y-6">
      {/* {isSuccess && (
        <div className="text-green-600">Transaction successful! ID: {id}</div>
      )} */}
      {useSendCallsError && (
        <div className="text-red-600">Error: {useSendCallsError.message}</div>
      )}
      <div>
        {uri ? (
          <div className="flex flex-col justify-center items-center gap-6">
            <div className="text-center">
              <p className="mt-2">{uri.name}</p>
            </div>
            <img
              src={uri.image}
              alt={uri.name}
              className="w-64 h-64 object-cover rounded"
            />
            {/* <p className="w-1/2 s text-gray-600">{uri.description}</p> */}
          </div>
        ) : (
          <p className="text-gray-500">No URI available</p>
        )}
      </div>
    </div>
  );
}

// import { PAPJson } from "../../../../assets/contracts/PAP";
// import { PixelCounterNFT } from "../../../../assets/contracts/PixelCounterNFT";

// const publicClient = usePublicClient();
// const [isSuccess, setIsSuccess] = useState(false);
// const [id, setId] = useState<string | null>(null);
// const handleApproveAndDeposit = async () => {
//   if (!address) return;
//   if (!publicClient) return;

//   const approveData = encodeFunctionData({
//     abi: PAPJson.abi,
//     functionName: "approve",
//     args: [PixelCounterNFT.address, 1_000_000],
//   });

//   const buyNFTData = encodeFunctionData({
//     abi: PixelCounterNFT.abi,
//     functionName: "buyNFT",
//     args: [address, "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B"],
//   });

//   setLoading(true);
//   try {
//     const startNonce = await publicClient.getTransactionCount({
//       address,
//       blockTag: "latest",
//     });

//     const { id } = await sendCallsAsync({
//       calls: [
//         {
//           to: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B" as Address,
//           data: approveData,
//         },
//         {
//           to: PixelCounterNFT.address as Address,
//           data: buyNFTData,
//         },
//       ],
//     });

//     let confirmed = false;
//     while (!confirmed) {
//       const nonce = await publicClient.getTransactionCount({
//         address,
//         blockTag: "latest",
//       });

//       if (nonce > startNonce) {
//         confirmed = true;
//         console.log("Alguna transacción fue incluida.");
//       } else {
//         await new Promise((response) => setTimeout(response, 3000));
//       }
//     }

//     setId(id);
//     setIsSuccess(true);
//   } catch (error) {
//     console.error("Error:", error);
//   } finally {
//     setLoading(false);
//   }
// };
