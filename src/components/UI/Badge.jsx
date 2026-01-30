import './Badge.css';

const variants = {
    default: 'badge--default',
    success: 'badge--success',
    warning: 'badge--warning',
    danger: 'badge--danger',
    info: 'badge--info',
    purple: 'badge--purple',
};

export default function Badge({ children, variant = 'default', size = 'md', className = '' }) {
    return (
        <span className={`badge badge--${size} ${variants[variant] || variants.default} ${className}`}>
            {children}
        </span>
    );
}
