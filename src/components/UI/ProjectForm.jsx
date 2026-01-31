import { useState, useEffect } from 'react';
import { PROJECT_STATUS } from '../../data/types';
import { format } from 'date-fns';
import './ProjectForm.css';

/**
 * ProjectForm - 共通フォームコンポーネント for プレ活動/受注案件の登録・編集
 * 
 * @param {Object} props
 * @param {Object} props.initialData - 編集時の初期データ
 * @param {string} props.mode - 'lead' | 'project' | 'convert'
 * @param {Function} props.onSubmit - フォーム送信時のコールバック
 * @param {Function} props.onCancel - キャンセル時のコールバック
 */
export default function ProjectForm({ initialData, mode = 'lead', onSubmit, onCancel }) {
    const isLead = mode === 'lead';
    const isConvert = mode === 'convert';

    const getDefaultFormData = () => ({
        projectCode: '',
        name: '',
        clientName: '',
        description: '',
        needs: '',
        estimatedBudget: 10000000,
        actualRevenue: 0,
        plannedCost: 0,
        actualCost: 0,
        probability: 50,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        logs: [],
        risks: [],
        issues: [],
    });

    const [formData, setFormData] = useState(getDefaultFormData);
    const [newRisk, setNewRisk] = useState('');
    const [newIssue, setNewIssue] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...getDefaultFormData(),
                ...initialData,
                // Ensure actualRevenue is set for conversion
                actualRevenue: initialData.actualRevenue || initialData.estimatedBudget || 0,
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const handleAddRisk = () => {
        if (newRisk.trim()) {
            setFormData(prev => ({
                ...prev,
                risks: [...prev.risks, newRisk.trim()]
            }));
            setNewRisk('');
        }
    };

    const handleRemoveRisk = (index) => {
        setFormData(prev => ({
            ...prev,
            risks: prev.risks.filter((_, i) => i !== index)
        }));
    };

    const handleAddIssue = () => {
        if (newIssue.trim()) {
            setFormData(prev => ({
                ...prev,
                issues: [...prev.issues, newIssue.trim()]
            }));
            setNewIssue('');
        }
    };

    const handleRemoveIssue = (index) => {
        setFormData(prev => ({
            ...prev,
            issues: prev.issues.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const submitData = {
            ...formData,
            status: isLead ? PROJECT_STATUS.LEAD : PROJECT_STATUS.ACTIVE,
        };

        // Remove probability for active projects
        if (!isLead) {
            delete submitData.probability;
        }

        onSubmit(submitData);
    };

    const getTitle = () => {
        if (isConvert) return 'プレ活動を受注に変換';
        if (isLead) return initialData ? 'プレ活動を編集' : '新規プレ活動登録';
        return initialData ? '受注案件を編集' : '新規受注案件登録';
    };

    return (
        <form className="project-form" onSubmit={handleSubmit}>
            <h3 className="project-form__title">{getTitle()}</h3>

            {isConvert && (
                <div className="project-form__notice">
                    <p>このプレ活動を受注案件として確定します。</p>
                    <ul>
                        <li>アサイン予定は正式なアロケーションに変換されます</li>
                        <li>プレ担当者のアサインは削除されます</li>
                    </ul>
                </div>
            )}

            <div className="project-form__grid">
                <div className="project-form__field">
                    <label htmlFor="projectCode">案件ID</label>
                    <input
                        type="text"
                        id="projectCode"
                        name="projectCode"
                        value={formData.projectCode || ''}
                        onChange={handleChange}
                        placeholder="例: PRJ-2026-001"
                    />
                </div>

                <div className="project-form__field project-form__field--full">
                    <label htmlFor="name">案件名 *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="例: 社内ナレッジ検索AI構築"
                    />
                </div>

                <div className="project-form__field project-form__field--full">
                    <label htmlFor="clientName">顧客名 *</label>
                    <input
                        type="text"
                        id="clientName"
                        name="clientName"
                        value={formData.clientName}
                        onChange={handleChange}
                        required
                        placeholder="例: 大和物産株式会社"
                    />
                </div>

                <div className="project-form__field project-form__field--full">
                    <label htmlFor="description">概要</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        placeholder="プロジェクトの概要を入力してください"
                    />
                </div>

                <div className="project-form__field project-form__field--full">
                    <label htmlFor="needs">課題・ニーズ</label>
                    <textarea
                        id="needs"
                        name="needs"
                        value={formData.needs}
                        onChange={handleChange}
                        rows={2}
                        placeholder="顧客の課題やニーズを入力してください"
                    />
                </div>

                {isLead && !isConvert && (
                    <div className="project-form__field">
                        <label htmlFor="probability">受注確度: {formData.probability}%</label>
                        <input
                            type="range"
                            id="probability"
                            name="probability"
                            min="0"
                            max="100"
                            step="5"
                            value={formData.probability}
                            onChange={handleChange}
                        />
                        <div className="project-form__range-labels">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>
                )}

                <div className="project-form__field">
                    <label htmlFor="estimatedBudget">
                        {isLead && !isConvert ? '想定予算（円）' : '売上（円）'}
                    </label>
                    <input
                        type="number"
                        id="estimatedBudget"
                        name={isLead && !isConvert ? 'estimatedBudget' : 'actualRevenue'}
                        value={isLead && !isConvert ? formData.estimatedBudget : formData.actualRevenue}
                        onChange={handleChange}
                        min="0"
                        step="1000000"
                    />
                </div>

                {(!isLead || isConvert) && (
                    <>
                        <div className="project-form__field">
                            <label htmlFor="plannedCost">計画コスト（円）</label>
                            <input
                                type="number"
                                id="plannedCost"
                                name="plannedCost"
                                value={formData.plannedCost}
                                onChange={handleChange}
                                min="0"
                                step="1000000"
                            />
                        </div>
                        <div className="project-form__field">
                            <label htmlFor="actualCost">実績コスト（円）</label>
                            <input
                                type="number"
                                id="actualCost"
                                name="actualCost"
                                value={formData.actualCost}
                                onChange={handleChange}
                                min="0"
                                step="1000000"
                            />
                        </div>
                    </>
                )}

                <div className="project-form__field">
                    <label htmlFor="startDate">開始日</label>
                    <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                    />
                </div>

                <div className="project-form__field">
                    <label htmlFor="endDate">終了日</label>
                    <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                    />
                </div>

                {/* Risks */}
                <div className="project-form__field project-form__field--full">
                    <label>リスク</label>
                    <div className="project-form__list-input">
                        <input
                            type="text"
                            value={newRisk}
                            onChange={(e) => setNewRisk(e.target.value)}
                            placeholder="リスクを入力"
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRisk())}
                        />
                        <button type="button" onClick={handleAddRisk}>追加</button>
                    </div>
                    {formData.risks.length > 0 && (
                        <ul className="project-form__list">
                            {formData.risks.map((risk, i) => (
                                <li key={i}>
                                    {risk}
                                    <button type="button" onClick={() => handleRemoveRisk(i)}>×</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Issues (only for projects) */}
                {(!isLead || isConvert) && (
                    <div className="project-form__field project-form__field--full">
                        <label>課題</label>
                        <div className="project-form__list-input">
                            <input
                                type="text"
                                value={newIssue}
                                onChange={(e) => setNewIssue(e.target.value)}
                                placeholder="課題を入力"
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddIssue())}
                            />
                            <button type="button" onClick={handleAddIssue}>追加</button>
                        </div>
                        {formData.issues.length > 0 && (
                            <ul className="project-form__list">
                                {formData.issues.map((issue, i) => (
                                    <li key={i}>
                                        {issue}
                                        <button type="button" onClick={() => handleRemoveIssue(i)}>×</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            <div className="project-form__actions">
                <button type="button" className="project-form__btn project-form__btn--cancel" onClick={onCancel}>
                    キャンセル
                </button>
                <button type="submit" className="project-form__btn project-form__btn--submit">
                    {isConvert ? '受注に変換' : initialData ? '更新' : '登録'}
                </button>
            </div>
        </form>
    );
}
