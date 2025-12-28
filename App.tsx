
import React, { useState, useMemo, useCallback } from 'react';
import { INITIAL_RECIPES, CATEGORIES } from './constants';
import { RecipeCard } from './components/RecipeCard';
import { RecipeDetails } from './components/RecipeDetails';
import { PhotoAnalyzer } from './components/PhotoAnalyzer';
import { Roadmap } from './components/Roadmap';
import { Recipe } from './types';
import { getQuotaStatus } from './services/gemini';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'book' | 'camera'>('book');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Всі');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [quotaExhausted, setQuotaExhausted] = useState(false);

  const filteredRecipes = useMemo(() => {
    return INITIAL_RECIPES.filter(r => {
      const matchCategory = selectedCategory === 'Всі' || r.category === selectedCategory;
      const matchSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleQuotaError = useCallback(() => {
    setQuotaExhausted(true);
  }, []);

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-[#16f2d0]/40 pb-20">
      {/* Background Decor */}
      <div className="fixed inset-0 -z-10 bg-[#031a1c]">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] radial-glow animate-breathing" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] radial-glow animate-breathing" style={{ animationDelay: '2s' }} />
      </div>

      {(quotaExhausted || getQuotaStatus()) && (
        <div className="fixed top-0 inset-x-0 z-[100] p-4 animate-slideUp">
          <div className="glass bg-red-500/10 border-red-500/50 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-sm font-bold text-red-200">Ліміт API вичерпано</p>
                <p className="text-[10px] text-red-200/60 uppercase">Фото будуть додані пізніше</p>
              </div>
            </div>
            <button onClick={() => setQuotaExhausted(false)} className="text-red-200/40 hover:text-red-200">✕</button>
          </div>
        </div>
      )}

      {/* Header - Premium App Icon Integration */}
      <header className="px-6 pt-10 pb-6 flex justify-between items-center sticky top-0 z-30 bg-[#031a1c]/80 backdrop-blur-lg">
        <div className="flex items-center gap-3">
           <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(22,242,208,0.25)] animate-float ring-1 ring-white/10">
             <img 
               src="https://jet-engine-images.s3.amazonaws.com/1740058535310_e6d4c679f2c686f06489a842f4c3ef0549c4021278cc68019e34bc17c385b0d0.png" 
               alt="Coconut Premium Logo" 
               className="w-full h-full object-cover"
             />
           </div>
           <div className="flex flex-col">
             <h1 className="text-2xl font-black tracking-tighter leading-none text-white">Coconut</h1>
             <span className="text-[9px] uppercase tracking-[0.25em] font-extrabold text-[#16f2d0] mt-1">SMART NUTRITION</span>
           </div>
        </div>
        <button 
          onClick={() => setShowRoadmap(true)}
          className="w-11 h-11 bg-[#0a2326] border border-white/5 rounded-full flex items-center justify-center animate-breathing btn-tap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16f2d0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        </button>
      </header>

      <main className="max-w-xl mx-auto min-h-screen">
        {activeTab === 'book' ? (
          <div className="px-6 pb-24">
            <div className="mb-8 mt-4">
              <h2 className="text-4xl font-black mb-8 tracking-tight text-white">Смачні Рецепти</h2>
              
              <div className="bg-[#0a2326] flex items-center px-5 rounded-2xl mb-8 border border-white/5">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-20"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <input 
                  type="text" 
                  placeholder="Шукати рецепт..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 w-full py-4.5 px-3 text-white placeholder-white/10 font-medium"
                />
              </div>

              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`whitespace-nowrap px-7 py-2.5 rounded-full text-sm font-extrabold transition-all btn-tap ${
                      selectedCategory === cat 
                        ? 'bg-[#16f2d0] text-[#031a1c] shadow-[0_4px_15px_rgba(22,242,208,0.4)]' 
                        : 'bg-[#0a2326] text-white/30 border border-white/5'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {filteredRecipes.length > 0 ? (
                filteredRecipes.map((recipe, i) => (
                  <RecipeCard 
                    key={recipe.id} 
                    recipe={recipe} 
                    index={i} 
                    onClick={setSelectedRecipe}
                    onQuotaError={handleQuotaError}
                  />
                ))
              ) : (
                <div className="text-center py-24 opacity-20">
                  <p className="text-xl font-bold">Рецептів не знайдено</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <PhotoAnalyzer />
        )}
      </main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-[#0a2326]/80 backdrop-blur-2xl border border-white/10 rounded-[36px] p-2 flex gap-2 z-40 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <button 
          onClick={() => setActiveTab('book')}
          className={`flex-1 flex flex-col items-center justify-center py-4 rounded-[28px] transition-all duration-300 ${activeTab === 'book' ? 'bg-[#16f2d0]/10 text-[#16f2d0]' : 'text-white/20'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>
          <span className="text-[10px] font-black mt-1 tracking-wider">КНИГА</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('camera')}
          className={`flex-1 flex flex-col items-center justify-center py-4 rounded-[28px] transition-all duration-300 ${activeTab === 'camera' ? 'bg-[#16f2d0]/10 text-[#16f2d0]' : 'text-white/20'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
          <span className="text-[10px] font-black mt-1 tracking-wider">ФОТО</span>
        </button>
      </nav>

      {selectedRecipe && (
        <RecipeDetails 
          recipe={selectedRecipe} 
          onClose={() => setSelectedRecipe(null)} 
        />
      )}

      {showRoadmap && (
        <Roadmap onClose={() => setShowRoadmap(false)} />
      )}
    </div>
  );
};

export default App;
