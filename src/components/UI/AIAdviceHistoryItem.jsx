import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import Badge from './Badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import './AIAdviceHistoryItem.css';

export default function AIAdviceHistoryItem({ advice, className = '' }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const lines = advice.content.split('\n');
    const hasMore = lines.length > 3;
    const displayedLines = isExpanded ? lines : lines.slice(0, 3);

    return (
        <div className={`ai-advice-item ${className} ${isExpanded ? 'ai-advice-item--expanded' : ''}`}>
            <div className="ai-advice-item__header" onClick={() => hasMore && setIsExpanded(!isExpanded)} style={{ cursor: hasMore ? 'pointer' : 'default' }}>
                <div className="ai-advice-item__meta">
                    <span className="ai-advice-item__date">
                        {format(parseISO(advice.generatedAt), 'yyyy/MM/dd HH:mm', { locale: ja })}
                    </span>
                    <Badge variant="info" size="sm">AI</Badge>
                </div>
                {hasMore && (
                    <button className="ai-advice-item__toggle">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                )}
            </div>
            <div className="ai-advice-item__content">
                {displayedLines.map((line, i) => (
                    <p key={i}>{line || <br />}</p>
                ))}
                {!isExpanded && hasMore && (
                    <div
                        className="ai-advice-item__more"
                        onClick={() => setIsExpanded(true)}
                    >
                        ...続きを表示
                    </div>
                )}
            </div>
            {isExpanded && (
                <button
                    className="ai-advice-item__collapse"
                    onClick={() => setIsExpanded(false)}
                >
                    閉じる
                </button>
            )}
        </div>
    );
}
