import { DISCLAIMER } from "../domain/helpers";

export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return <aside className={`disclaimer ${compact ? "compact" : ""}`} aria-label="产品边界">{DISCLAIMER}</aside>;
}
