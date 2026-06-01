"use client";

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "landing", label: "홈" },
  { id: "gonggo", label: "분양공고" },
  { id: "gyeongjaengnyul", label: "경쟁률" },
  { id: "dangjeon", label: "당첨분석" },
];

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">청</span>
            </div>
            <span className="text-white font-semibold text-lg">청약 대시보드</span>
            <span className="text-slate-400 text-xs bg-slate-800 px-2 py-0.5 rounded">
              한국부동산원 공공데이터
            </span>
          </div>
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
