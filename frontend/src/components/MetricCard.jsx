export default function MetricCard({ icon: Icon, label, value, sublabel, tone = 'neutral', tooltip }) {
  return (
    <article className={`metric-card metric-card--${tone}`} title={tooltip}>
      <div className="metric-card__top">
        <span>{label}</span>
        {Icon && <Icon size={18} aria-hidden="true" />}
      </div>
      <strong>{value ?? 'N/A'}</strong>
      {sublabel && <small>{sublabel}</small>}
    </article>
  );
}
