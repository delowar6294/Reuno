"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Card";
import { Tooltip } from "@/components/ui/Tooltip";
import type { Layer } from "@/data/layers";
import { isEvmAddress } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Field, SummaryRow, TokenSelect, inputClass } from "./fields";
import { LayerToggle } from "./LayerToggle";

export function TransferPanel() {
  const [token, setToken] = useState("ETH");
  const [recipient, setRecipient] = useState("");
  const [touched, setTouched] = useState(false);
  const [amount, setAmount] = useState("");
  const [layers, setLayers] = useState<Layer["n"][]>([1, 2, 3, 4, 5]);

  const invalid = touched && recipient.length > 0 && !isEvmAddress(recipient);

  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()} aria-label="Private transfer">
      <Field
        label="recipient"
        htmlFor="tx-recipient"
        error={invalid ? "Enter a valid address: 0x followed by 40 hex characters." : undefined}
        hint="A fresh vault is created for every transfer."
      >
        <input
          id="tx-recipient"
          autoComplete="off"
          spellCheck={false}
          placeholder="0x…"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value.trim())}
          onBlur={() => setTouched(true)}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? "tx-recipient-error" : undefined}
          className={cn(inputClass, "mono-num", invalid && "border-bad hover:border-bad focus:border-bad")}
        />
      </Field>

      <div className="grid grid-cols-[1fr_120px] items-end gap-3">
        <Field label="amount" htmlFor="tx-amount">
          <input
            id="tx-amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            className={`${inputClass} mono-num text-lg`}
          />
        </Field>
        <Field label="token" htmlFor="tx-token">
          <TokenSelect id="tx-token" value={token} onChange={setToken} options={["ETH", "USDG"]} />
        </Field>
      </div>

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
