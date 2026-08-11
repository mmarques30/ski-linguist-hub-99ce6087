import { useState } from "react";
import { InsightsRail } from "./InsightsRail";
import { KpiBand } from "./KpiBand";
import { MockupShell, type Period } from "./MockupShell";
import { OperationsSection } from "./OperationsSection";
import { PipelineFunnel } from "./PipelineFunnel";
import { RevenueSection } from "./RevenueSection";

/**
 * Proposed layout for the management dashboard, reading top-to-bottom as a
 * decision path: headline KPIs → where revenue comes from → where the pipeline
 * leaks → what to act on today.
 *
 * Sample data only; the period control is presentational at this stage.
 */
export function DashboardGestaoMockup() {
  const [period, setPeriod] = useState<Period>("season");

  return (
    <MockupShell period={period} onPeriodChange={setPeriod} rail={<InsightsRail />}>
      <KpiBand />
      <RevenueSection />
      <PipelineFunnel />
      <OperationsSection />
    </MockupShell>
  );
}
