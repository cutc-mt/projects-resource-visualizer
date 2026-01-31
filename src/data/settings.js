// System Settings for Sales Forecast Calculations
// These settings control how probability-weighted sales forecasts are calculated

/**
 * Default probability weights for sales forecast calculations
 * Each probability level has a weight that determines how much of the
 * estimated budget is counted toward the weighted pipeline value
 */
export const DEFAULT_PROBABILITY_WEIGHTS = {
    HIGH: 1.0,      // 80-100%: Count full value
    MEDIUM: 0.7,    // 50-79%: Count 70% of value
    LOW: 0.4,       // 25-49%: Count 40% of value
    UNCERTAIN: 0.1  // 0-24%: Count 10% of value
};

/**
 * Probability level thresholds (matching types.js PROBABILITY_LEVELS)
 */
export const PROBABILITY_THRESHOLDS = {
    HIGH: { min: 80, max: 100 },
    MEDIUM: { min: 50, max: 79 },
    LOW: { min: 25, max: 49 },
    UNCERTAIN: { min: 0, max: 24 }
};

/**
 * Get probability level key from percentage
 * @param {number} probability - 0-100 percentage
 * @returns {string} - Level key: 'HIGH', 'MEDIUM', 'LOW', or 'UNCERTAIN'
 */
export const getProbabilityLevelKey = (probability) => {
    if (probability >= 80) return 'HIGH';
    if (probability >= 50) return 'MEDIUM';
    if (probability >= 25) return 'LOW';
    return 'UNCERTAIN';
};

/**
 * Calculate weighted value based on probability and weights
 * @param {number} value - Original value
 * @param {number} probability - 0-100 percentage
 * @param {Object} weights - Probability weights object
 * @returns {number} - Weighted value
 */
export const calculateWeightedValue = (value, probability, weights = DEFAULT_PROBABILITY_WEIGHTS) => {
    const levelKey = getProbabilityLevelKey(probability);
    const weight = weights[levelKey] ?? 1.0;
    return value * weight;
};

/**
 * Get label for probability level
 */
export const PROBABILITY_LABELS = {
    HIGH: '高（80%以上）',
    MEDIUM: '中（50-79%）',
    LOW: '低（25-49%）',
    UNCERTAIN: '不確定（24%以下）'
};
