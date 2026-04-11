export function PageContentSkeleton({ label = "Loading…" }: { label?: string }) {
  return (
    <div aria-busy="true" aria-label={label} className="page-skeleton">
      <div className="page-skeleton__hero">
        <div className="page-skeleton__eyebrow" />
        <div className="page-skeleton__title" />
        <div className="page-skeleton__subtitle" />
        <div className="page-skeleton__metrics">
          <div className="page-skeleton__metric" />
          <div className="page-skeleton__metric" />
          <div className="page-skeleton__metric" />
        </div>
      </div>
      <div className="page-skeleton__panel">
        <div className="page-skeleton__panel-head" />
        <div className="page-skeleton__line" />
        <div className="page-skeleton__line page-skeleton__line--mid" />
        <div className="page-skeleton__line page-skeleton__line--short" />
      </div>
      <div className="page-skeleton__panel page-skeleton__panel--compact">
        <div className="page-skeleton__panel-head page-skeleton__panel-head--sm" />
        <div className="page-skeleton__cards">
          <div className="page-skeleton__card" />
          <div className="page-skeleton__card" />
        </div>
      </div>
    </div>
  );
}
