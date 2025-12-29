
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { INITIAL_RECIPES, CATEGORIES } from './constants';
import { RecipeCard } from './components/RecipeCard';
import { RecipeDetails } from './components/RecipeDetails';
import { PhotoAnalyzer } from './components/PhotoAnalyzer';
import { Roadmap } from './components/Roadmap';
import { Recipe } from './types';
import { getQuotaStatus, setQuotaExhausted } from './services/gemini';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'book' | 'camera'>('book');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Всі');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [quotaExhaustedUI, setQuotaExhaustedUI] = useState(false);
  const [isPaidMode, setIsPaidMode] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsPaidMode(hasKey);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setIsPaidMode(true);
      setQuotaExhausted(false);
      setQuotaExhaustedUI(false);
      window.location.reload(); 
    }
  };

  const filteredRecipes = useMemo(() => {
    return INITIAL_RECIPES.filter(r => {
      const matchCategory = selectedCategory === 'Всі' || r.category === selectedCategory;
      const matchSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleQuotaError = useCallback(() => {
    if (!isPaidMode) {
      setQuotaExhaustedUI(true);
      setQuotaExhausted(true);
    }
  }, [isPaidMode]);

  const resetQuota = () => {
    setQuotaExhausted(false);
    setQuotaExhaustedUI(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-[#16f2d0]/40 pb-20 bg-[#031a1c]">
      {/* Background Decor */}
      <div className="fixed inset-0 -z-10 bg-[#031a1c]">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] radial-glow animate-breathing" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] radial-glow animate-breathing" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="px-6 pt-10 pb-6 flex justify-between items-center sticky top-0 z-[60] bg-[#031a1c]/90 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
           <div className="w-11 h-11 rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(22,242,208,0.25)] ring-1 ring-white/10">
             <img 
               src="https://jet-engine-images.s3.amazonaws.com/1740058535310_e6d4c679f2c686f06489a842f4c3ef0549c4021278cc68019e34bc17c385b0d0.png" 
               alt="Coconut Logo" 
               className="w-full h-full object-cover"
             />
           </div>
           <div className="flex flex-col">
             <div className="flex items-center gap-2">
               <h1 className="text-xl font-black tracking-tighter leading-none text-white">Coconut</h1>
               <button 
                 onClick={handleSelectKey}
                 className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-tighter border ${isPaidMode ? 'bg-[#16f2d0]/10 border-[#16f2d0]/30 text-[#16f2d0]' : 'bg-white/5 border-white/10 text-white/40'}`}
               >
                 {isPaidMode ? 'PREMIUM AI' : 'FREE AI'}
               </button>
             </div>
             <span className="text-[8px] uppercase tracking-[0.2em] font-extrabold text-[#16f2d0] mt-0.5">SMART NUTRITION</span>
           </div>
        </div>
        <button 
          onClick={() => setShowRoadmap(true)}
          className="w-10 h-10 bg-[#0a2326] border border-white/5 rounded-full flex items-center justify-center text-[#16f2d0] btn-tap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        </button>
      </header>

      {/* Improved Quota Banner */}
      {(quotaExhaustedUI || getQuotaStatus()) && !isPaidMode && (
        <div className="fixed top-24 inset-x-0 z-50 px-6 animate-slideUp">
          <div className="glass bg-red-500/10 border-red-500/20 p-4 rounded-3xl flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="text-lg">⏳</span>
              <div>
                <p className="text-xs font-bold text-red-200 uppercase">AI на паузі</p>
                <p className="text-[10px] text-red-200/50">Google обмежив швидкість. Зачекайте...</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <button 
                 onClick={resetQuota}
                 className="px-3 py-1.5 bg-red-500/20 text-red-200 text-[9px] font-black uppercase rounded-xl border border-red-500/30"
               >
                 Оновити
               </button>
               <button onClick={handleSelectKey} className="px-3 py-1.5 bg-[#16f2d0]/20 text-[#16f2d0] text-[9px] font-black uppercase rounded-xl border border-[#16f2d0]/30">
                 Pro
               </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-xl mx-auto min-h-screen">
        {activeTab === 'book' ? (
          <div className="px-6 pb-24 pt-4">
            <div className="mb-6">
              <h2 className="text-3xl font-black mb-6 tracking-tight text-white">Смачні Рецепти</h2>
              
              <div className="bg-[#0a2326] flex items-center px-4 rounded-2xl mb-6 border border-white/5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-20"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <input 
                  type="text" 
                  placeholder="Шукати страву..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 w-full py-4 px-3 text-white placeholder-white/10 text-sm"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`whitespace-nowrap px-5 py-2 rounded-full text-[11px] font-black transition-all ${
                      selectedCategory === cat 
                        ? 'bg-[#16f2d0] text-[#031a1c]' 
                        : 'bg-[#0a2326] text-white/30 border border-white/5'
                    }`}
                  >
                    {cat.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1">
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
                <div className="text-center py-20 opacity-20">
                  <p className="text-lg font-bold">Нічого не знайдено</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <PhotoAnalyzer />
        )}
      </main>

      {/* Nav */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-[#0a2326]/80 backdrop-blur-3xl border border-white/10 rounded-[32px] p-2 flex gap-1 z-[70] shadow-2xl">
        <button 
          onClick={() => setActiveTab('book')}
          className={`flex-1 flex flex-col items-center justify-center py-3.5 rounded-[24px] transition-all ${activeTab === 'book' ? 'bg-[#16f2d0]/10 text-[#16f2d0]' : 'text-white/20'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>
          <span className="text-[9px] font-black mt-1 tracking-widest uppercase">Книга</span>
        </button>
        <button 
          onClick={() => setActiveTab('camera')}
          className={`flex-1 flex flex-col items-center justify-center py-3.5 rounded-[24px] transition-all ${activeTab === 'camera' ? 'bg-[#16f2d0]/10 text-[#16f2d0]' : 'text-white/20'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
          <span className="text-[9px] font-black mt-1 tracking-widest uppercase">Фото</span>
        </button>
      </nav>

      {selectedRecipe && (
        <RecipeDetails recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
      )}
      {showRoadmap && <Roadmap onClose={() => setShowRoadmap(false)} />}
    </div>
  );
};

export default App;
