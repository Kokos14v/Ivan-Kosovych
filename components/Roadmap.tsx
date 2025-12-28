
import React from 'react';

interface RoadmapProps {
  onClose: () => void;
}

export const Roadmap: React.FC<RoadmapProps> = ({ onClose }) => {
  const sections = [
    { title: 'Вже доступно', icon: '✅', color: 'text-emerald-400', items: ['Книга рецептів', 'Аналіз по фото', 'Instacart Інтеграція'] },
    { title: 'Скоро', icon: '🟡', color: 'text-yellow-400', items: ['Персональні цілі', 'Денний ліміт калорій'] },
    { title: 'У планах', icon: '🔵', color: 'text-blue-400', items: ['Планування меню', 'Розумні заміни'] },
    { title: 'Розширені можливості', icon: '🟣', color: 'text-purple-400', items: ['Трекінг по тижнях', 'Аналіз звичок'] },
    { title: 'Майбутнє', icon: '🚀', color: 'text-pink-400', items: ['Premium-функції', 'Apple Health / Google Fit'] },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl p-6 flex items-center justify-center">
      <div className="reveal-item w-full max-w-md glass p-8 rounded-[40px] max-h-[80vh] overflow-y-auto no-scrollbar relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-white/40">✕</button>
        <h2 className="text-3xl font-black mb-8 pr-8">Roadmap Coconut</h2>
        
        <div className="space-y-8">
          {sections.map((sec, i) => (
            <div key={i} className="space-y-3">
               <div className="flex items-center gap-2">
                 <span className="text-xl">{sec.icon}</span>
                 <h3 className={`font-bold tracking-wide uppercase text-xs ${sec.color}`}>{sec.title}</h3>
               </div>
               <div className="space-y-2 pl-8">
                 {sec.items.map((item, j) => (
                   <div key={j} className="text-white/60 text-sm flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                     {item}
                   </div>
                 ))}
               </div>
            </div>
          ))}
        </div>
        
        <button 
          onClick={onClose}
          className="w-full mt-10 py-4 glass rounded-2xl font-bold bg-white/5 active:scale-95 transition-all"
        >
          Зрозуміло
        </button>
      </div>
    </div>
  );
};
