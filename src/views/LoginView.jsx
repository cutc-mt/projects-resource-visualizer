import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, AlertCircle } from 'lucide-react';
import './LoginView.css';

export default function LoginView() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Simulate slight delay for UX
        setTimeout(() => {
            if (login(password)) {
                navigate('/manager');
            } else {
                setError('パスワードが正しくありません');
                setPassword('');
            }
            setIsLoading(false);
        }, 500);
    };

    return (
        <div className="login-view">
            <div className="login-view__card glass-card">
                <div className="login-view__header">
                    <div className="login-view__icon">
                        <Lock size={32} />
                    </div>
                    <h1 className="login-view__title">マネージャーモード</h1>
                    <p className="login-view__subtitle">
                        リソース管理機能にアクセスするには<br />パスワードを入力してください
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="login-view__form">
                    {error && (
                        <div className="login-view__error">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="login-view__field">
                        <label htmlFor="password">パスワード</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="パスワードを入力"
                            autoFocus
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="login-view__submit"
                        disabled={isLoading || !password}
                    >
                        {isLoading ? 'ログイン中...' : 'ログイン'}
                    </button>
                </form>

                <div className="login-view__footer">
                    <a href="/" className="login-view__back">← 一般モードに戻る</a>
                </div>
            </div>
        </div>
    );
}
