// Data Types for the Project Resource Visualizer

// Lead/Project Status
export const PROJECT_STATUS = {
  LEAD: 'lead',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold'
};

// Probability levels for leads
export const PROBABILITY_LEVELS = {
  HIGH: { min: 80, max: 100, color: 'var(--color-prob-high)', label: '高' },
  MEDIUM: { min: 50, max: 79, color: 'var(--color-prob-medium)', label: '中' },
  LOW: { min: 25, max: 49, color: 'var(--color-prob-low)', label: '低' },
  UNCERTAIN: { min: 0, max: 24, color: 'var(--color-prob-uncertain)', label: '不確定' }
};

// Get probability level from percentage
export const getProbabilityLevel = (probability) => {
  if (probability >= 80) return PROBABILITY_LEVELS.HIGH;
  if (probability >= 50) return PROBABILITY_LEVELS.MEDIUM;
  if (probability >= 25) return PROBABILITY_LEVELS.LOW;
  return PROBABILITY_LEVELS.UNCERTAIN;
};

// Member Roles
export const ROLES = {
  PM: 'プロジェクトマネージャー',
  TECH_LEAD: 'テックリード',
  DEVELOPER: '開発者',
  DESIGNER: 'デザイナー',
  ANALYST: 'アナリスト',
  CONSULTANT: 'コンサルタント'
};

/**
 * @typedef {Object} ConversationLog
 * @property {string} id
 * @property {string} date - ISO date string
 * @property {string} summary
 * @property {string} [details]
 */

/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} name
 * @property {string} clientName
 * @property {string} status - One of PROJECT_STATUS
 * @property {string} [description]
 * @property {string} [needs] - Customer needs/challenges
 * @property {number} [probability] - 0-100, only for leads
 * @property {number} estimatedBudget - Estimated budget in JPY
 * @property {number} [actualRevenue] - Actual revenue (for active/completed)
 * @property {number} [plannedCost]
 * @property {number} [actualCost]
 * @property {string} startDate - ISO date string
 * @property {string} endDate - ISO date string
 * @property {ConversationLog[]} logs
 * @property {string[]} risks
 * @property {string[]} issues
 */

/**
 * @typedef {Object} Member
 * @property {string} id
 * @property {string} name
 * @property {string} role - Primary role
 * @property {string} [avatar]
 * @property {string[]} skills
 */

/**
 * @typedef {Object} Allocation
 * @property {string} id
 * @property {string} memberId
 * @property {string} projectId
 * @property {string} role - Role in this specific project
 * @property {string} month - YYYY-MM format
 * @property {number} percentage - 0-100+ (can be over-allocated)
 * @property {boolean} [isProspect] - True if this is a future/tentative allocation
 */
