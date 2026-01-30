import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getProbabilityLevel, ROLES } from '../data/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Badge, Modal } from '../components/UI';
import LeadsBubbleChart from '../components/Dashboard/LeadsBubbleChart';
import { Calendar, DollarSign, MessageSquare, AlertTriangle, Users, Plus, Trash2, Edit2 } from 'lucide-react';
import { format, parseISO, addMonths, startOfMonth } from 'date-fns';
import { ja } from 'date-fns/locale';
import './LeadsView.css';

// Generate months between start and end dates
const generateMonthsBetween = (startDate, endDate) => {
    const months = [];
    const start = startOfMonth(parseISO(startDate));
    const end = startOfMonth(parseISO(endDate));
    let current = start;
    while (current <= end) {
        months.push(format(current, 'yyyy-MM'));
        current = addMonths(current, 1);
    }
    return months;
};

export default function LeadsView() {
    const {
        leads,
        members,
        selectedProjectId,
        selectProject,
        getAllocationsForProject,
        addAllocation,
        updateAllocation,
        deleteAllocation
    } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddingAllocation, setIsAddingAllocation] = useState(false);
    const [editingAllocationId, setEditingAllocationId] = useState(null);
    const [allocationForm, setAllocationForm] = useState({
        memberId: '',
        role: '',
        month: '',
        percentage: 50
    });

    const selectedLead = leads.find(l => l.id === selectedProjectId);

    // Get allocations for selected lead
    const leadAllocations = useMemo(() => {
        if (!selectedLead) return [];
        return getAllocationsForProject(selectedLead.id);
    }, [selectedLead, getAllocationsForProject]);

    // Group allocations by member for display
    const allocationsByMember = useMemo(() => {
        const map = new Map();
        leadAllocations.forEach(a => {
            const member = members.find(m => m.id === a.memberId);
            if (!map.has(a.memberId)) {
                map.set(a.memberId, {
                    member,
                    allocations: []
                });
            }
            map.get(a.memberId).allocations.push(a);
        });
        return Array.from(map.values());
    }, [leadAllocations, members]);

    // Available months for allocation
    const availableMonths = useMemo(() => {
        if (!selectedLead) return [];
        return generateMonthsBetween(selectedLead.startDate, selectedLead.endDate);
    }, [selectedLead]);

    const handleSelectLead = (leadId) => {
        selectProject(leadId);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        selectProject(null);
        setIsAddingAllocation(false);
        setEditingAllocationId(null);
    };

    const getProbabilityBadge = (probability) => {
        const level = getProbabilityLevel(probability);
        const variantMap = {
            '高': 'success',
            '中': 'warning',
            '低': 'warning',
            '不確定': 'danger'
        };
        return <Badge variant={variantMap[level.label]}>{probability}% ({level.label})</Badge>;
    };

    const handleAddAllocation = () => {
        setIsAddingAllocation(true);
        setEditingAllocationId(null);
        setAllocationForm({
            memberId: members[0]?.id || '',
            role: Object.values(ROLES)[0],
            month: availableMonths[0] || '',
            percentage: 50
        });
    };

    const handleEditAllocation = (allocation) => {
        setEditingAllocationId(allocation.id);
        setIsAddingAllocation(false);
        setAllocationForm({
            memberId: allocation.memberId,
            role: allocation.role,
            month: allocation.month,
            percentage: allocation.percentage
        });
    };

    const handleSaveAllocation = () => {
        if (!allocationForm.memberId || !allocationForm.role || !allocationForm.month) return;

        if (editingAllocationId) {
            updateAllocation({
                id: editingAllocationId,
                ...allocationForm,
                projectId: selectedLead.id,
                isProspect: true
            });
        } else {
            addAllocation({
                id: `alloc-${Date.now()}`,
                ...allocationForm,
                projectId: selectedLead.id,
                isProspect: true
            });
        }
        setIsAddingAllocation(false);
        setEditingAllocationId(null);
    };

    const handleDeleteAllocation = (allocationId) => {
        deleteAllocation(allocationId);
    };

    const handleCancelEdit = () => {
        setIsAddingAllocation(false);
        setEditingAllocationId(null);
    };

    return (
        <div className="leads-view">
            {/* Pipeline Chart */}
            <section className="leads-view__section">
                <h3 className="leads-view__section-title">パイプライン可視化</h3>
                <div className="leads-view__chart glass-card">
                    <LeadsBubbleChart onSelectLead={handleSelectLead} />
                </div>
            </section>

            {/* Leads List */}
            <section className="leads-view__section">
                <h3 className="leads-view__section-title">プレ活動一覧</h3>
                <div className="leads-view__grid">
                    {leads.map(lead => {
                        const probabilityLevel = getProbabilityLevel(lead.probability);
                        const leadAllocs = getAllocationsForProject(lead.id);
                        const uniqueMembers = new Set(leadAllocs.map(a => a.memberId)).size;

                        return (
                            <Card
                                key={lead.id}
                                hoverable
                                onClick={() => handleSelectLead(lead.id)}
                                className="leads-view__card"
                            >
                                <div
                                    className="leads-view__card-indicator"
                                    style={{ background: probabilityLevel.color }}
                                />
                                <CardHeader>
                                    <CardTitle>{lead.name}</CardTitle>
                                    {getProbabilityBadge(lead.probability)}
                                </CardHeader>
                                <CardContent>
                                    <p className="leads-view__client">{lead.clientName}</p>
                                    <p className="leads-view__needs">{lead.needs}</p>
                                </CardContent>
                                <CardFooter>
                                    <div className="leads-view__meta">
                                        <span className="leads-view__meta-item">
                                            <DollarSign size={14} />
                                            ¥{(lead.estimatedBudget / 10000).toLocaleString()}万
                                        </span>
                                        <span className="leads-view__meta-item">
                                            <Calendar size={14} />
                                            {format(parseISO(lead.startDate), 'yyyy/M月', { locale: ja })}
                                        </span>
                                        {uniqueMembers > 0 && (
                                            <span className="leads-view__meta-item leads-view__meta-item--highlight">
                                                <Users size={14} />
                                                {uniqueMembers}名アサイン予定
                                            </span>
                                        )}
                                    </div>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            </section>

            {/* Lead Detail Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={selectedLead?.name || ''}
                size="xl"
            >
                {selectedLead && (
                    <div className="lead-detail">
                        <div className="lead-detail__header">
                            <div className="lead-detail__client">
                                <span className="lead-detail__label">顧客名</span>
                                <span className="lead-detail__value">{selectedLead.clientName}</span>
                            </div>
                            <div className="lead-detail__probability">
                                {getProbabilityBadge(selectedLead.probability)}
                            </div>
                        </div>

                        <div className="lead-detail__section">
                            <h4 className="lead-detail__section-title">課題・ニーズ</h4>
                            <p className="lead-detail__text">{selectedLead.needs}</p>
                        </div>

                        <div className="lead-detail__section">
                            <h4 className="lead-detail__section-title">概要</h4>
                            <p className="lead-detail__text">{selectedLead.description}</p>
                        </div>

                        <div className="lead-detail__row">
                            <div className="lead-detail__item">
                                <span className="lead-detail__label">想定予算</span>
                                <span className="lead-detail__value lead-detail__value--large">
                                    ¥{selectedLead.estimatedBudget.toLocaleString()}
                                </span>
                            </div>
                            <div className="lead-detail__item">
                                <span className="lead-detail__label">想定期間</span>
                                <span className="lead-detail__value">
                                    {format(parseISO(selectedLead.startDate), 'yyyy/MM/dd', { locale: ja })} 〜
                                    {format(parseISO(selectedLead.endDate), 'yyyy/MM/dd', { locale: ja })}
                                </span>
                            </div>
                        </div>

                        {/* Planned Allocations Section */}
                        <div className="lead-detail__section lead-detail__section--allocations">
                            <div className="lead-detail__section-header">
                                <h4 className="lead-detail__section-title">
                                    <Users size={16} /> アサイン予定
                                </h4>
                                <button
                                    className="lead-detail__add-btn"
                                    onClick={handleAddAllocation}
                                >
                                    <Plus size={16} /> 追加
                                </button>
                            </div>

                            {/* Add/Edit Form */}
                            {(isAddingAllocation || editingAllocationId) && (
                                <div className="allocation-form">
                                    <div className="allocation-form__row">
                                        <div className="allocation-form__field">
                                            <label>メンバー</label>
                                            <select
                                                value={allocationForm.memberId}
                                                onChange={e => setAllocationForm({ ...allocationForm, memberId: e.target.value })}
                                            >
                                                {members.map(m => (
                                                    <option key={m.id} value={m.id}>{m.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="allocation-form__field">
                                            <label>ロール</label>
                                            <select
                                                value={allocationForm.role}
                                                onChange={e => setAllocationForm({ ...allocationForm, role: e.target.value })}
                                            >
                                                {Object.values(ROLES).map(role => (
                                                    <option key={role} value={role}>{role}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="allocation-form__field">
                                            <label>月</label>
                                            <select
                                                value={allocationForm.month}
                                                onChange={e => setAllocationForm({ ...allocationForm, month: e.target.value })}
                                            >
                                                {availableMonths.map(month => (
                                                    <option key={month} value={month}>
                                                        {format(parseISO(month + '-01'), 'yyyy年M月', { locale: ja })}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="allocation-form__field">
                                            <label>従事率 ({allocationForm.percentage}%)</label>
                                            <input
                                                type="range"
                                                min="10"
                                                max="100"
                                                step="10"
                                                value={allocationForm.percentage}
                                                onChange={e => setAllocationForm({ ...allocationForm, percentage: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div className="allocation-form__actions">
                                        <button className="allocation-form__btn allocation-form__btn--save" onClick={handleSaveAllocation}>
                                            保存
                                        </button>
                                        <button className="allocation-form__btn allocation-form__btn--cancel" onClick={handleCancelEdit}>
                                            キャンセル
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Allocations List */}
                            {allocationsByMember.length > 0 ? (
                                <div className="allocation-list">
                                    {allocationsByMember.map(({ member, allocations }) => (
                                        <div key={member.id} className="allocation-list__member">
                                            <div className="allocation-list__member-header">
                                                <div className="allocation-list__member-avatar">
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div className="allocation-list__member-info">
                                                    <span className="allocation-list__member-name">{member.name}</span>
                                                    <span className="allocation-list__member-role">{member.role}</span>
                                                </div>
                                            </div>
                                            <div className="allocation-list__items">
                                                {allocations.map(a => (
                                                    <div key={a.id} className="allocation-list__item">
                                                        <Badge size="sm" variant="purple">
                                                            {format(parseISO(a.month + '-01'), 'M月', { locale: ja })}
                                                        </Badge>
                                                        <span className="allocation-list__item-role">{a.role}</span>
                                                        <span className="allocation-list__item-pct">{a.percentage}%</span>
                                                        <div className="allocation-list__item-actions">
                                                            <button
                                                                className="allocation-list__item-btn"
                                                                onClick={() => handleEditAllocation(a)}
                                                                title="編集"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button
                                                                className="allocation-list__item-btn allocation-list__item-btn--delete"
                                                                onClick={() => handleDeleteAllocation(a.id)}
                                                                title="削除"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="allocation-list__empty">
                                    アサイン予定がありません。「追加」ボタンから登録してください。
                                </p>
                            )}
                        </div>

                        {selectedLead.risks.length > 0 && (
                            <div className="lead-detail__section lead-detail__section--warning">
                                <h4 className="lead-detail__section-title">
                                    <AlertTriangle size={16} /> リスク
                                </h4>
                                <ul className="lead-detail__list">
                                    {selectedLead.risks.map((risk, i) => (
                                        <li key={i}>{risk}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="lead-detail__section">
                            <h4 className="lead-detail__section-title">
                                <MessageSquare size={16} /> 会話ログ
                            </h4>
                            <div className="lead-detail__logs">
                                {selectedLead.logs.map(log => (
                                    <div key={log.id} className="lead-detail__log">
                                        <span className="lead-detail__log-date">
                                            {format(parseISO(log.date), 'yyyy/MM/dd', { locale: ja })}
                                        </span>
                                        <span className="lead-detail__log-summary">{log.summary}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
