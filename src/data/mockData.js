import { PROJECT_STATUS, ROLES } from './types';

// Generate months from startDate to endDate
const generateMonths = (startDate, endDate) => {
    const months = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
        months.push(current.toISOString().slice(0, 7)); // YYYY-MM
        current.setMonth(current.getMonth() + 1);
    }
    return months;
};

// Mock Members
export const mockMembers = [
    {
        id: 'm1',
        name: '田中 太郎',
        role: ROLES.PM,
        avatar: null,
        skills: ['プロジェクト管理', 'アジャイル', 'ステークホルダー調整']
    },
    {
        id: 'm2',
        name: '山田 花子',
        role: ROLES.TECH_LEAD,
        avatar: null,
        skills: ['Python', 'LLM', 'システム設計']
    },
    {
        id: 'm3',
        name: '佐藤 健',
        role: ROLES.DEVELOPER,
        avatar: null,
        skills: ['React', 'Node.js', 'AWS']
    },
    {
        id: 'm4',
        name: '鈴木 美咲',
        role: ROLES.DEVELOPER,
        avatar: null,
        skills: ['Python', 'データ分析', 'RAG']
    },
    {
        id: 'm5',
        name: '高橋 誠',
        role: ROLES.ANALYST,
        avatar: null,
        skills: ['要件定義', 'PoC設計', 'ビジネス分析']
    },
    {
        id: 'm6',
        name: '伊藤 愛',
        role: ROLES.DESIGNER,
        avatar: null,
        skills: ['UI/UX', 'Figma', 'ブランディング']
    }
];

