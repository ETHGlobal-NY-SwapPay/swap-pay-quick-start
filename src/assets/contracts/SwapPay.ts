export const SwapPay = {
  address: "0x40392Fe96c7e49A7109A1b990C797C3358092923",
  abi: [
    {
      inputs: [
        {
          internalType: "address",
          name: "_dai",
          type: "address",
        },
        {
          internalType: "address",
          name: "_link",
          type: "address",
        },
        {
          internalType: "address",
          name: "_usdc",
          type: "address",
        },
        {
          internalType: "address",
          name: "_wbtc",
          type: "address",
        },
        {
          internalType: "address",
          name: "_wsteth",
          type: "address",
        },
        {
          internalType: "address",
          name: "_pyusd",
          type: "address",
        },
        {
          internalType: "contract AggregatorV3Interface",
          name: "_daiUsdFeed",
          type: "address",
        },
        {
          internalType: "contract AggregatorV3Interface",
          name: "_ethUsdFeed",
          type: "address",
        },
        {
          internalType: "contract AggregatorV3Interface",
          name: "_linkUsdFeed",
          type: "address",
        },
        {
          internalType: "contract AggregatorV3Interface",
          name: "_usdcUsdFeed",
          type: "address",
        },
        {
          internalType: "contract AggregatorV3Interface",
          name: "_wbtcUsdFeed",
          type: "address",
        },
        {
          internalType: "contract AggregatorV3Interface",
          name: "_wstethUsdFeed",
          type: "address",
        },
        {
          internalType: "contract AggregatorV3Interface",
          name: "_pyusdUsdFeed",
          type: "address",
        },
      ],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      inputs: [],
      name: "AMOUNT_MISMATCH",
      type: "error",
    },
    {
      inputs: [],
      name: "EMPTY_ARRAY",
      type: "error",
    },
    {
      inputs: [],
      name: "INSUFFICIENT_ALLOWANCE",
      type: "error",
    },
    {
      inputs: [],
      name: "INSUFFICIENT_BALANCE",
      type: "error",
    },
    {
      inputs: [],
      name: "INSUFFICIENT_TREASURY",
      type: "error",
    },
    {
      inputs: [],
      name: "INSUFFICIENT_USD_VALUE",
      type: "error",
    },
    {
      inputs: [],
      name: "INVALID_CALL_FUNCTION_DATA",
      type: "error",
    },
    {
      inputs: [],
      name: "INVALID_VALUE",
      type: "error",
    },
    {
      inputs: [],
      name: "MISMATCH",
      type: "error",
    },
    {
      inputs: [],
      name: "PAYMENT_NOT_PYUSD",
      type: "error",
    },
    {
      inputs: [],
      name: "TOKEN_ALREADY_EXISTS",
      type: "error",
    },
    {
      inputs: [],
      name: "TOKEN_NOT_FOUND",
      type: "error",
    },
    {
      inputs: [],
      name: "TOKEN_NOT_SUPPORTED",
      type: "error",
    },
    {
      inputs: [],
      name: "ZERO_ADDRESS",
      type: "error",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "payer",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "usdExcess1e8",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "pyusdAmount",
          type: "uint256",
        },
      ],
      name: "CashbackSent",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "payer",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "usdSpent1e8",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "pyusdPaid",
          type: "uint256",
        },
        {
          indexed: true,
          internalType: "address",
          name: "target",
          type: "address",
        },
        {
          indexed: false,
          internalType: "bytes",
          name: "callFunctionData",
          type: "bytes",
        },
      ],
      name: "PaymentExecuted",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "token",
          type: "address",
        },
      ],
      name: "TokenAdded",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "token",
          type: "address",
        },
      ],
      name: "TokenRemoved",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "from",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "TreasuryFunded",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "token",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "TreasuryWithdrawn",
      type: "event",
    },
    {
      inputs: [],
      name: "NATIVE",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_token",
          type: "address",
        },
      ],
      name: "addToToken",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address[]",
          name: "_tokens",
          type: "address[]",
        },
        {
          internalType: "uint256[]",
          name: "_amounts",
          type: "uint256[]",
        },
        {
          internalType: "address",
          name: "_target",
          type: "address",
        },
        {
          internalType: "bytes",
          name: "_callFunctionData",
          type: "bytes",
        },
        {
          internalType: "uint256",
          name: "_amount",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      name: "execute",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_account",
          type: "address",
        },
      ],
      name: "getBalances",
      outputs: [
        {
          components: [
            {
              internalType: "uint256",
              name: "eth",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "wbtc",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "dai",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "usdc",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "link",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "wsteth",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "pyusd",
              type: "uint256",
            },
          ],
          internalType: "struct IFeeds.Balances",
          name: "balances",
          type: "tuple",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "getPrices",
      outputs: [
        {
          components: [
            {
              internalType: "int256",
              name: "ethUsd",
              type: "int256",
            },
            {
              internalType: "int256",
              name: "wbtcUsd",
              type: "int256",
            },
            {
              internalType: "int256",
              name: "daiUsd",
              type: "int256",
            },
            {
              internalType: "int256",
              name: "usdcUsd",
              type: "int256",
            },
            {
              internalType: "int256",
              name: "linkUsd",
              type: "int256",
            },
            {
              internalType: "int256",
              name: "wstethUsd",
              type: "int256",
            },
            {
              internalType: "int256",
              name: "pyusdUsd",
              type: "int256",
            },
          ],
          internalType: "struct IFeeds.Prices",
          name: "prices",
          type: "tuple",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_token",
          type: "address",
        },
      ],
      name: "isTokenSupported",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_token",
          type: "address",
        },
      ],
      name: "removeFromTokens",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "token",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "amountToken",
          type: "uint256",
        },
      ],
      name: "tokenToUsd",
      outputs: [
        {
          internalType: "uint256",
          name: "usd1e8",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      stateMutability: "payable",
      type: "receive",
    },
  ],
};
