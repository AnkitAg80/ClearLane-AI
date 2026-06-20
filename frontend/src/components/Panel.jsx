export default function Panel({ title, eyebrow, actions, children, className = '' }) {
  return (
    <section className={`panel ${className}`}>
      {(title || actions) && (
        <div className="panel__header">
          <div>
            {eyebrow && <span className="panel__eyebrow">{eyebrow}</span>}
            {title && <h2>{title}</h2>}
          </div>
          {actions && <div className="panel__actions">{actions}</div>}
        </div>
      )}
      <div className="panel__body">{children}</div>
    </section>
  );
}
