import { getBuildConfig } from "@/config/build-config";
import { BillingPanel } from "@/features/billing/components/billing-panel";

export default function BillingPage() {
  return <BillingPanel buildConfig={getBuildConfig()} />;
}