// Mock Projects (Leads and Active)
export const mockProjects = [
    // Active Projects
    {
        id: 'p1',
        name: '社内ナレッジ検索AI構築',
        clientName: '大和物産株式会社',
        status: PROJECT_STATUS.ACTIVE,
        description: '社内ドキュメントを対象としたRAGシステムの構築',
        needs: '膨大な社内資料から必要な情報を素早く見つけたい',
        estimatedBudget: 25000000,
        actualRevenue: 25000000,
        plannedCost: 18000000,
        actualCost: 16500000,
        startDate: '2025-11-01',
        endDate: '2026-03-31',
        logs: [
            { id: 'l1', date: '2025-11-15', summary: 'キックオフミーティング完了' },
            { id: 'l2', date: '2025-12-20', summary: 'PoC環境構築完了' },
            { id: 'l3', date: '2026-01-25', summary: '本番環境への移行開始' }
        ],
        risks: ['社内システムとの連携遅延リスク'],
        issues: []
    },
    {
        id: 'p2',
        name: 'カスタマーサポートBot開発',
        clientName: '東京テレコム株式会社',
        status: PROJECT_STATUS.ACTIVE,
        description: 'LLMを活用した問い合わせ自動応答システム',
        needs: 'コールセンターの負荷を軽減したい',
        estimatedBudget: 35000000,
        actualRevenue: 35000000,
        plannedCost: 28000000,
        actualCost: 30000000,
        startDate: '2025-10-01',
        endDate: '2026-02-28',
        logs: [
            { id: 'l4', date: '2025-10-10', summary: '要件定義完了' },
            { id: 'l5', date: '2025-12-15', summary: 'プロトタイプレビュー' },
            { id: 'l6', date: '2026-01-20', summary: 'UAT開始' }
        ],
        risks: [],
        issues: ['想定よりもFAQデータの整備に時間がかかっている']
    },
    // Leads (Pre-sales)
    {
        id: 'p3',
        name: '営業支援AIアシスタント',
        clientName: '富士商事株式会社',
        status: PROJECT_STATUS.LEAD,
        description: '営業活動を支援するAIアシスタントの導入検討',
        needs: '営業担当者の提案書作成時間を短縮したい',
        probability: 75,
        estimatedBudget: 40000000,
        startDate: '2026-04-01',
        endDate: '2026-09-30',
        logs: [
            { id: 'l7', date: '2026-01-10', summary: '初回ヒアリング実施' },
            { id: 'l8', date: '2026-01-25', summary: '提案書提出' }
        ],
        risks: ['競合他社の提案あり'],
        issues: []
    },
    {
        id: 'p4',
        name: '製造ライン異常検知システム',
        clientName: '関西精密工業株式会社',
        status: PROJECT_STATUS.LEAD,
        description: 'IoTセンサーデータとAIを組み合わせた予知保全システム',
        needs: '製造ラインの予期せぬ停止を防ぎたい',
        probability: 50,
        estimatedBudget: 60000000,
        startDate: '2026-05-01',
        endDate: '2026-12-31',
        logs: [
            { id: 'l9', date: '2026-01-15', summary: '工場見学実施' }
        ],
        risks: ['技術的な実現可能性の検証が必要'],
        issues: []
    },
    {
        id: 'p5',
        name: '契約書レビューAI',
        clientName: '弁護士法人ひかり',
        status: PROJECT_STATUS.LEAD,
        description: '法務部門向け契約書自動レビューシステム',
        needs: '契約書チェックの効率化と見落とし防止',
        probability: 30,
        estimatedBudget: 20000000,
        startDate: '2026-06-01',
        endDate: '2026-10-31',
        logs: [
            { id: 'l10', date: '2026-01-20', summary: '課題ヒアリング' }
        ],
        risks: ['法的なデータ取り扱いへの懸念'],
        issues: []
    },
    {
        id: 'p6',
        name: 'ヘルスケアAIプラットフォーム',
        clientName: '国立医療センター',
        status: PROJECT_STATUS.LEAD,
        description: '患者データ分析と診断支援AIの研究開発',
        needs: '診断精度向上と医師の負担軽減',
        probability: 85,
        estimatedBudget: 80000000,
        startDate: '2026-04-01',
        endDate: '2027-03-31',
        logs: [
            { id: 'l11', date: '2026-01-05', summary: '共同研究提案の打ち合わせ' },
            { id: 'l12', date: '2026-01-28', summary: '契約条件の交渉中' }
        ],
        risks: ['倫理審査プロセスが長期化する可能性'],
        issues: []
    },
    {
        id: 'p7',
        name: '教育コンテンツ自動生成',
        clientName: '株式会社エデュテック',
        status: PROJECT_STATUS.LEAD,
        description: 'LLMを活用した学習教材の自動生成',
        needs: '教材作成コストを削減しながら品質を維持したい',
        probability: 15,
        estimatedBudget: 15000000,
        startDate: '2026-07-01',
        endDate: '2026-12-31',
        logs: [
            { id: 'l13', date: '2026-01-22', summary: '初回打ち合わせ（課題整理）' }
        ],
        risks: ['予算確保が不透明'],
        issues: []
    }
];

