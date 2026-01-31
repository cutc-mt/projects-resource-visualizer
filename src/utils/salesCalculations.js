// Sales Calculation Utilities
// Revenue is recognized in the project's END month
// Orders are recognized in the project's START month (or a dedicated order date)

import { format, parseISO, startOfMonth, addMonths, isAfter } from 'date-fns';
import { getProbabilityLevelKey, DEFAULT_PROBABILITY_WEIGHTS } from '../data/settings';

/**
 * Calculation modes
 */
export const CALC_MODE = {
    REVENUE: 'revenue',  // End month - when revenue is recognized
    ORDER: 'order'       // Start month - when order is placed
};

/**
 * Get the month key (YYYY-MM) from a date
 * @param {Date|string} date 
 * @returns {string} YYYY-MM format
 */
export const getMonthKey = (date) => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'yyyy-MM');
};

/**
 * Generate array of months for a date range
 * @param {Date|string} startDate 
 * @param {Date|string} endDate 
 * @returns {string[]} Array of YYYY-MM strings
 */
export const generateMonthRange = (startDate, endDate) => {
    const months = [];
    const start = startOfMonth(typeof startDate === 'string' ? parseISO(startDate) : startDate);
    const end = startOfMonth(typeof endDate === 'string' ? parseISO(endDate) : endDate);
    let current = start;
    while (!isAfter(current, end)) {
        months.push(format(current, 'yyyy-MM'));
        current = addMonths(current, 1);
    }
    return months;
};

/**
 * Generate fiscal year months (April to March for Japanese fiscal year)
 * @param {number} fiscalYear - The fiscal year (e.g., 2025 means Apr 2025 - Mar 2026)
 * @returns {string[]} Array of YYYY-MM strings
 */
export const generateFiscalYearMonths = (fiscalYear) => {
    const start = new Date(fiscalYear, 3, 1); // April of fiscal year
    const months = [];
    for (let i = 0; i < 12; i++) {
        months.push(format(addMonths(start, i), 'yyyy-MM'));
    }
    return months;
};

/**
 * Get current fiscal year
 * @returns {number} Current fiscal year
 */
export const getCurrentFiscalYear = () => {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const year = now.getFullYear();
    // If before April (month < 3), fiscal year is previous year
    return month < 3 ? year - 1 : year;
};

/**
 * Calculate monthly sales data
 * 
 * @param {Array} projects - All projects (leads and active)
 * @param {string[]} months - Array of YYYY-MM strings to calculate for
 * @param {Object} weights - Probability weights for leads
 * @param {string} mode - 'revenue' (end month) or 'order' (start month)
 * @returns {Array} Monthly sales data with confirmed and forecast values
 */
export const calculateMonthlySales = (projects, months, weights = DEFAULT_PROBABILITY_WEIGHTS, mode = CALC_MODE.REVENUE) => {
    return months.map(month => {
        let confirmed = 0;      // Active/completed projects
        let forecast = 0;       // Weighted lead value
        let forecastRaw = 0;    // Raw lead value (before weighting)

        projects.forEach(project => {
            // Determine which month to use based on mode
            const targetMonth = mode === CALC_MODE.REVENUE
                ? getMonthKey(project.endDate)    // Revenue: end month
                : getMonthKey(project.startDate); // Order: start month

            // Only count if project matches this month
            if (targetMonth === month) {
                const revenue = project.actualRevenue || project.estimatedBudget || 0;

                if (project.status === 'active' || project.status === 'completed') {
                    // Confirmed revenue from active/completed projects
                    confirmed += revenue;
                } else if (project.status === 'lead') {
                    // Forecast from leads - apply probability weight
                    const probability = project.probability || 0;
                    const levelKey = getProbabilityLevelKey(probability);
                    const weight = weights[levelKey] ?? 0;

                    forecastRaw += revenue;
                    forecast += revenue * weight;
                }
            }
        });

        return {
            month,
            confirmed,
            forecast,
            forecastRaw,
            total: confirmed + forecast
        };
    });
};

/**
 * Calculate cumulative sales over months
 * @param {Array} monthlySales - Output from calculateMonthlySales
 * @returns {Array} Monthly data with cumulative values added
 */
export const calculateCumulativeSales = (monthlySales) => {
    let cumulativeConfirmed = 0;
    let cumulativeForecast = 0;
    let cumulativeTotal = 0;

    return monthlySales.map(data => {
        cumulativeConfirmed += data.confirmed;
        cumulativeForecast += data.forecast;
        cumulativeTotal += data.total;

        return {
            ...data,
            cumulativeConfirmed,
            cumulativeForecast,
            cumulativeTotal
        };
    });
};

/**
 * Get fiscal year sales summary
 * @param {Array} projects - All projects
 * @param {number} fiscalYear - Fiscal year to calculate
 * @param {Object} weights - Probability weights
 * @param {string} mode - Calculation mode ('revenue' or 'order')
 * @returns {Object} Summary with totals
 */
export const getFiscalYearSummary = (projects, fiscalYear, weights = DEFAULT_PROBABILITY_WEIGHTS, mode = CALC_MODE.REVENUE) => {
    const months = generateFiscalYearMonths(fiscalYear);
    const monthlySales = calculateMonthlySales(projects, months, weights, mode);
    const cumulativeSales = calculateCumulativeSales(monthlySales);

    const lastMonth = cumulativeSales[cumulativeSales.length - 1] || {};

    return {
        fiscalYear,
        mode,
        months: cumulativeSales,
        totalConfirmed: lastMonth.cumulativeConfirmed || 0,
        totalForecast: lastMonth.cumulativeForecast || 0,
        totalCombined: lastMonth.cumulativeTotal || 0
    };
};
