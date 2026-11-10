import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-bg-0 px-4 pb-20 pt-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grad-glow" />
      <div aria-hidden="true" className="grid-texture pointer-events-none absolute inset-0" />
      <div className="relative flex flex-col items-center gap-6 text-center">
        <Logo size={120} decorative />
        <p className="mono-num text-grad-silver text-[72px] leading-none">404</p>
        <h1 className="text-h3 max-w-[30ch] text-ink-1">
          This route went through all five layers and didn&apos;t come back.
        </h1>
        <Button href="/" size="lg">
          Back to home
        </Button>
      </div>
    </section>
  );
}
