export default function BillingPendingPage() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center gap-2 text-center">
      <h1 className="text-2xl font-semibold">Action pending</h1>
      <p className="text-sm text-muted-foreground">
        We are verifying your billing status. Refresh in a few seconds.
      </p>
    </section>
  );
}