// Mock Allocations (Current and Future)
export const mockAllocations = [
    // Project p1 - Active
    { id: 'a1', memberId: 'm1', projectId: 'p1', role: ROLES.PM, month: '2025-11', percentage: 50 },
    { id: 'a2', memberId: 'm1', projectId: 'p1', role: ROLES.PM, month: '2025-12', percentage: 50 },
    { id: 'a3', memberId: 'm1', projectId: 'p1', role: ROLES.PM, month: '2026-01', percentage: 50 },
    { id: 'a4', memberId: 'm1', projectId: 'p1', role: ROLES.PM, month: '2026-02', percentage: 50 },
    { id: 'a5', memberId: 'm1', projectId: 'p1', role: ROLES.PM, month: '2026-03', percentage: 50 },

    { id: 'a6', memberId: 'm2', projectId: 'p1', role: ROLES.TECH_LEAD, month: '2025-11', percentage: 80 },
    { id: 'a7', memberId: 'm2', projectId: 'p1', role: ROLES.TECH_LEAD, month: '2025-12', percentage: 80 },
    { id: 'a8', memberId: 'm2', projectId: 'p1', role: ROLES.TECH_LEAD, month: '2026-01', percentage: 60 },
    { id: 'a9', memberId: 'm2', projectId: 'p1', role: ROLES.TECH_LEAD, month: '2026-02', percentage: 40 },
    { id: 'a10', memberId: 'm2', projectId: 'p1', role: ROLES.TECH_LEAD, month: '2026-03', percentage: 20 },

    { id: 'a11', memberId: 'm3', projectId: 'p1', role: ROLES.DEVELOPER, month: '2025-12', percentage: 100 },
    { id: 'a12', memberId: 'm3', projectId: 'p1', role: ROLES.DEVELOPER, month: '2026-01', percentage: 100 },
    { id: 'a13', memberId: 'm3', projectId: 'p1', role: ROLES.DEVELOPER, month: '2026-02', percentage: 80 },
    { id: 'a14', memberId: 'm3', projectId: 'p1', role: ROLES.DEVELOPER, month: '2026-03', percentage: 50 },

    // Project p2 - Active
    { id: 'a15', memberId: 'm1', projectId: 'p2', role: ROLES.PM, month: '2025-10', percentage: 30 },
    { id: 'a16', memberId: 'm1', projectId: 'p2', role: ROLES.PM, month: '2025-11', percentage: 30 },
    { id: 'a17', memberId: 'm1', projectId: 'p2', role: ROLES.PM, month: '2025-12', percentage: 30 },
    { id: 'a18', memberId: 'm1', projectId: 'p2', role: ROLES.PM, month: '2026-01', percentage: 40 },
    { id: 'a19', memberId: 'm1', projectId: 'p2', role: ROLES.PM, month: '2026-02', percentage: 40 },

    { id: 'a20', memberId: 'm4', projectId: 'p2', role: ROLES.DEVELOPER, month: '2025-10', percentage: 100 },
    { id: 'a21', memberId: 'm4', projectId: 'p2', role: ROLES.DEVELOPER, month: '2025-11', percentage: 100 },
    { id: 'a22', memberId: 'm4', projectId: 'p2', role: ROLES.DEVELOPER, month: '2025-12', percentage: 100 },
    { id: 'a23', memberId: 'm4', projectId: 'p2', role: ROLES.DEVELOPER, month: '2026-01', percentage: 80 },
    { id: 'a24', memberId: 'm4', projectId: 'p2', role: ROLES.DEVELOPER, month: '2026-02', percentage: 50 },

    { id: 'a25', memberId: 'm5', projectId: 'p2', role: ROLES.ANALYST, month: '2025-10', percentage: 60 },
    { id: 'a26', memberId: 'm5', projectId: 'p2', role: ROLES.ANALYST, month: '2025-11', percentage: 40 },
    { id: 'a27', memberId: 'm5', projectId: 'p2', role: ROLES.ANALYST, month: '2025-12', percentage: 20 },

    { id: 'a28', memberId: 'm6', projectId: 'p2', role: ROLES.DESIGNER, month: '2025-10', percentage: 50 },
    { id: 'a29', memberId: 'm6', projectId: 'p2', role: ROLES.DESIGNER, month: '2025-11', percentage: 30 },

    // Future Allocations (Prospects for Leads)
    { id: 'a30', memberId: 'm1', projectId: 'p3', role: ROLES.PM, month: '2026-04', percentage: 30, isProspect: true },
    { id: 'a31', memberId: 'm1', projectId: 'p3', role: ROLES.PM, month: '2026-05', percentage: 40, isProspect: true },
    { id: 'a32', memberId: 'm1', projectId: 'p3', role: ROLES.PM, month: '2026-06', percentage: 40, isProspect: true },

    { id: 'a33', memberId: 'm2', projectId: 'p3', role: ROLES.TECH_LEAD, month: '2026-04', percentage: 50, isProspect: true },
    { id: 'a34', memberId: 'm2', projectId: 'p3', role: ROLES.TECH_LEAD, month: '2026-05', percentage: 70, isProspect: true },
    { id: 'a35', memberId: 'm2', projectId: 'p3', role: ROLES.TECH_LEAD, month: '2026-06', percentage: 70, isProspect: true },

    { id: 'a36', memberId: 'm3', projectId: 'p3', role: ROLES.DEVELOPER, month: '2026-04', percentage: 80, isProspect: true },
    { id: 'a37', memberId: 'm3', projectId: 'p3', role: ROLES.DEVELOPER, month: '2026-05', percentage: 100, isProspect: true },
    { id: 'a38', memberId: 'm3', projectId: 'p3', role: ROLES.DEVELOPER, month: '2026-06', percentage: 100, isProspect: true },

    { id: 'a39', memberId: 'm5', projectId: 'p4', role: ROLES.ANALYST, month: '2026-05', percentage: 50, isProspect: true },
    { id: 'a40', memberId: 'm5', projectId: 'p4', role: ROLES.ANALYST, month: '2026-06', percentage: 60, isProspect: true },

    { id: 'a41', memberId: 'm4', projectId: 'p6', role: ROLES.DEVELOPER, month: '2026-04', percentage: 30, isProspect: true },
    { id: 'a42', memberId: 'm4', projectId: 'p6', role: ROLES.DEVELOPER, month: '2026-05', percentage: 50, isProspect: true },
    { id: 'a43', memberId: 'm4', projectId: 'p6', role: ROLES.DEVELOPER, month: '2026-06', percentage: 70, isProspect: true },

    // Some internal/admin work for variety
    { id: 'a44', memberId: 'm5', projectId: 'p1', role: ROLES.ANALYST, month: '2026-01', percentage: 30 },
    { id: 'a45', memberId: 'm5', projectId: 'p1', role: ROLES.ANALYST, month: '2026-02', percentage: 20 },

    { id: 'a46', memberId: 'm6', projectId: 'p1', role: ROLES.DESIGNER, month: '2026-01', percentage: 40 },
    { id: 'a47', memberId: 'm6', projectId: 'p1', role: ROLES.DESIGNER, month: '2026-02', percentage: 30 },
    { id: 'a48', memberId: 'm6', projectId: 'p1', role: ROLES.DESIGNER, month: '2026-03', percentage: 20 },

    // Pre-Sales Allocations (Current pre-sales activity assignments)
    // Lead p3 - 営業支援AIアシスタント (富士商事株式会社)
    { id: 'ps1', memberId: 'm1', projectId: 'p3', role: '提案リーダー', month: '2026-01', percentage: 20, isPreSales: true },
    { id: 'ps2', memberId: 'm1', projectId: 'p3', role: '提案リーダー', month: '2026-02', percentage: 15, isPreSales: true },
    { id: 'ps3', memberId: 'm2', projectId: 'p3', role: '技術支援', month: '2026-01', percentage: 10, isPreSales: true },
    { id: 'ps4', memberId: 'm2', projectId: 'p3', role: '技術支援', month: '2026-02', percentage: 20, isPreSales: true },

    // Lead p4 - 製造ライン異常検知システム (関西精密工業株式会社)
    { id: 'ps5', memberId: 'm5', projectId: 'p4', role: 'ヒアリング担当', month: '2026-01', percentage: 15, isPreSales: true },
    { id: 'ps6', memberId: 'm5', projectId: 'p4', role: 'ヒアリング担当', month: '2026-02', percentage: 20, isPreSales: true },
    { id: 'ps7', memberId: 'm2', projectId: 'p4', role: '技術支援', month: '2026-02', percentage: 10, isPreSales: true },

    // Lead p6 - ヘルスケアAIプラットフォーム (国立医療センター)
    { id: 'ps8', memberId: 'm1', projectId: 'p6', role: '営業リード', month: '2026-01', percentage: 10, isPreSales: true },
    { id: 'ps9', memberId: 'm1', projectId: 'p6', role: '営業リード', month: '2026-02', percentage: 15, isPreSales: true },
    { id: 'ps10', memberId: 'm4', projectId: 'p6', role: '技術支援', month: '2026-01', percentage: 10, isPreSales: true },
    { id: 'ps11', memberId: 'm4', projectId: 'p6', role: '技術支援', month: '2026-02', percentage: 15, isPreSales: true },

    // Lead p5 - 契約書レビューAI (弁護士法人ひかり)
    { id: 'ps12', memberId: 'm5', projectId: 'p5', role: 'ヒアリング担当', month: '2026-01', percentage: 10, isPreSales: true },
];

export default {
    members: mockMembers,
    projects: mockProjects,
    allocations: mockAllocations
};
