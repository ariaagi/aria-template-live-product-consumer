export default function BillingCancelPage() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center gap-2 text-center">
      <h1 className="text-2xl font-semibold">Action canceled</h1>
      <p className="text-sm text-muted-foreground">
        No changes were applied. You can retry from the billing page at any time.
      </p>
    </section>
  );
}
