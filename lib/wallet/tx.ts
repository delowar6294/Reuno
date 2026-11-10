import {
  BaseError,
  encodeFunctionData,
  erc20Abi,
  InsufficientFundsError,
  type Address,
  type Hex,
  type PublicClient,
} from "viem";
import { explainRevert } from "./revert";

/** A transaction Reuno builds unsigned. The user's own wallet signs it. */
export type TxCall =
  | { kind: "raw"; to: Address; data?: Hex; value?: bigint }
  | { kind: "erc20"; token: Address; functionName: "approve" | "transfer"; args: readonly [Address, bigint] };

export type PreflightOk = {
  status: "ok";
  gasLimit: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  /** gasLimit × maxFeePerGas (gasLimit already includes the 20% buffer). */
  gasCostWei: bigint;
  balanceWei: bigint;
};

export type PreflightResult =
  | PreflightOk
  | { status: "revert"; message: string }
  | {
      status: "funds";
      /** ETH needed for value + buffered gas, or null when gas could not be estimated. */
      neededWei: bigint | null;
      balanceWei: bigint;
      valueWei: bigint;
    }
  | { status: "error"; message: string };

export const GAS_BUFFER_PCT = 20n;

export function txTarget(call: TxCall): { to: Address; data?: Hex; value: bigint } {
  if (call.kind === "raw") return { to: call.to, data: call.data, value: call.value ?? 0n };
  return {
    to: call.token,
    data: encodeFunctionData({ abi: erc20Abi, functionName: call.functionName, args: call.args }),
    value: 0n,
  };
}

const isFundsError = (e: unknown) =>
  (e instanceof BaseError && !!e.walk((x) => x instanceof InsufficientFundsError)) ||
  /insufficient funds/i.test((e as { message?: string })?.message ?? "");

/**
 * Simulates the call, estimates gas and EIP-1559 fees on Robinhood Chain, and checks the ETH balance.
 * Nothing is sent and the wallet is not opened.
 */
export async function preflightTx(
  pc: PublicClient,
  account: Address,
  call: TxCall,
  ticker?: string,
): Promise<PreflightResult> {
  const { to, data, value } = txTarget(call);
  let balance: bigint;
  let fees: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint };
  try {
    [balance, fees] = await Promise.all([pc.getBalance({ address: account }), pc.estimateFeesPerGas()]);
  } catch {
    return { status: "error", message: "Could not reach Robinhood Chain. Check your connection and try again." };
  }
  if (balance < value) {
    // Size the gas anyway (as if the wallet held the value) so we can say exactly how much ETH is needed.
    // eth_estimateGas with a state override is supported by the official Robinhood Chain RPC (checked 2026-11-11).
    try {
      const gas = await pc.estimateGas({
        account,
        to,
        data,
        value,
        stateOverride: [{ address: account, balance: value * 2n + 10n ** 18n }],
      });
      const gasCostWei = ((gas * (100n + GAS_BUFFER_PCT)) / 100n) * fees.maxFeePerGas;
      return { status: "funds", neededWei: value + gasCostWei, balanceWei: balance, valueWei: value };
    } catch {
      return { status: "funds", neededWei: null, balanceWei: balance, valueWei: value };
    }
  }

  // 1. Simulate. A revert here means the wallet is never opened.
  try {
    if (call.kind === "erc20") {
      await pc.simulateContract({
        account,
        address: call.token,
        abi: erc20Abi,
        functionName: call.functionName,
        args: call.args,
      });
    } else {
      await pc.call({ account, to, data, value });
    }
  } catch (e) {
    if (isFundsError(e)) return { status: "funds", neededWei: null, balanceWei: balance, valueWei: value };
    return { status: "revert", message: explainRevert(e, { ticker }) };
  }

  // 2. Gas + fees, with a 20% buffer on the gas limit.
  let gas: bigint;
  try {
    gas = await pc.estimateGas({ account, to, data, value });
  } catch (e) {
    if (isFundsError(e)) return { status: "funds", neededWei: null, balanceWei: balance, valueWei: value };
    return { status: "revert", message: explainRevert(e, { ticker }) };
  }
  const gasLimit = (gas * (100n + GAS_BUFFER_PCT)) / 100n;
  const gasCostWei = gasLimit * fees.maxFeePerGas;
  const neededWei = value + gasCostWei;
  if (balance < neededWei) return { status: "funds", neededWei, balanceWei: balance, valueWei: value };

  return {
    status: "ok",
    gasLimit,
    maxFeePerGas: fees.maxFeePerGas,
    maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
    gasCostWei,
    balanceWei: balance,
  };
}

/** After a reverted receipt, replay the call at that block to recover a reason. */
export async function revertReasonAt(
  pc: PublicClient,
  account: Address,
  call: TxCall,
  blockNumber: bigint,
  ticker?: string,
): Promise<string> {
  const { to, data, value } = txTarget(call);
  try {
    await pc.call({ account, to, data, value, blockNumber });
    return "The transaction reverted on-chain.";
  } catch (e) {
    return explainRevert(e, { ticker, onchain: true });
  }
}
