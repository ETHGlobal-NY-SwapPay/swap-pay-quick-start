import {
  type Abi,
  type Address,
  type WalletClient,
  createPublicClient,
  getContract,
  http,
} from "viem";

import { sepolia } from "viem/chains";

import { estimateFeesPerGas } from "viem/actions";

export class BaseContract {
  private address: Address;
  private abi: Abi;
  private publicClient: ReturnType<typeof createPublicClient>;
  private walletClient: WalletClient | null;

  constructor(contract: any, walletClient?: WalletClient) {
    this.address = contract.address as Address;
    this.abi = contract.abi;

    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });

    this.walletClient = walletClient ?? null;
  }

  // =========================
  //         GETTERS
  // =========================

  public getAddress() {
    if (!this.address) {
      throw new Error("Contract address not set. Please set it first.");
    }
    return this.address;
  }

  public getPublicClient() {
    return this.publicClient;
  }

  public getWalletClient() {
    return this.walletClient;
  }

  // =========================
  //         SETTERS
  // =========================

  public setWalletClient(walletClient: WalletClient) {
    this.walletClient = walletClient;
  }

  // =========================
  //       PUBLIC METHODS
  // =========================

  // =========================
  //     PROTECTED METHODS
  // =========================

  protected async getFees() {
    if (!this.walletClient) {
      throw new Error("walletClient not set. Call setWalletClient() first.");
    }

    return await estimateFeesPerGas(this.walletClient);
  }

  protected getReadContract() {
    return getContract({
      address: this.address,
      abi: this.abi,
      client: {
        public: this.publicClient,
      },
    });
  }

  protected getWriteContract() {
    if (!this.walletClient) {
      throw new Error("walletClient not set. Call setWalletClient() first.");
    }

    return getContract({
      address: this.address,
      abi: this.abi,
      client: {
        public: this.publicClient,
        wallet: this.walletClient,
      },
    });
  }
}
