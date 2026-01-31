import { createContext, useContext, useReducer, useMemo, useState, useCallback } from 'react';
import mockData from '../data/mockData';
import { DEFAULT_PROBABILITY_WEIGHTS } from '../data/settings';

// Initial State
const initialState = {
    projects: mockData.projects,
    members: mockData.members,
    allocations: mockData.allocations,
    selectedProjectId: null,
    selectedMemberId: null,
    currentView: 'dashboard', // dashboard, leads, projects, resources, member, settings, history
};

// Action Types
const ACTIONS = {
    SET_VIEW: 'SET_VIEW',
    SELECT_PROJECT: 'SELECT_PROJECT',
    SELECT_MEMBER: 'SELECT_MEMBER',
    ADD_PROJECT: 'ADD_PROJECT',
    UPDATE_PROJECT: 'UPDATE_PROJECT',
    DELETE_PROJECT: 'DELETE_PROJECT',
    CONVERT_LEAD_TO_PROJECT: 'CONVERT_LEAD_TO_PROJECT',
    ADD_ALLOCATION: 'ADD_ALLOCATION',
    UPDATE_ALLOCATION: 'UPDATE_ALLOCATION',
    DELETE_ALLOCATION: 'DELETE_ALLOCATION',
    ADD_MEMBER: 'ADD_MEMBER',
    UPDATE_MEMBER: 'UPDATE_MEMBER',
    DELETE_MEMBER: 'DELETE_MEMBER',
};

// Log action types
const LOG_ACTIONS = {
    ADD: '新規登録',
    UPDATE: '更新',
    DELETE: '削除',
    CONVERT: '受注変換',
};

// Reducer
function appReducer(state, action) {
    switch (action.type) {
        case ACTIONS.SET_VIEW:
            return { ...state, currentView: action.payload };
        case ACTIONS.SELECT_PROJECT:
            return { ...state, selectedProjectId: action.payload };
        case ACTIONS.SELECT_MEMBER:
            return { ...state, selectedMemberId: action.payload };
        case ACTIONS.ADD_PROJECT:
            return { ...state, projects: [...state.projects, action.payload] };
        case ACTIONS.UPDATE_PROJECT:
            return {
                ...state,
                projects: state.projects.map(p =>
                    p.id === action.payload.id ? { ...p, ...action.payload } : p
                ),
            };
        case ACTIONS.DELETE_PROJECT:
            return {
                ...state,
                projects: state.projects.filter(p => p.id !== action.payload),
                allocations: state.allocations.filter(a => a.projectId !== action.payload),
            };
        case ACTIONS.CONVERT_LEAD_TO_PROJECT: {
            const { projectId, projectData } = action.payload;
            return {
                ...state,
                // Update the project status and data
                projects: state.projects.map(p =>
                    p.id === projectId
                        ? {
                            ...p,
                            ...projectData,
                            status: 'active',
                            probability: undefined, // Remove probability for active projects
                        }
                        : p
                ),
                // Convert prospect allocations to regular allocations and remove pre-sales allocations
                allocations: state.allocations
                    .filter(a => !(a.projectId === projectId && a.isPreSales)) // Remove pre-sales
                    .map(a =>
                        a.projectId === projectId && a.isProspect
                            ? { ...a, isProspect: false } // Convert prospects to regular
                            : a
                    ),
            };
        }
        case ACTIONS.ADD_ALLOCATION:
            return { ...state, allocations: [...state.allocations, action.payload] };
        case ACTIONS.UPDATE_ALLOCATION:
            return {
                ...state,
                allocations: state.allocations.map(a =>
                    a.id === action.payload.id ? { ...a, ...action.payload } : a
                ),
            };
        case ACTIONS.DELETE_ALLOCATION:
            return {
                ...state,
                allocations: state.allocations.filter(a => a.id !== action.payload),
            };
        case ACTIONS.ADD_MEMBER:
            return { ...state, members: [...state.members, action.payload] };
        case ACTIONS.UPDATE_MEMBER:
            return {
                ...state,
                members: state.members.map(m =>
                    m.id === action.payload.id ? { ...m, ...action.payload } : m
                ),
            };
        case ACTIONS.DELETE_MEMBER:
            return {
                ...state,
                members: state.members.filter(m => m.id !== action.payload),
                allocations: state.allocations.filter(a => a.memberId !== action.payload),
            };
        default:
            return state;
    }
}

