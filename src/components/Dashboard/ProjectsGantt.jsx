import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { format, parseISO, differenceInDays, startOfMonth, endOfMonth, addMonths, eachMonthOfInterval } from 'date-fns';
import { ja } from 'date-fns/locale';
import './ProjectsGantt.css';

export default function ProjectsGantt({ onSelectProject }) {
    const { activeProjects, leads } = useApp();

    // Combine active projects and leads for timeline
    const allProjects = useMemo(() => {
        return [
            ...activeProjects.map(p => ({ ...p, type: 'active' })),
            ...leads.map(p => ({ ...p, type: 'lead' }))
        ].sort((a, b) => parseISO(a.startDate) - parseISO(b.startDate));
    }, [activeProjects, leads]);

    // Calculate timeline range
    const timelineRange = useMemo(() => {
        if (allProjects.length === 0) {
            const now = new Date();
            return {
                start: startOfMonth(now),
                end: endOfMonth(addMonths(now, 6)),
                months: []
            };
        }

        const dates = allProjects.flatMap(p => [parseISO(p.startDate), parseISO(p.endDate)]);
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));

        // Add padding
        const start = startOfMonth(addMonths(minDate, -1));
        const end = endOfMonth(addMonths(maxDate, 1));

        const months = eachMonthOfInterval({ start, end });

        return { start, end, months };
    }, [allProjects]);

    // Calculate total days in timeline
    const totalDays = useMemo(() => {
        return differenceInDays(timelineRange.end, timelineRange.start);
    }, [timelineRange]);

    // Calculate bar position and width
    const getBarStyle = (project) => {
        const projectStart = parseISO(project.startDate);
        const projectEnd = parseISO(project.endDate);

        const startOffset = differenceInDays(projectStart, timelineRange.start);
        const duration = differenceInDays(projectEnd, projectStart);

        const left = (startOffset / totalDays) * 100;
        const width = (duration / totalDays) * 100;

        return {
            left: `${Math.max(0, left)}%`,
            width: `${Math.min(width, 100 - left)}%`
        };
    };

    // Get progress percentage for active projects
    const getProgress = (project) => {
        if (project.type === 'lead') return 0;

        const start = parseISO(project.startDate);
        const end = parseISO(project.endDate);
        const now = new Date();

        if (now < start) return 0;
        if (now > end) return 100;

        const total = differenceInDays(end, start);
        const elapsed = differenceInDays(now, start);

        return Math.round((elapsed / total) * 100);
    };

    // Today marker position
    const todayPosition = useMemo(() => {
        const today = new Date();
        const offset = differenceInDays(today, timelineRange.start);
        return (offset / totalDays) * 100;
    }, [timelineRange, totalDays]);

    return (
        <div className="projects-gantt">
            <div className="projects-gantt__container">
                {/* Header with months */}
                <div className="projects-gantt__header">
                    <div className="projects-gantt__label-col">プロジェクト</div>
                    <div className="projects-gantt__timeline-header">
                        {timelineRange.months.map((month, index) => (
                            <div
                                key={index}
                                className="projects-gantt__month"
                                style={{ width: `${100 / timelineRange.months.length}%` }}
                            >
                                {format(month, 'yyyy/M月', { locale: ja })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Project rows */}
                <div className="projects-gantt__body">
                    {allProjects.map(project => {
                        const barStyle = getBarStyle(project);
                        const progress = getProgress(project);
                        const isLead = project.type === 'lead';

                        return (
                            <div
                                key={project.id}
                                className="projects-gantt__row"
                                onClick={() => onSelectProject && onSelectProject(project.id)}
                            >
                                <div className="projects-gantt__label-col">
                                    <div className="projects-gantt__project-info">
                                        <span className={`projects-gantt__project-name ${isLead ? 'projects-gantt__project-name--lead' : ''}`}>
                                            {isLead && <span className="projects-gantt__lead-badge">見込</span>}
                                            {project.name}
                                        </span>
                                        <span className="projects-gantt__project-client">{project.clientName}</span>
                                    </div>
                                </div>
                                <div className="projects-gantt__timeline-col">
                                    {/* Grid lines */}
                                    <div className="projects-gantt__grid">
                                        {timelineRange.months.map((_, index) => (
                                            <div
                                                key={index}
                                                className="projects-gantt__grid-line"
                                                style={{ left: `${(index / timelineRange.months.length) * 100}%` }}
                                            />
                                        ))}
                                    </div>

                                    {/* Today marker */}
                                    {todayPosition >= 0 && todayPosition <= 100 && (
                                        <div
                                            className="projects-gantt__today-marker"
                                            style={{ left: `${todayPosition}%` }}
                                        />
                                    )}

                                    {/* Project bar */}
                                    <div
                                        className={`projects-gantt__bar ${isLead ? 'projects-gantt__bar--lead' : 'projects-gantt__bar--active'}`}
                                        style={barStyle}
                                        title={`${project.name}: ${format(parseISO(project.startDate), 'yyyy/MM/dd')} - ${format(parseISO(project.endDate), 'yyyy/MM/dd')}`}
                                    >
                                        {!isLead && progress > 0 && (
                                            <div
                                                className="projects-gantt__bar-progress"
                                                style={{ width: `${progress}%` }}
                                            />
                                        )}
                                        <span className="projects-gantt__bar-label">
                                            {isLead ? `${project.probability}%` : `${progress}%`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="projects-gantt__legend">
                <div className="projects-gantt__legend-item">
                    <span className="projects-gantt__legend-bar projects-gantt__legend-bar--active"></span>
                    受注案件（進捗率表示）
                </div>
                <div className="projects-gantt__legend-item">
                    <span className="projects-gantt__legend-bar projects-gantt__legend-bar--lead"></span>
                    プレ活動（受注確度表示）
                </div>
                <div className="projects-gantt__legend-item">
                    <span className="projects-gantt__legend-today"></span>
                    今日
                </div>
            </div>
        </div>
    );
}
