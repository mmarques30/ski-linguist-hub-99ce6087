import { DashboardGestaoMockup } from "@/components/dashboard/mockup/DashboardGestaoMockup";

/**
 * Design-validation route for the redesigned management dashboard.
 *
 * Deliberately outside ProtectedRoute and MainLayout: it renders only static
 * sample data and carries its own shell so the full screen (navigation, header,
 * rail) can be reviewed without staff credentials. Remove once the layout is
 * approved and wired into `/`.
 */
export default function DashboardGestaoMockupPage() {
  return <DashboardGestaoMockup />;
}
