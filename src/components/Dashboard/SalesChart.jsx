import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, ComposedChart, Area
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
    calculateMonthlySales,
    calculateCumulativeSales,
    generateFiscalYearMonths,
    getCurrentFiscalYear,
    CALC_MODE
} from '../../utils/salesCalculations';
import './SalesChart.css';

/**
 * Sales Chart Component
 * Displays monthly and cumulative sales data with confirmed and forecast values
 */
export default function SalesChart() {
    const { projects, probabilityWeights } = useApp();

    // State for chart configuration
    const [calcMode, setCalcMode] = useState(CALC_MODE.REVENUE); // 'revenue' or 'order'
    const [chartType, setChartType] = useState('monthly'); // 'monthly' or 'cumulative'
    const [fiscalYear, setFiscalYear] = useState(getCurrentFiscalYear());

    // Calculate chart data
    const chartData = useMemo(() => {
        const months = generateFiscalYearMonths(fiscalYear);
        const monthlySales = calculateMonthlySales(projects, months, probabilityWeights, calcMode);
        const cumulativeSales = calculateCumulativeSales(monthlySales);

        // Format for display
        return cumulativeSales.map(data => ({
            ...data,
            monthLabel: format(parseISO(data.month + '-01'), 'M月', { locale: ja }),
            // Convert to 万円 for display
            confirmedDisplay: Math.round(data.confirmed / 10000),
            forecastDisplay: Math.round(data.forecast / 10000),
            totalDisplay: Math.round(data.total / 10000),
            cumulativeConfirmedDisplay: Math.round(data.cumulativeConfirmed / 10000),
            cumulativeForecastDisplay: Math.round(data.cumulativeForecast / 10000),
            cumulativeTotalDisplay: Math.round(data.cumulativeTotal / 10000),
        }));
    }, [projects, probabilityWeights, calcMode, fiscalYear]);

    // Summary totals
    const totals = useMemo(() => {
        const last = chartData[chartData.length - 1] || {};
        return {
            confirmed: last.cumulativeConfirmedDisplay || 0,
            forecast: last.cumulativeForecastDisplay || 0,
            total: last.cumulativeTotalDisplay || 0,
        };
    }, [chartData]);

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;

        return (
            <div className="sales-chart__tooltip">
                <p className="sales-chart__tooltip-label">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} style={{ color: entry.color }}>
                        {entry.name}: ¥{entry.value.toLocaleString()}万
                    </p>
                ))}
            </div>
        );
    };

    const modeLabel = calcMode === CALC_MODE.REVENUE ? '売上' : '受注';
    const fiscalYearLabel = `${fiscalYear}年度`;

    return (
        <div className="sales-chart">
            {/* Controls */}
            <div className="sales-chart__controls">
                <div className="sales-chart__control-group">
                    <label>表示モード</label>
                    <div className="sales-chart__toggle">
                        <button
                            className={`sales-chart__toggle-btn ${calcMode === CALC_MODE.REVENUE ? 'sales-chart__toggle-btn--active' : ''}`}
                            onClick={() => setCalcMode(CALC_MODE.REVENUE)}
                        >
                            売上
                        </button>
                        <button
                            className={`sales-chart__toggle-btn ${calcMode === CALC_MODE.ORDER ? 'sales-chart__toggle-btn--active' : ''}`}
                            onClick={() => setCalcMode(CALC_MODE.ORDER)}
                        >
                            受注
                        </button>
                    </div>
                </div>

                <div className="sales-chart__control-group">
                    <label>グラフ種別</label>
                    <div className="sales-chart__toggle">
                        <button
                            className={`sales-chart__toggle-btn ${chartType === 'monthly' ? 'sales-chart__toggle-btn--active' : ''}`}
                            onClick={() => setChartType('monthly')}
                        >
                            月別
                        </button>
                        <button
                            className={`sales-chart__toggle-btn ${chartType === 'cumulative' ? 'sales-chart__toggle-btn--active' : ''}`}
                            onClick={() => setChartType('cumulative')}
                        >
                            累積
                        </button>
                    </div>
                </div>

                <div className="sales-chart__control-group">
                    <label>年度</label>
                    <select
                        value={fiscalYear}
                        onChange={(e) => setFiscalYear(Number(e.target.value))}
                        className="sales-chart__select"
                    >
                        <option value={getCurrentFiscalYear() - 1}>{getCurrentFiscalYear() - 1}年度</option>
                        <option value={getCurrentFiscalYear()}>{getCurrentFiscalYear()}年度</option>
                        <option value={getCurrentFiscalYear() + 1}>{getCurrentFiscalYear() + 1}年度</option>
                    </select>
                </div>
            </div>

            {/* Summary */}
            <div className="sales-chart__summary">
                <div className="sales-chart__summary-item sales-chart__summary-item--confirmed">
                    <span className="sales-chart__summary-label">確定{modeLabel}</span>
                    <span className="sales-chart__summary-value">¥{totals.confirmed.toLocaleString()}万</span>
                </div>
                <div className="sales-chart__summary-item sales-chart__summary-item--forecast">
                    <span className="sales-chart__summary-label">見込み{modeLabel}</span>
                    <span className="sales-chart__summary-value">¥{totals.forecast.toLocaleString()}万</span>
                </div>
                <div className="sales-chart__summary-item sales-chart__summary-item--total">
                    <span className="sales-chart__summary-label">{fiscalYearLabel}合計</span>
                    <span className="sales-chart__summary-value">¥{totals.total.toLocaleString()}万</span>
                </div>
            </div>

            {/* Chart */}
            <div className="sales-chart__container">
                <ResponsiveContainer width="100%" height={300}>
                    {chartType === 'monthly' ? (
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="monthLabel"
                                tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                            />
                            <YAxis
                                tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                                tickFormatter={(v) => `${v}万`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar
                                dataKey="confirmedDisplay"
                                name={`確定${modeLabel}`}
                                fill="var(--color-accent-green)"
                                stackId="a"
                            />
                            <Bar
                                dataKey="forecastDisplay"
                                name={`見込み${modeLabel}`}
                                fill="var(--color-accent-purple)"
                                stackId="a"
                            />
                        </BarChart>
                    ) : (
                        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="monthLabel"
                                tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                            />
                            <YAxis
                                tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                                tickFormatter={(v) => `${v}万`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="cumulativeConfirmedDisplay"
                                name={`確定${modeLabel}累計`}
                                fill="var(--color-accent-green)"
                                fillOpacity={0.3}
                                stroke="var(--color-accent-green)"
                            />
                            <Line
                                type="monotone"
                                dataKey="cumulativeTotalDisplay"
                                name={`合計${modeLabel}累計`}
                                stroke="var(--color-accent-blue)"
                                strokeWidth={2}
                                dot={{ fill: 'var(--color-accent-blue)' }}
                            />
                        </ComposedChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
}
