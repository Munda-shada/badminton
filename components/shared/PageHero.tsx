import type { ReactNode } from "react";

import { MetricTile } from "@/components/shared/MetricTile";

export function PageHero({
  eyebrow,
  title,
  subtitle,
  metrics,
  sidePanel,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  metrics: Array<{ label: string; value: string | number }>;
  sidePanel?: ReactNode;
}) {
  return (
    <section className="hero-banner">
      <div className="hero-banner__main">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="lede">{subtitle}</p>

        <div className="metric-strip">
          {metrics.map((metric) => (
            <MetricTile key={metric.label} label={metric.label} value={metric.value} />
          ))}
        </div>
      </div>
      {sidePanel ? <div className="hero-banner__side">{sidePanel}</div> : null}
    </section>
  );
}
