import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '../components/UI';
import { Settings, Save, RotateCcw, Info } from 'lucide-react';
import { PROBABILITY_LABELS, DEFAULT_PROBABILITY_WEIGHTS } from '../data/settings';
import './SettingsView.css';

export default function SettingsView() {
    const { probabilityWeights, setProbabilityWeights, managerMode } = useApp();

    // Local state for form
    const [weights, setWeights] = useState({ ...probabilityWeights });
    const [saved, setSaved] = useState(false);

    const handleWeightChange = (level, value) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= 1) {
            setWeights(prev => ({ ...prev, [level]: numValue }));
            setSaved(false);
        }
    };

    const handleSave = () => {
        setProbabilityWeights(weights);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleReset = () => {
        setWeights({ ...DEFAULT_PROBABILITY_WEIGHTS });
        setProbabilityWeights(DEFAULT_PROBABILITY_WEIGHTS);
        setSaved(false);
    };

    if (!managerMode) {
        return (
            <div className="settings-view">
                <div className="settings-view__restricted">
                    <Settings size={48} />
                    <h2>アクセス制限</h2>
                    <p>設定画面はマネージャーモードでのみ利用可能です。</p>
                </div>
            </div>
        );
    }

    return (
        <div className="settings-view">
            <header className="settings-view__header">
                <h2 className="settings-view__title">
                    <Settings size={24} />
                    システム設定
                </h2>
            </header>

            <div className="settings-view__content">
                <Card className="settings-view__card">
                    <CardHeader>
                        <CardTitle>確度別重み設定</CardTitle>
                        <Badge variant="info">売上予測</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="settings-view__info">
                            <Info size={16} />
                            <p>
                                プレ活動の売上見込み計算で使用する重みを設定します。
                                各確度レベルの案件額に重みを掛けて加重見込額を算出します。
                            </p>
                        </div>

                        <div className="settings-view__weights">
                            {Object.entries(PROBABILITY_LABELS).map(([level, label]) => (
                                <div key={level} className="settings-view__weight-row">
                                    <div className="settings-view__weight-label">
                                        <span className={`settings-view__weight-indicator settings-view__weight-indicator--${level.toLowerCase()}`} />
                                        <span>{label}</span>
                                    </div>
                                    <div className="settings-view__weight-input">
                                        <input
                                            type="number"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={weights[level]}
                                            onChange={(e) => handleWeightChange(level, e.target.value)}
                                        />
                                        <span className="settings-view__weight-percent">
                                            = {Math.round(weights[level] * 100)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="settings-view__example">
                            <h4>計算例</h4>
                            <p>
                                確度「高」の1,000万円案件 → 加重見込額: ¥{(10000000 * weights.HIGH).toLocaleString()}
                            </p>
                            <p>
                                確度「中」の1,000万円案件 → 加重見込額: ¥{(10000000 * weights.MEDIUM).toLocaleString()}
                            </p>
                        </div>

                        <div className="settings-view__actions">
                            <button
                                className="settings-view__btn settings-view__btn--save"
                                onClick={handleSave}
                            >
                                <Save size={16} />
                                {saved ? '保存しました' : '保存'}
                            </button>
                            <button
                                className="settings-view__btn settings-view__btn--reset"
                                onClick={handleReset}
                            >
                                <RotateCcw size={16} />
                                デフォルトに戻す
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
