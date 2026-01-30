import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { format, addMonths, parseISO, startOfMonth } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronDown, ChevronRight } from 'lucide-react';
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

export default function ResourceMatrix({ onSelectMember }) {
    const { members, allocations, getProjectById } = useApp();
    const [expandedMemberId, setExpandedMemberId] = useState(null);
    const months = useMemo(() => generateMonthRange(2, 6), []);

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
                monthlyData
            };
        });
    }, [members, allocations, months, getProjectById]);

    const toggleExpand = (memberId) => {
        setExpandedMemberId(expandedMemberId === memberId ? null : memberId);
    };

    return (
        <div className="resource-matrix">
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
                                        <div className="resource-matrix__member-info">
                                            <span className="resource-matrix__member-name">{member.name}</span>
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
                                {expandedMemberId === member.id && (
                                    <tr className="resource-matrix__detail-row">
                                        <td colSpan={months.length + 1}>
                                            <div className="resource-matrix__detail">
                                                <table className="resource-matrix__detail-table">
                                                    <tbody>
                                                        {/* Get unique projects for this member */}
                                                        {Array.from(new Set(
                                                            member.monthlyData
                                                                .flatMap(m => m.projectBreakdown)
                                                                .map(p => p.projectId)
                                                        )).map(projectId => {
                                                            const firstOccurrence = member.monthlyData
                                                                .flatMap(m => m.projectBreakdown)
                                                                .find(p => p.projectId === projectId);

                                                            return (
                                                                <tr key={projectId} className="resource-matrix__detail-project-row">
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
                                                                                    <span className={`resource-matrix__detail-value ${allocation.isProspect ? 'resource-matrix__detail-value--prospect' : ''}`}>
                                                                                        {allocation.percentage}%
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="resource-matrix__detail-value resource-matrix__detail-value--empty">-</span>
                                                                                )}
                                                                            </td>
                                                                        );
                                                                    })}
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
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
        </div>
    );
}
