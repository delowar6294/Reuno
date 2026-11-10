import {
  BaseError,
  ContractFunctionRevertedError,
  decodeErrorResult,
  InsufficientFundsError,
  parseAbi,
  type Hex,
} from "viem";

// Common revert errors from OpenZeppelin v5 ERC-20 / Pausable / AccessControl, so custom errors decode to names.
const KNOWN_ERRORS = parseAbi([
  "error Error(string message)",
  "error Panic(uint256 code)",
  "error EnforcedPause()",
  "error ExpectedPause()",
  "error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed)",
  "error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed)",
  "error ERC20InvalidReceiver(address receiver)",
  "error ERC20InvalidSender(address sender)",
  "error AccessControlUnauthorizedAccount(address account, bytes32 neededRole)",
  "error OwnableUnauthorizedAccount(address account)",
]);

/** Pulls the most specific revert reason (string, custom error name or selector) out of a viem/wallet error. */
export function extractRevert(err: unknown): string | null {
  if (err instanceof BaseError) {
    const reverted = err.walk((e) => e instanceof ContractFunctionRevertedError) as ContractFunctionRevertedError | null;
    if (reverted) {
      if (reverted.reason) return reverted.reason;
      if (reverted.data?.errorName) return reverted.data.errorName;
      if (reverted.raw) {
        try {
          return decodeErrorResult({ abi: KNOWN_ERRORS, data: reverted.raw }).errorName;
        } catch {
          // unknown custom error; fall through to the selector
        }
      }
      if (reverted.signature) return `custom error ${reverted.signature}`;
    }
    const withData = err.walk((e) => typeof (e as { data?: unknown }).data === "string") as { data?: Hex } | null;
    const data = withData?.data;
    if (data && data.length >= 10) {
      try {
        const decoded = decodeErrorResult({ abi: KNOWN_ERRORS, data });
        if (decoded.errorName === "Error" && typeof decoded.args?.[0] === "string") return decoded.args[0];
        if (decoded.errorName === "Panic") return `panic ${String(decoded.args?.[0])}`;
        return decoded.errorName;
      } catch {
        return `custom error ${data.slice(0, 10)}`;
      }
    }
    if (err.walk((e) => e instanceof InsufficientFundsError)) return "insufficient funds";
    const details = (err as BaseError).details;
    if (details) return details;
    return err.shortMessage;
  }
  const e = err as { message?: string };
  return e?.message ?? null;
}

/**
 * Plain-words explanation of why a transaction would fail (or failed).
 * `ticker` lets stock-token restrictions read naturally, e.g. "TSLA token trading is paused right now".
 */
export function explainRevert(err: unknown, { ticker, onchain = false }: { ticker?: string; onchain?: boolean } = {}): string {
  const reason = extractRevert(err) ?? "";
  const t = ticker ? `${ticker} token` : "This token";
  if (/EnforcedPause|paused|halt|market.?closed|trading.?(is.?)?(closed|disabled|not.?open|suspended)|outside.*(hours|window)/i.test(reason)) {
    return `${t} trading is paused right now.`;
  }
  if (/restrict|blacklist|blocklist|denylist|sanction|not.?allowed|whitelist|allowlist|Unauthori[sz]ed|forbidden|compliance|frozen|jurisdiction/i.test(reason)) {
    return `${t} transfers are restricted for this wallet right now.`;
  }
  if (/ERC20InsufficientBalance|insufficient balance|exceeds balance|transfer amount exceeds/i.test(reason)) {
    return "Not enough token balance for this amount.";
  }
  if (/ERC20InvalidReceiver|transfer to the zero address|invalid receiver/i.test(reason)) {
    return `${t} can't be sent to that address.`;
  }
  if (/insufficient funds/i.test(reason)) return "Not enough ETH on Robinhood Chain to cover this transaction and gas.";
  if (/ERC20InsufficientAllowance|allowance/i.test(reason)) return "The token approval is too low. Approve first, then try again.";
  if (/too little received|INSUFFICIENT_OUTPUT|slippage|Too little|amountOutMin|min.?return/i.test(reason)) {
    return "The price moved past the 0.5% slippage limit. Get a fresh quote.";
  }
  if (/deadline|expired|Transaction too old/i.test(reason)) return "This quote expired. Get a fresh quote.";
  const prefix = onchain ? "The transaction reverted" : "The transaction would fail";
  return reason ? `${prefix}: ${reason.slice(0, 160)}` : `${prefix} (the contract gave no reason).`;
}
