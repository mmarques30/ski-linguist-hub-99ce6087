/**
 * Kit d'interface FLI — briques visuelles partagées par tout le back-office.
 *
 * Point d'entrée unique : `import { PageShell, StatTile } from "@/components/ui-kit"`.
 *
 * Les composants ne portent aucune logique métier : ils reçoivent des données
 * déjà calculées et des libellés déjà traduits. Les helpers existants
 * (`inscription-status`, `payment-methods`, `chrome-i18n`…) restent la source
 * de vérité.
 */

export { PageHeader, PageShell, SectionHeading } from "./PageHeader";
export { SurfaceCard, CardGrid, SplitLayout } from "./SurfaceCard";
export { StatTile, StatTileGrid, IconChip, DeltaBadge } from "./StatTile";
export type { StatTileDelta } from "./StatTile";
export { StatusPill, toneForStatus } from "./StatusPill";
export type { PillTone } from "./StatusPill";
export { SegmentedControl, SubNav, FilterBar } from "./Controls";
export type { SegmentOption, SubNavItem } from "./Controls";
export {
  TableFrame,
  TableHeadRow,
  TableHeadCell,
  TableRow,
  TableCell,
  IdentityCell,
  TablePagination,
  TableSkeleton,
  TableEmpty,
  CardList,
  CardListItem,
} from "./DataTable";
export { ActivityFeed, AvatarStack, DefinitionList } from "./Feed";
export type { FeedItem } from "./Feed";

export {
  ChartFrame,
  ChartTooltipCard,
  ChartLegend,
  ChartEmpty,
  makeTooltipRenderer,
  axisProps,
  gridProps,
} from "./charts/ChartPrimitives";
export { TrendChart } from "./charts/TrendChart";
export type { TrendSeries } from "./charts/TrendChart";
export { BarsChart } from "./charts/BarsChart";
export type { BarSeries } from "./charts/BarsChart";
export { DonutChart, RadialRings } from "./charts/DonutChart";
export type { DonutSlice } from "./charts/DonutChart";
export { RankedBarList, ProgressRing, GaugeMeter, MeterRow } from "./charts/Meters";
export type { RankedBarItem } from "./charts/Meters";
export { Sparkline, FunnelBars } from "./charts/Sparkline";
export type { FunnelStageItem } from "./charts/Sparkline";

export {
  SERIES_COLORS,
  SEQUENTIAL_COLORS,
  STATE_COLORS,
  CHART_CHROME,
  seriesColor,
  foldToSeriesCap,
  TILE_TONES,
} from "./palette";
export type { TileTone, StateTone } from "./palette";
