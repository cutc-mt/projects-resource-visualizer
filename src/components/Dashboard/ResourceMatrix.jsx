import { useMemo, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ROLES, PRE_SALES_ROLES } from '../../data/types';
import { format, addMonths, parseISO, startOfMonth } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2, UserPlus } from 'lucide-react';
import { Modal } from '../UI';
import './ResourceMatrix.css';

// Generate an array of months from today
const generateMonthRange = (monthsBefore = 2, monthsAfter = 6) => {
    const months = [];
    const today = startOfMonth(new Date());
    for (let i = -monthsBefore; i <= monthsAfter; i++) {
        const date = addMonths(today, i);
        months.push({
            key: format(date, 'yyyy-MM'),
            label: format(date, 'M月', { locale: ja }),
            fullLabel: format(date, 'yyyy年M月', { locale: ja }),
            isCurrentMonth: i === 0
        });
    }
    return months;
};

// Get utilization color class
const getUtilizationClass = (percentage) => {
    if (percentage === 0) return 'util--empty';
    if (percentage < 50) return 'util--low';
    if (percentage <= 80) return 'util--medium';
    if (percentage <= 100) return 'util--high';
    return 'util--over';
};

export default function ResourceMatrix({ managerMode }) {
    const {
        members,
        allocations,
        projects,
        getProjectById,
        addAllocation,
        updateAllocation,
        deleteAllocation,
        addMember,
        updateMember,
        deleteMember
    } = useApp();

    const [expandedMemberId, setExpandedMemberId] = useState(null);
    const [isAddingAllocation, setIsAddingAllocation] = useState(false);
    const [editingAllocationId, setEditingAllocationId] = useState(null);

    // Allocation Form State
    const [allocationForm, setAllocationForm] = useState({
        projectId: '',
        role: '',
        month: '',
        percentage: 50,
        isProspect: false,
        isPreSales: false
    });

    // Member Form State & Modal
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [editingMemberId, setEditingMemberId] = useState(null);
    const [memberForm, setMemberForm] = useState({
        name: '',
        role: Object.values(ROLES)[0],
        skills: ''
    });

    const months = useMemo(() => generateMonthRange(2, 6), []);

    // Get all projects (active + leads) for the dropdown
    const allProjects = useMemo(() => {
        return projects.map(p => ({
            ...p,
            isLead: p.status === 'lead'
        }));
    }, [projects]);

    // Calculate member data with utilization per month
    const memberData = useMemo(() => {
        return members.map(member => {
            const memberAllocations = allocations.filter(a => a.memberId === member.id);

            const monthlyData = months.map(month => {
                const monthAllocations = memberAllocations.filter(a => a.month === month.key);
                const totalPercentage = monthAllocations.reduce((sum, a) => sum + a.percentage, 0);

                // Group allocations by project for detail view
                const projectBreakdown = monthAllocations.map(a => {
                    const project = getProjectById(a.projectId);
                    return {
                        id: a.id,
                        projectId: a.projectId,
                        projectName: project?.name || 'Unknown',
                        role: a.role,
                        percentage: a.percentage,
                        isProspect: a.isProspect,
                        isPreSales: a.isPreSales
                    };
                });

                return {
                    month: month.key,
                    totalPercentage,
                    projectBreakdown
                };
            });

            return {
                ...member,
                monthlyData,
                allAllocations: memberAllocations
            };
        });
    }, [members, allocations, months, getProjectById]);

    const toggleExpand = (memberId) => {
        setExpandedMemberId(expandedMemberId === memberId ? null : memberId);
        setIsAddingAllocation(false);
        setEditingAllocationId(null);
    };

    // --- Member Management Handlers ---

    const openAddMemberModal = () => {
        setEditingMemberId(null);
        setMemberForm({
            name: '',
            role: Object.values(ROLES)[0],
            skills: ''
        });
        setIsMemberModalOpen(true);
    };

    const openEditMemberModal = (member) => {
        setEditingMemberId(member.id);
        setMemberForm({
            name: member.name,
            role: member.role,
            skills: member.skills ? member.skills.join(', ') : ''
        });
        setIsMemberModalOpen(true);
    };

    const handleSaveMember = () => {
        if (!memberForm.name || !memberForm.role) return;

        const skillsArray = memberForm.skills.split(',').map(s => s.trim()).filter(s => s);

        const memberData = {
            name: memberForm.name,
            role: memberForm.role,
            skills: skillsArray,
            avatar: null // Default null for now
        };

        if (editingMemberId) {
            updateMember({
                id: editingMemberId,
                ...memberData
            });
        } else {
            addMember({
                id: `m-${Date.now()}`,
                ...memberData
            });
        }
        setIsMemberModalOpen(false);
    };

    const handleDeleteMember = (memberId, memberName) => {
        if (window.confirm(`${memberName}さんを削除してもよろしいですか？\n※関連するアサインも全て削除されます。`)) {
            deleteMember(memberId);
        }
    };

    // --- Allocation Handlers ---

    const handleAddAllocation = (memberId) => {
        setIsAddingAllocation(true);
        setEditingAllocationId(null);
        const firstProject = allProjects[0];
        setAllocationForm({
            memberId,
            projectId: firstProject?.id || '',
            role: Object.values(ROLES)[0],
            month: months.find(m => m.isCurrentMonth)?.key || months[0].key,
            percentage: 50,
            isProspect: firstProject?.isLead || false,
            isPreSales: false
        });
    };

    const handleEditAllocation = (allocation) => {
        setEditingAllocationId(allocation.id);
        setIsAddingAllocation(false);
        const project = getProjectById(allocation.projectId);
        setAllocationForm({
            memberId: allocation.memberId,
            projectId: allocation.projectId,
            role: allocation.role,
            month: allocation.month,
            percentage: allocation.percentage,
            isProspect: allocation.isProspect || false,
            isPreSales: allocation.isPreSales || false
        });
    };

    const handleProjectChange = (e) => {
        const projectId = e.target.value;
        const project = allProjects.find(p => p.id === projectId);
        const isLead = project?.isLead || false;

        // If switching to a lead, set as prospect, if activeProject set as regular
        setAllocationForm({
            ...allocationForm,
            projectId,
            isProspect: isLead,
            isPreSales: false,
            role: isLead ? Object.values(ROLES)[0] : allocationForm.role
        });
    };

    const handleAllocationTypeChange = (type) => {
        if (type === 'regular') {
            setAllocationForm({ ...allocationForm, isProspect: false, isPreSales: false });
        } else if (type === 'prospect') {
            setAllocationForm({ ...allocationForm, isProspect: true, isPreSales: false });
        } else if (type === 'presales') {
            setAllocationForm({ ...allocationForm, isProspect: false, isPreSales: true, role: Object.values(PRE_SALES_ROLES)[0] });
        }
    };

    const getAllocationType = () => {
        if (allocationForm.isPreSales) return 'presales';
        if (allocationForm.isProspect) return 'prospect';
        return 'regular';
    };

    const handleSaveAllocation = () => {
        if (!allocationForm.projectId || !allocationForm.role || !allocationForm.month) return;

        const allocationData = {
            memberId: allocationForm.memberId,
            projectId: allocationForm.projectId,
            role: allocationForm.role,
            month: allocationForm.month,
            percentage: allocationForm.percentage,
            isProspect: allocationForm.isProspect,
            isPreSales: allocationForm.isPreSales
        };

        if (editingAllocationId) {
            updateAllocation({
                id: editingAllocationId,
                ...allocationData
            });
        } else {
            addAllocation({
                id: `alloc-${Date.now()}`,
                ...allocationData
            });
        }
        setIsAddingAllocation(false);
        setEditingAllocationId(null);
    };

    const handleDeleteAllocation = (allocationId) => {
        if (window.confirm('このアサインを削除してもよろしいですか？')) {
            deleteAllocation(allocationId);
        }
    };

    const handleCancelEdit = () => {
        setIsAddingAllocation(false);
        setEditingAllocationId(null);
    };

    // Get roles based on allocation type
    const getAvailableRoles = () => {
        if (allocationForm.isPreSales) {
            return Object.values(PRE_SALES_ROLES);
        }
        return Object.values(ROLES);
    };

    // Check if selected project is a lead
    const isLeadProject = () => {
        const project = allProjects.find(p => p.id === allocationForm.projectId);
        return project?.isLead || false;
    };

    return (
        <div className="resource-matrix">
            {managerMode && (
                <div className="resource-matrix__actions" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        className="resource-matrix__add-allocation-btn"
                        onClick={openAddMemberModal}
                    >
                        <UserPlus size={16} /> メンバー追加
                    </button>
                </div>
            )}

            <div className="resource-matrix__container">
                <table className="resource-matrix__table">
                    <thead>
                        <tr>
                            <th className="resource-matrix__header resource-matrix__header--name">
                                メンバー
                            </th>
                            {months.map(month => (
                                <th
                                    key={month.key}
                                    className={`resource-matrix__header ${month.isCurrentMonth ? 'resource-matrix__header--current' : ''}`}
                                    title={month.fullLabel}
                                >
                                    {month.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {memberData.map(member => (
                            <>
                                <tr
                                    key={member.id}
                                    className="resource-matrix__row"
                                    onClick={() => toggleExpand(member.id)}
                                >
                                    <td className="resource-matrix__cell resource-matrix__cell--name">
                                        <button className="resource-matrix__expand-btn">
                                            {expandedMemberId === member.id ?
                                                <ChevronDown size={16} /> :
                                                <ChevronRight size={16} />
                                            }
                                        </button>
                                        <div className="resource-matrix__member-info" style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span className="resource-matrix__member-name">{member.name}</span>
                                                {managerMode && (
                                                    <div className="resource-matrix__member-actions"
                                                        onClick={(e) => e.stopPropagation()}
                                                        style={{ display: 'flex', gap: '4px', opacity: 0.7 }}
                                                    >
                                                        <button
                                                            onClick={() => openEditMemberModal(member)}
                                                            className="resource-matrix__detail-btn"
                                                            title="メンバー編集"
                                                        >
                                                            <Edit2 size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteMember(member.id, member.name)}
                                                            className="resource-matrix__detail-btn resource-matrix__detail-btn--delete"
                                                            title="メンバー削除"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <span className="resource-matrix__member-role">{member.role}</span>
                                        </div>
                                    </td>
                                    {member.monthlyData.map((data, index) => (
                                        <td
                                            key={data.month}
                                            className={`resource-matrix__cell ${months[index].isCurrentMonth ? 'resource-matrix__cell--current' : ''}`}
                                        >
                                            <div
                                                className={`resource-matrix__util ${getUtilizationClass(data.totalPercentage)}`}
                                                title={`${data.totalPercentage}%`}
                                            >
                                                {data.totalPercentage > 0 ? `${data.totalPercentage}%` : '-'}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                {/* Allocation Form Row */}
                                {expandedMemberId === member.id && (isAddingAllocation || editingAllocationId) && allocationForm.memberId === member.id && (
                                    <tr className="resource-matrix__form-row-container">
                                        <td colSpan={months.length + 1}>
                                            <div className="resource-matrix__allocation-form">
                                                <div className="resource-matrix__form-row">
                                                    <div className="resource-matrix__form-field">
                                                        <label>プロジェクト</label>
                                                        <select
                                                            value={allocationForm.projectId}
                                                            onChange={handleProjectChange}
                                                        >
                                                            <optgroup label="受注案件">
                                                                {allProjects.filter(p => !p.isLead).map(p => (
                                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                                ))}
                                                            </optgroup>
                                                            <optgroup label="プレ活動">
                                                                {allProjects.filter(p => p.isLead).map(p => (
                                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                                ))}
                                                            </optgroup>
                                                        </select>
                                                    </div>
                                                    {isLeadProject() && (
                                                        <div className="resource-matrix__form-field">
                                                            <label>アサイン種別</label>
                                                            <select
                                                                value={getAllocationType()}
                                                                onChange={e => handleAllocationTypeChange(e.target.value)}
                                                            >
                                                                <option value="prospect">見込（プロジェクト参画予定）</option>
                                                                <option value="presales">プレセールス担当</option>
                                                            </select>
                                                        </div>
                                                    )}
                                                    <div className="resource-matrix__form-field">
                                                        <label>ロール</label>
                                                        <select
                                                            value={allocationForm.role}
                                                            onChange={e => setAllocationForm({ ...allocationForm, role: e.target.value })}
                                                        >
                                                            {getAvailableRoles().map(role => (
                                                                <option key={role} value={role}>{role}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="resource-matrix__form-field">
                                                        <label>月</label>
                                                        <select
                                                            value={allocationForm.month}
                                                            onChange={e => setAllocationForm({ ...allocationForm, month: e.target.value })}
                                                        >
                                                            {months.map(month => (
                                                                <option key={month.key} value={month.key}>
                                                                    {month.fullLabel}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="resource-matrix__form-field">
                                                        <label>従事率 ({allocationForm.percentage}%)</label>
                                                        <input
                                                            type="range"
                                                            min={allocationForm.isPreSales ? 5 : 10}
                                                            max={allocationForm.isPreSales ? 50 : 100}
                                                            step={allocationForm.isPreSales ? 5 : 10}
                                                            value={allocationForm.percentage}
                                                            onChange={e => setAllocationForm({ ...allocationForm, percentage: parseInt(e.target.value) })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="resource-matrix__form-actions">
                                                    <button className="resource-matrix__form-btn resource-matrix__form-btn--save" onClick={handleSaveAllocation}>
                                                        保存
                                                    </button>
                                                    <button className="resource-matrix__form-btn resource-matrix__form-btn--cancel" onClick={handleCancelEdit}>
                                                        キャンセル
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {/* Detail project rows - directly in the main table */}
                                {expandedMemberId === member.id && Array.from(new Set(
                                    member.monthlyData
                                        .flatMap(m => m.projectBreakdown)
                                        .map(p => p.projectId)
                                )).map(projectId => {
                                    const firstOccurrence = member.monthlyData
                                        .flatMap(m => m.projectBreakdown)
                                        .find(p => p.projectId === projectId);

                                    return (
                                        <tr key={`${member.id}-${projectId}`} className="resource-matrix__detail-project-row">
                                            <td className="resource-matrix__detail-project">
                                                <span className="resource-matrix__detail-project-name">
                                                    {firstOccurrence?.isPreSales && (
                                                        <span className="resource-matrix__presales-badge">プレ</span>
                                                    )}
                                                    {firstOccurrence?.isProspect && !firstOccurrence?.isPreSales && (
                                                        <span className="resource-matrix__prospect-badge">見込</span>
                                                    )}
                                                    {firstOccurrence?.projectName}
                                                </span>
                                                <span className="resource-matrix__detail-role">
                                                    {firstOccurrence?.role}
                                                </span>
                                            </td>
                                            {member.monthlyData.map((monthData, index) => {
                                                const allocation = monthData.projectBreakdown.find(
                                                    p => p.projectId === projectId
                                                );
                                                return (
                                                    <td
                                                        key={monthData.month}
                                                        className={`resource-matrix__detail-cell ${months[index].isCurrentMonth ? 'resource-matrix__detail-cell--current' : ''}`}
                                                    >
                                                        {allocation ? (
                                                            <div className="resource-matrix__detail-value-wrapper">
                                                                <span className={`resource-matrix__detail-value ${allocation.isProspect ? 'resource-matrix__detail-value--prospect' : ''} ${allocation.isPreSales ? 'resource-matrix__detail-value--presales' : ''}`}>
                                                                    {allocation.percentage}%
                                                                </span>
                                                                {managerMode && (
                                                                    <div className="resource-matrix__detail-actions">
                                                                        <button
                                                                            className="resource-matrix__detail-btn"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                // Find full allocation data
                                                                                const fullAlloc = member.allAllocations.find(a => a.id === allocation.id);
                                                                                if (fullAlloc) handleEditAllocation({ ...fullAlloc, memberId: member.id });
                                                                            }}
                                                                            title="編集"
                                                                        >
                                                                            <Edit2 size={12} />
                                                                        </button>
                                                                        <button
                                                                            className="resource-matrix__detail-btn resource-matrix__detail-btn--delete"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDeleteAllocation(allocation.id);
                                                                            }}
                                                                            title="削除"
                                                                        >
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="resource-matrix__detail-value resource-matrix__detail-value--empty">-</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                                {/* Add Allocation Button Row */}
                                {expandedMemberId === member.id && managerMode && !isAddingAllocation && !editingAllocationId && (
                                    <tr className="resource-matrix__add-row">
                                        <td colSpan={months.length + 1}>
                                            <button
                                                className="resource-matrix__add-allocation-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAddAllocation(member.id);
                                                }}
                                            >
                                                <Plus size={14} /> アサイン追加
                                            </button>
                                        </td>
                                    </tr>
                                )}
                            </>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="resource-matrix__legend">
                <span className="resource-matrix__legend-title">稼働率:</span>
                <div className="resource-matrix__legend-item">
                    <span className="resource-matrix__legend-box util--empty"></span>
                    0%
                </div>
                <div className="resource-matrix__legend-item">
                    <span className="resource-matrix__legend-box util--low"></span>
                    1-49%
                </div>
                <div className="resource-matrix__legend-item">
                    <span className="resource-matrix__legend-box util--medium"></span>
                    50-80%
                </div>
                <div className="resource-matrix__legend-item">
                    <span className="resource-matrix__legend-box util--high"></span>
                    81-100%
                </div>
                <div className="resource-matrix__legend-item">
                    <span className="resource-matrix__legend-box util--over"></span>
                    100%超
                </div>
            </div>

            {/* Member Add/Edit Modal */}
            <Modal
                isOpen={isMemberModalOpen}
                onClose={() => setIsMemberModalOpen(false)}
                title={editingMemberId ? 'メンバー編集' : '新規メンバー登録'}
                size="sm"
            >
                <div className="resource-matrix__member-form">
                    <div className="resource-matrix__form-field">
                        <label>氏名</label>
                        <input
                            type="text"
                            value={memberForm.name}
                            onChange={e => setMemberForm({ ...memberForm, name: e.target.value })}
                            placeholder="氏名を入力"
                        />
                    </div>
                    <div className="resource-matrix__form-field">
                        <label>ロール</label>
                        <select
                            value={memberForm.role}
                            onChange={e => setMemberForm({ ...memberForm, role: e.target.value })}
                        >
                            {Object.values(ROLES).map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>
                    <div className="resource-matrix__form-field">
                        <label>スキル (カンマ区切り)</label>
                        <input
                            type="text"
                            value={memberForm.skills}
                            onChange={e => setMemberForm({ ...memberForm, skills: e.target.value })}
                            placeholder="例: React, Python, AWS"
                        />
                    </div>
                    <div className="resource-matrix__form-actions">
                        <button
                            className="resource-matrix__form-btn resource-matrix__form-btn--save"
                            onClick={handleSaveMember}
                        >
                            保存
                        </button>
                        <button
                            className="resource-matrix__form-btn resource-matrix__form-btn--cancel"
                            onClick={() => setIsMemberModalOpen(false)}
                        >
                            キャンセル
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
