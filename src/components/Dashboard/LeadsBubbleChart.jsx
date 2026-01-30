import { useMemo, useState } from 'react';
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ReferenceLine
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { getProbabilityLevel } from '../../data/types';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import './LeadsBubbleChart.css';

// Custom Tooltip
const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const probabilityLevel = getProbabilityLevel(data.probability);

        return (
            <div className="bubble-tooltip glass-card">
                <h4 className="bubble-tooltip__title">{data.name}</h4>
                <p className="bubble-tooltip__client">{data.clientName}</p>
                <div className="bubble-tooltip__stats">
                    <div className="bubble-tooltip__stat">
                        <span className="bubble-tooltip__label">予算</span>
                        <span className="bubble-tooltip__value">
                            ¥{(data.estimatedBudget / 10000).toLocaleString()}万
                        </span>
                    </div>
                    <div className="bubble-tooltip__stat">
                        <span className="bubble-tooltip__label">受注確度</span>
                        <span
                            className="bubble-tooltip__value"
                            style={{ color: probabilityLevel.color }}
                        >
                            {data.probability}% ({probabilityLevel.label})
                        </span>
                    </div>
                    <div className="bubble-tooltip__stat">
                        <span className="bubble-tooltip__label">想定開始</span>
                        <span className="bubble-tooltip__value">{data.formattedDate}</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default function LeadsBubbleChart({ onSelectLead }) {
    const { leads } = useApp();
    const [hoveredId, setHoveredId] = useState(null);

    // Transform leads data for the chart
    const chartData = useMemo(() => {
        return leads.map(lead => {
            const startDate = parseISO(lead.startDate);
            return {
                ...lead,
                x: startDate.getTime(), // X-axis: Start date as timestamp
                y: lead.estimatedBudget / 10000, // Y-axis: Budget in 万円
                z: lead.estimatedBudget / 1000000, // Bubble size
                formattedDate: format(startDate, 'yyyy年M月', { locale: ja })
            };
        });
    }, [leads]);

    // Get color based on probability
    const getColor = (probability) => {
        const level = getProbabilityLevel(probability);
        return level.color;
    };

    // Calculate axis domains
    const xDomain = useMemo(() => {
        if (chartData.length === 0) return [Date.now(), Date.now()];
        const dates = chartData.map(d => d.x);
        const min = Math.min(...dates);
        const max = Math.max(...dates);
        // Add padding
        const padding = (max - min) * 0.1 || 30 * 24 * 60 * 60 * 1000;
        return [min - padding, max + padding];
    }, [chartData]);

    const yDomain = useMemo(() => {
        if (chartData.length === 0) return [0, 100];
        const budgets = chartData.map(d => d.y);
        const max = Math.max(...budgets);
        return [0, max * 1.2];
    }, [chartData]);

    // Format X-axis tick
    const formatXAxis = (timestamp) => {
        return format(new Date(timestamp), 'M月', { locale: ja });
    };

    // Format Y-axis tick
    const formatYAxis = (value) => {
        return `${value.toLocaleString()}万`;
    };

    return (
        <div className="leads-bubble-chart">
            <div className="leads-bubble-chart__legend">
                <span className="leads-bubble-chart__legend-title">受注確度:</span>
                <div className="leads-bubble-chart__legend-item">
                    <span
                        className="leads-bubble-chart__legend-dot"
                        style={{ background: 'var(--color-prob-high)' }}
                    />
                    高 (80%+)
                </div>
                <div className="leads-bubble-chart__legend-item">
                    <span
                        className="leads-bubble-chart__legend-dot"
                        style={{ background: 'var(--color-prob-medium)' }}
                    />
                    中 (50-79%)
                </div>
                <div className="leads-bubble-chart__legend-item">
                    <span
                        className="leads-bubble-chart__legend-dot"
                        style={{ background: 'var(--color-prob-low)' }}
                    />
                    低 (25-49%)
                </div>
                <div className="leads-bubble-chart__legend-item">
                    <span
                        className="leads-bubble-chart__legend-dot"
                        style={{ background: 'var(--color-prob-uncertain)' }}
                    />
                    不確定 (&lt;25%)
                </div>
            </div>

            <ResponsiveContainer width="100%" height={400}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 40 }}>
                    <XAxis
                        type="number"
                        dataKey="x"
                        domain={xDomain}
                        tickFormatter={formatXAxis}
                        stroke="var(--color-text-muted)"
                        tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                        axisLine={{ stroke: 'var(--color-border)' }}
                        tickLine={{ stroke: 'var(--color-border)' }}
                        name="開始予定"
                    />
                    <YAxis
                        type="number"
                        dataKey="y"
                        domain={yDomain}
                        tickFormatter={formatYAxis}
                        stroke="var(--color-text-muted)"
                        tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                        axisLine={{ stroke: 'var(--color-border)' }}
                        tickLine={{ stroke: 'var(--color-border)' }}
                        name="予算"
                        label={{
                            value: '予算',
                            angle: -90,
                            position: 'insideLeft',
                            fill: 'var(--color-text-secondary)',
                            fontSize: 12
                        }}
                    />
                    <ZAxis
                        type="number"
                        dataKey="z"
                        range={[100, 1000]}
                        name="規模"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Scatter
                        data={chartData}
                        onClick={(data) => onSelectLead && onSelectLead(data.id)}
                        onMouseEnter={(data) => setHoveredId(data.id)}
                        onMouseLeave={() => setHoveredId(null)}
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={getColor(entry.probability)}
                                fillOpacity={hoveredId === entry.id ? 1 : 0.7}
                                stroke={hoveredId === entry.id ? 'white' : 'transparent'}
                                strokeWidth={hoveredId === entry.id ? 2 : 0}
                                style={{
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    filter: hoveredId === entry.id ? 'drop-shadow(0 0 8px ' + getColor(entry.probability) + ')' : 'none'
                                }}
                            />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
}
