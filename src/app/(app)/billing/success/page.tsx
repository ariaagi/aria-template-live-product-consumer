import { CheckCircle2 } from "lucide-react";

export default function BillingSuccessPage() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center gap-2 text-center">
      <CheckCircle2 className="h-10 w-10 text-emerald-600" />
      <h1 className="text-2xl font-semibold">Billing updated</h1>
      <p className="text-sm text-muted-foreground">
        Your payment action completed successfully.
      </p>
    </section>
  );
}
