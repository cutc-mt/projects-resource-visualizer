import './Card.css';

export default function Card({ children, className = '', onClick, hoverable = false }) {
    return (
        <div
            className={`card glass-card ${hoverable ? 'card--hoverable' : ''} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className = '' }) {
    return <div className={`card__header ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
    return <h3 className={`card__title ${className}`}>{children}</h3>;
}

export function CardContent({ children, className = '' }) {
    return <div className={`card__content ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
    return <div className={`card__footer ${className}`}>{children}</div>;
}
