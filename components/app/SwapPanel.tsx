"use client";

import { ArrowDownUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Card";
import { Tooltip } from "@/components/ui/Tooltip";
import { STOCKS } from "@/data/stocks";
import type { Layer } from "@/data/layers";
import { Field, SummaryRow, TokenSelect, inputClass } from "./fields";
import { LayerToggle } from "./LayerToggle";

const TOKENS = ["ETH", "USDG", ...STOCKS.map((s) => s.ticker)];

export function SwapPanel() {
  const [from, setFrom] = useState("ETH");
  const [to, setTo] = useState("USDG");
  const [amount, setAmount] = useState("");
  const [layers, setLayers] = useState<Layer["n"][]>([1, 2, 3, 4, 5]);

  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()} aria-label="Swap">
      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <Field label="from" htmlFor="swap-from">
          <TokenSelect id="swap-from" value={from} onChange={setFrom} options={TOKENS} />
        </Field>
        <button
          type="button"
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
          className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-line-2 text-ink-2 transition-colors duration-[180ms] hover:bg-surface-2 hover:text-ink-1"
          aria-label="Swap direction"
        >
          <ArrowDownUp className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        </button>
        <Field label="to" htmlFor="swap-to">
          <TokenSelect id="swap-to" value={to} onChange={setTo} options={TOKENS} />
        </Field>
      </div>

      <Field label="amount" htmlFor="swap-amount">
        <input
          id="swap-amount"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          className={`${inputClass} mono-num text-lg`}
        />
      </Field>

      <LayerToggle enabled={layers} onChange={setLayers} />

      <Divider />
      <div className="flex flex-col gap-2.5">
        <SummaryRow k="layers on" v={`${layers.length} / 5`} />
        <SummaryRow k="estimated time" v="~14 min" />
        <SummaryRow k="fees" v="network + relayer fees shown before signing" />
      </div>

      <Tooltip content="coming soon" className="w-full">
        <Button size="lg" disabled className="w-full">
          Connect wallet
        </Button>
      </Tooltip>
    </form>
  );
}
