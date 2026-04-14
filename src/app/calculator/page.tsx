import type { Metadata } from "next";
import { parseCalculatorParams } from "@/lib/url-params";
import { CalculatorForm } from "@/components/calculator/calculator-form";

export const metadata: Metadata = {
  title: "Race Fuel Plan — Performance Nutrition",
  description:
    "Calculate your race fueling strategy: carbs per hour, gel schedule, fluid targets.",
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CalculatorPage({ searchParams }: Props) {
  const sp = await searchParams;
  const parsed = parseCalculatorParams(sp);

  const initialParams = parsed.valid ? parsed.params : undefined;

  // If params were present but invalid, we could show a banner — for now just
  // treat them as missing (show empty form). The form itself validates on submit.
  const showParamError = !parsed.valid && parsed.paramsPresent;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-xl px-4 py-10 sm:py-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Race Fuel Calculator
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Carb targets, gel timing, and fluid strategy for your next race.
          </p>
        </div>

        {/* Invalid URL params banner */}
        {showParamError && (
          <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            The shared link contained invalid parameters. Please fill in your
            details below.
          </div>
        )}

        <CalculatorForm initialParams={initialParams} />
      </div>
    </main>
  );
}
