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
        default:
            return state;
    }
}

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

    // Update logs (append-only)
    const [updateLogs, setUpdateLogs] = useState([]);

    // Add a log entry
    const addLog = useCallback((projectId, projectName, action, details = null) => {
        const log = {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            projectId,
            projectName,
            action,
            details,
        };
        setUpdateLogs(prev => [log, ...prev]); // Prepend for newest first
    }, []);

    // Derived data using useMemo for performance
    const derivedData = useMemo(() => {
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
            addLog(project.id, project.name, LOG_ACTIONS.ADD, { status: project.status });
        },

        updateProject: (project) => {
            const oldProject = state.projects.find(p => p.id === project.id);
            dispatch({ type: ACTIONS.UPDATE_PROJECT, payload: project });
            addLog(project.id, project.name, LOG_ACTIONS.UPDATE, {
                changedFields: Object.keys(project).filter(key =>
                    oldProject && project[key] !== oldProject[key] && key !== 'id'
                )
            });
        },

        deleteProject: (projectId) => {
            const project = state.projects.find(p => p.id === projectId);
            if (project) {
                addLog(projectId, project.name, LOG_ACTIONS.DELETE);
            }
            dispatch({ type: ACTIONS.DELETE_PROJECT, payload: projectId });
        },

        convertLeadToProject: (projectId, projectData) => {
            const project = state.projects.find(p => p.id === projectId);
            if (project) {
                addLog(projectId, project.name, LOG_ACTIONS.CONVERT, {
                    previousStatus: 'lead',
                    newStatus: 'active'
                });
            }
            dispatch({
                type: ACTIONS.CONVERT_LEAD_TO_PROJECT,
                payload: { projectId, projectData }
            });
        },

        addAllocation: (allocation) => dispatch({ type: ACTIONS.ADD_ALLOCATION, payload: allocation }),
        updateAllocation: (allocation) => dispatch({ type: ACTIONS.UPDATE_ALLOCATION, payload: allocation }),
        deleteAllocation: (allocationId) => dispatch({ type: ACTIONS.DELETE_ALLOCATION, payload: allocationId }),
    }), [state.projects, addLog]);

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

