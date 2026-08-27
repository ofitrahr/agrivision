const Card = ({ title, actionLabel, onAction, children, style, className = '' }) => {
  return (
    <div className={`card ${className}`.trim()} style={style}>
      {(title || actionLabel) && (
        <div className="card-header">
          {title && <span className="card-title">{title}</span>}
          {actionLabel && (
            <button className="btn btn-ghost btn-sm" onClick={onAction}>
              {actionLabel}
            </button>
          )}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </div>
  );
};

export default Card;
