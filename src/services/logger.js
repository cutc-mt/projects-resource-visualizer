/**
 * Logger Service
 * valid for future PocketBase migration
 */

/**
 * Generate a random ID (UUID v4 compatible-ish or just random string)
 */
const generateId = () => {
    return `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create a standardized log entry
 * @param {string} collection - 'projects', 'allocations', 'members'
 * @param {string} recordId - ID of the record being modified
 * @param {string} action - 'create', 'update', 'delete', 'convert'
 * @param {Array} changes - Array of { field, old, new }
 * @param {Object} snapshot - Optional snapshot of the record (for deletes)
 * @param {string} actorId - ID of the user performing the action
 * @param {string} targetName - Name of the target record (for display purposes)
 */
export const createLogEntry = (collection, recordId, action, changes = [], snapshot = null, actorId = 'current_user', targetName = '') => {
    return {
        id: generateId(),
        collection,
        record_id: recordId,
        action,
        actor: actorId,
        changes,
        snapshot,
        target_name: targetName, // Helper for UI display without joining
        created: new Date().toISOString()
    };
};

/**
 * Calculate differences between two objects
 * @param {Object} oldObj 
 * @param {Object} newObj 
 * @param {Array} ignoredFields - Fields to ignore in diff
 */
export const calculateDiff = (oldObj, newObj, ignoredFields = []) => {
    const changes = [];
    const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);

    allKeys.forEach(key => {
        if (ignoredFields.includes(key)) return;

        const oldValue = oldObj ? oldObj[key] : undefined;
        const newValue = newObj ? newObj[key] : undefined;

        // Simple strict equality check
        // For arrays/objects, we might want JSON.stringify comparison for deep equality check
        const sOld = JSON.stringify(oldValue);
        const sNew = JSON.stringify(newValue);

        if (sOld !== sNew) {
            changes.push({
                field: key,
                old: oldValue,
                new: newValue
            });
        }
    });

    return changes;
};