import { createLogEntry, calculateDiff } from '../services/logger';

// ... (imports remain the same)

// ... (initialState and ACTIONS remain the same)



// ... (appReducer remains the same)


// Context
const AppContext = createContext(null);

// Provider Component
export function AppProvider({ children, managerMode = false }) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // Probability weights for sales forecast calculations
    const [probabilityWeights, setProbabilityWeights] = useState(DEFAULT_PROBABILITY_WEIGHTS);

    // LLM Settings with localStorage persistence
    const [llmSettings, setLLMSettingsState] = useState(() => {
        try {
            const saved = localStorage.getItem('llmSettings');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    const setLLMSettings = useCallback((settings) => {
        setLLMSettingsState(settings);
        try {
            localStorage.setItem('llmSettings', JSON.stringify(settings));
        } catch {
            // Ignore localStorage errors
        }
    }, []);

    // Update logs (persistent)
    const [updateLogs, setUpdateLogs] = useState(() => {
        try {
            const saved = localStorage.getItem('audit_logs');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Save logs to local storage whenever they change
    const [logsLoaded, setLogsLoaded] = useState(false);

    // Initial load effect to ensure we don't overwrite with empty array on first render if strictly controlled
    // But useState initializer handles it. We just need to save subsequent updates.

    const addLogEntry = useCallback((entry) => {
        setUpdateLogs(prev => {
            const newLogs = [entry, ...prev].slice(0, 1000); // Keep last 1000 logs
            try {
                localStorage.setItem('audit_logs', JSON.stringify(newLogs));
            } catch (e) {
                console.error("Failed to save logs", e);
            }
            return newLogs;
        });
    }, []);

    // Derived data using useMemo for performance
    const derivedData = useMemo(() => {
        // ... (Keep existing derived data logic)
        // Projects by status
        const leads = state.projects.filter(p => p.status === 'lead');
        const activeProjects = state.projects.filter(p => p.status === 'active');
        const completedProjects = state.projects.filter(p => p.status === 'completed');

        // Get allocations for a specific member
        const getAllocationsForMember = (memberId) => {
            return state.allocations.filter(a => a.memberId === memberId);
        };

        // Get allocations for a specific project
        const getAllocationsForProject = (projectId) => {
            return state.allocations.filter(a => a.projectId === projectId);
        };

        // Get member utilization for a specific month
        const getMemberUtilization = (memberId, month) => {
            const monthAllocations = state.allocations.filter(
                a => a.memberId === memberId && a.month === month
            );
            return monthAllocations.reduce((sum, a) => sum + a.percentage, 0);
        };

        // Get project by ID
        const getProjectById = (projectId) => {
            return state.projects.find(p => p.id === projectId);
        };

        // Get member by ID
        const getMemberById = (memberId) => {
            return state.members.find(m => m.id === memberId);
        };

        return {
            leads,
            activeProjects,
            completedProjects,
            getAllocationsForMember,
            getAllocationsForProject,
            getMemberUtilization,
            getProjectById,
            getMemberById,
        };
    }, [state.projects, state.members, state.allocations]);

    // Actions with logging
    const actions = useMemo(() => ({
        setView: (view) => dispatch({ type: ACTIONS.SET_VIEW, payload: view }),
        selectProject: (id) => dispatch({ type: ACTIONS.SELECT_PROJECT, payload: id }),
        selectMember: (id) => dispatch({ type: ACTIONS.SELECT_MEMBER, payload: id }),

        addProject: (project) => {
            dispatch({ type: ACTIONS.ADD_PROJECT, payload: project });

            const log = createLogEntry(
                'projects',
                project.id,
                'create',
                [], // No changes on create, the snapshot is the object itself effectively
                project,
                'current_user',
                project.name
            );
            addLogEntry(log);
        },

        updateProject: (project) => {
            const oldProject = state.projects.find(p => p.id === project.id);
            dispatch({ type: ACTIONS.UPDATE_PROJECT, payload: project });

            if (oldProject) {
                const changes = calculateDiff(oldProject, project, ['logs', 'aiAdvices']);
                if (changes.length > 0) {
                    const log = createLogEntry(
                        'projects',
                        project.id,
                        'update',
                        changes,
                        null,
                        'current_user',
                        project.name
                    );
                    addLogEntry(log);
                }
            }
        },

        deleteProject: (projectId) => {
            const project = state.projects.find(p => p.id === projectId);
            dispatch({ type: ACTIONS.DELETE_PROJECT, payload: projectId });

            if (project) {
                const log = createLogEntry(
                    'projects',
                    projectId,
                    'delete',
                    [],
                    project,
                    'current_user',
                    project.name
                );
                addLogEntry(log);
            }
        },

        convertLeadToProject: (projectId, projectData) => {
            const project = state.projects.find(p => p.id === projectId);
            dispatch({
                type: ACTIONS.CONVERT_LEAD_TO_PROJECT,
                payload: { projectId, projectData }
            });

            if (project) {
                const log = createLogEntry(
                    'projects',
                    projectId,
                    'convert',
                    [
                        { field: 'status', old: 'lead', new: 'active' },
                        ...calculateDiff({}, projectData) // Add any other data changes included in conversion
                    ],
                    null,
                    'current_user',
                    project.name
                );
                addLogEntry(log);
            }
        },

        addAllocation: (allocation) => {
            dispatch({ type: ACTIONS.ADD_ALLOCATION, payload: allocation });

            // Resolve names for display
            const project = state.projects.find(p => p.id === allocation.projectId);
            const member = state.members.find(m => m.id === allocation.memberId);
            const targetName = `${member?.name || '不明'} (${project?.name || '不明'})`;

            const log = createLogEntry(
                'allocations',
                allocation.id,
                'create',
                [],
                allocation,
                'current_user',
                targetName
            );
            addLogEntry(log);
        },

        updateAllocation: (allocation) => {
            const oldAllocation = state.allocations.find(a => a.id === allocation.id);
            dispatch({ type: ACTIONS.UPDATE_ALLOCATION, payload: allocation });

            if (oldAllocation) {
                const project = state.projects.find(p => p.id === allocation.projectId);
                const member = state.members.find(m => m.id === allocation.memberId);
                const targetName = `${member?.name || '不明'} (${project?.name || '不明'})`;

                const changes = calculateDiff(oldAllocation, allocation);
                if (changes.length > 0) {
                    const log = createLogEntry(
                        'allocations',
                        allocation.id,
                        'update',
                        changes,
                        null,
                        'current_user',
                        targetName
                    );
                    addLogEntry(log);
                }
            }
        },

        deleteAllocation: (allocationId) => {
            const allocation = state.allocations.find(a => a.id === allocationId);
            dispatch({ type: ACTIONS.DELETE_ALLOCATION, payload: allocationId });

            if (allocation) {
                const project = state.projects.find(p => p.id === allocation.projectId);
                const member = state.members.find(m => m.id === allocation.memberId);
                const targetName = `${member?.name || '不明'} (${project?.name || '不明'})`;

                const log = createLogEntry(
                    'allocations',
                    allocationId,
                    'delete',
                    [],
                    allocation,
                    'current_user',
                    targetName
                );
                addLogEntry(log);
            }
        },

        addMember: (member) => {
            dispatch({ type: ACTIONS.ADD_MEMBER, payload: member });

            const log = createLogEntry(
                'members',
                member.id,
                'create',
                [],
                member,
                'current_user',
                member.name
            );
            addLogEntry(log);
        },

        updateMember: (member) => {
            const oldMember = state.members.find(m => m.id === member.id);
            dispatch({ type: ACTIONS.UPDATE_MEMBER, payload: member });

            if (oldMember) {
                const changes = calculateDiff(oldMember, member);
                if (changes.length > 0) {
                    const log = createLogEntry(
                        'members',
                        member.id,
                        'update',
                        changes,
                        null,
                        'current_user',
                        member.name
                    );
                    addLogEntry(log);
                }
            }
        },

        deleteMember: (memberId) => {
            const member = state.members.find(m => m.id === memberId);
            dispatch({ type: ACTIONS.DELETE_MEMBER, payload: memberId });

            if (member) {
                const log = createLogEntry(
                    'members',
                    memberId,
                    'delete',
                    [],
                    member,
                    'current_user',
                    member.name
                );
                addLogEntry(log);
            }
        },
    }), [state.projects, state.allocations, state.members, addLogEntry]);

    const value = {
        ...state,
        ...derivedData,
        ...actions,
        managerMode,
        probabilityWeights,
        setProbabilityWeights,
        llmSettings,
        setLLMSettings,
        updateLogs,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Hook
export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
}

export default AppContext;
