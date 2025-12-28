
import React from 'react';
import { Recipe } from '../types';

interface RecipeDetailsProps {
  recipe: Recipe;
  onClose: () => void;
}

export const RecipeDetails: React.FC<RecipeDetailsProps> = ({ recipe, onClose }) => {
  const getInstacartUrl = (ingredient: string) => {
    const clean = ingredient.replace(/\d+\w*\.?\s*/g, '').trim();
    return `https://www.instacart.com/store/s?k=${encodeURIComponent(clean)}`;
  };

  const buyAll = () => {
    const query = recipe.ingredients.map(i => i.replace(/\d+\w*\.?\s*/g, '').trim()).join(',');
    window.open(`https://www.instacart.com/store/s?k=${encodeURIComponent(query)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="reveal-item w-full max-w-lg glass h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-[32px] sm:rounded-[32px] overflow-y-auto no-scrollbar relative shadow-2xl border border-white/10">
        {/* Header Image */}
        <div className="relative h-64 bg-[#0a2326]">
           {recipe.image ? (
             <img src={recipe.image} className="w-full h-full object-cover" alt={recipe.title} />
           ) : (
             <div className="w-full h-full flex items-center justify-center opacity-10">
               <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
             </div>
           )}
           <div className="absolute inset-0 bg-gradient-to-t from-[#031a1c] to-transparent opacity-80" />
           <button 
             onClick={onClose}
             className="absolute top-6 right-6 w-10 h-10 glass rounded-full flex items-center justify-center text-white/70 active:scale-90 transition-transform border border-white/10"
           >
             ✕
           </button>
        </div>

        <div className="p-8 -mt-12 relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-extrabold mb-2 leading-tight text-white">{recipe.title}</h2>
              <p className="text-[#16f2d0] font-medium uppercase text-xs tracking-widest">{recipe.category}</p>
            </div>
            <div className="text-right">
                <span className="text-2xl font-black text-[#16f2d0]">{recipe.nutrition?.kcal || 0}</span>
                <span className="block text-[10px] text-white/40 uppercase tracking-widest">Ккал на порцію</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Білки', val: recipe.nutrition?.protein, color: 'border-emerald-500' },
              { label: 'Вугл', val: recipe.nutrition?.carbs, color: 'border-cyan-500' },
              { label: 'Жири', val: recipe.nutrition?.fat, color: 'border-teal-500' }
            ].map((item, i) => (
              <div key={i} className={`glass p-3 rounded-2xl text-center border-l-4 ${item.color}`}>
                <p className="text-lg font-bold text-white">{item.val || 0}г</p>
                <p className="text-[10px] uppercase text-white/40 font-bold">{item.label}</p>
              </div>
            ))}
          </div>

          <h4 className="text-xl font-bold mb-4 flex items-center text-white">
            Інгредієнти
            <button 
              onClick={buyAll}
              className="ml-auto text-[10px] font-black uppercase tracking-wider text-[#16f2d0] border border-[#16f2d0]/30 px-4 py-1.5 rounded-full active:scale-95 transition-all hover:bg-[#16f2d0]/5"
            >
              Купити в Instacart
            </button>
          </h4>
          <ul className="space-y-3 mb-8">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex justify-between items-center group glass px-4 py-2 rounded-xl border-white/5">
                <span className="text-white/80 text-sm">{ing}</span>
                <a 
                  href={getInstacartUrl(ing)} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-white/20 group-hover:text-[#16f2d0] transition-colors p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                </a>
              </li>
            ))}
          </ul>

          <h4 className="text-xl font-bold mb-4 text-white">Приготування</h4>
          <div className="space-y-4">
             {recipe.instructions.map((step, i) => (
               <div key={i} className="flex gap-4 glass p-4 rounded-2xl border-white/5">
                 <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#16f2d0]/10 border border-[#16f2d0]/30 text-[#16f2d0] text-xs flex items-center justify-center font-black">{i+1}</span>
                 <p className="text-white/70 text-sm leading-relaxed">{step}</p>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};
