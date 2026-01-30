import './StatCard.css';

export default function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendLabel,
    accentColor = 'blue'
}) {
    const trendClass = trend > 0 ? 'stat-card__trend--up' : trend < 0 ? 'stat-card__trend--down' : '';

    return (
        <div className={`stat-card glass-card stat-card--${accentColor}`}>
            <div className="stat-card__header">
                <span className="stat-card__title">{title}</span>
                {Icon && (
                    <div className="stat-card__icon">
                        <Icon size={20} />
                    </div>
                )}
            </div>
            <div className="stat-card__value">{value}</div>
            {(subtitle || trend !== undefined) && (
                <div className="stat-card__footer">
                    {subtitle && <span className="stat-card__subtitle">{subtitle}</span>}
                    {trend !== undefined && (
                        <span className={`stat-card__trend ${trendClass}`}>
                            {trend > 0 ? '+' : ''}{trend}% {trendLabel}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
