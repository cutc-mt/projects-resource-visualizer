import { createContext, useContext, useReducer, useMemo } from 'react';
import mockData from '../data/mockData';

// Initial State
const initialState = {
    projects: mockData.projects,
    members: mockData.members,
    allocations: mockData.allocations,
    selectedProjectId: null,
    selectedMemberId: null,
    currentView: 'dashboard', // dashboard, leads, projects, resources, member
};

// Action Types
const ACTIONS = {
    SET_VIEW: 'SET_VIEW',
    SELECT_PROJECT: 'SELECT_PROJECT',
    SELECT_MEMBER: 'SELECT_MEMBER',
    ADD_PROJECT: 'ADD_PROJECT',
    UPDATE_PROJECT: 'UPDATE_PROJECT',
    ADD_ALLOCATION: 'ADD_ALLOCATION',
    UPDATE_ALLOCATION: 'UPDATE_ALLOCATION',
    DELETE_ALLOCATION: 'DELETE_ALLOCATION',
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

    // Actions
    const actions = useMemo(() => ({
        setView: (view) => dispatch({ type: ACTIONS.SET_VIEW, payload: view }),
        selectProject: (id) => dispatch({ type: ACTIONS.SELECT_PROJECT, payload: id }),
        selectMember: (id) => dispatch({ type: ACTIONS.SELECT_MEMBER, payload: id }),
        addProject: (project) => dispatch({ type: ACTIONS.ADD_PROJECT, payload: project }),
        updateProject: (project) => dispatch({ type: ACTIONS.UPDATE_PROJECT, payload: project }),
        addAllocation: (allocation) => dispatch({ type: ACTIONS.ADD_ALLOCATION, payload: allocation }),
        updateAllocation: (allocation) => dispatch({ type: ACTIONS.UPDATE_ALLOCATION, payload: allocation }),
        deleteAllocation: (allocationId) => dispatch({ type: ACTIONS.DELETE_ALLOCATION, payload: allocationId }),
    }), []);

    const value = {
        ...state,
        ...derivedData,
        ...actions,
        managerMode,
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
