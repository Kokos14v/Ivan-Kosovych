
import React, { useEffect, useState, useRef } from 'react';
import { Recipe } from '../types';
import { generateRecipeImage, estimateRecipeNutrition, isQuotaError, getQuotaStatus } from '../services/gemini';
import { saveImage, getImage, saveMeta, getMeta } from '../services/storage';

interface RecipeCardProps {
  recipe: Recipe;
  index: number;
  onClick: (recipe: Recipe) => void;
  onQuotaError?: () => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, index, onClick, onQuotaError }) => {
  const [localRecipe, setLocalRecipe] = useState(recipe);
  const [loading, setLoading] = useState(true);
  const [quotaHit, setQuotaHit] = useState(getQuotaStatus());
  const enrichmentStarted = useRef(false);

  useEffect(() => {
    const enrich = async () => {
      // Logic Lock: Only start if we don't have complete data in memory
      if ((localRecipe.image && localRecipe.nutrition) || enrichmentStarted.current) {
        if (localRecipe.image && localRecipe.nutrition) setLoading(false);
        return;
      }
      enrichmentStarted.current = true;

      try {
        // PERMANENT ASSETS RULE: Check persistent storage first (IndexedDB)
        let cachedMeta = await getMeta(recipe.id);
        let cachedImg = await getImage(recipe.id);

        if (cachedMeta && cachedImg) {
          setLocalRecipe(prev => ({ ...prev, nutrition: cachedMeta.nutrition, image: cachedImg }));
          setLoading(false);
          return;
        }

        // QUOTA SAFETY: Check global status
        if (getQuotaStatus()) {
          setQuotaHit(true);
          setLoading(false);
          return;
        }

        setLoading(true);

        let nutrition = cachedMeta?.nutrition || null;
        let image = cachedImg || null;

        // Image generation logic with strict reuse rule
        if (!image && !getQuotaStatus()) {
          try {
            image = await generateRecipeImage(recipe.title);
            if (image && image.startsWith('data:')) {
              await saveImage(recipe.id, image);
            }
          } catch (imgErr) {
            if (isQuotaError(imgErr)) {
              setQuotaHit(true);
              onQuotaError?.();
            }
          }
        }

        // Nutrition estimation logic
        if (!nutrition && !getQuotaStatus()) {
          try {
            nutrition = await estimateRecipeNutrition(recipe.title, recipe.ingredients);
            await saveMeta(recipe.id, { nutrition });
          } catch (nutErr) {
            if (isQuotaError(nutErr)) {
              setQuotaHit(true);
              onQuotaError?.();
            }
            nutrition = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
          }
        }
        
        setLocalRecipe(prev => ({ 
          ...prev, 
          nutrition: nutrition || prev.nutrition, 
          image: image || prev.image || "" 
        }));
      } catch (err) {
        console.error("Recipe enrichment error:", err);
      } finally {
        setLoading(false);
        setQuotaHit(getQuotaStatus());
      }
    };
    enrich();
  }, [recipe.id, recipe.title, recipe.ingredients, onQuotaError]);

  const handleCardClick = () => {
    if (!loading) {
      onClick(localRecipe);
    }
  };

  return (
    <div 
      className={`reveal-item bg-[#0a2326] rounded-[32px] overflow-hidden mb-6 btn-tap shadow-xl border border-white/5 ${loading ? 'cursor-wait opacity-80' : 'cursor-pointer'}`}
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={handleCardClick}
    >
      <div className="relative h-56 overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/5 animate-pulse">
             <div className="w-10 h-10 border-3 border-[#16f2d0]/20 border-t-[#16f2d0] rounded-full animate-spin"></div>
          </div>
        ) : localRecipe.image ? (
          <img 
            src={localRecipe.image} 
            alt={localRecipe.title} 
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/5 p-6 text-center">
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-20 mb-2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
             <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest px-4">
               {quotaHit ? "Ліміт AI вичерпано. Фото буде додано пізніше." : "Зображення недоступне"}
             </p>
          </div>
        )}
        <div className="absolute top-5 left-5">
          <span className="px-4 py-1.5 bg-[#0a2326]/60 backdrop-blur-md text-[10px] font-black uppercase tracking-widest rounded-full text-white/90 border border-white/10">
            {localRecipe.category}
          </span>
        </div>
      </div>
      
      <div className="p-6 relative">
        <h3 className="text-2xl font-black mb-3 text-white line-clamp-1">{localRecipe.title}</h3>
        
        <div className="flex flex-col gap-1">
          <p className="text-[#16f2d0] text-lg font-extrabold">
            {loading ? "Аналіз..." : (localRecipe.nutrition?.kcal ? `${localRecipe.nutrition.kcal} Ккал` : (quotaHit ? "Ліміт AI" : "Н/Д"))}
          </p>
          <p className="text-white/20 text-[10px] font-bold tracking-[0.15em] uppercase">
            КБЖВ: {localRecipe.nutrition?.protein || 0} / {localRecipe.nutrition?.carbs || 0} / {localRecipe.nutrition?.fat || 0}
          </p>
        </div>

        <div className="absolute bottom-6 right-6 w-11 h-11 bg-[#0a2326] border border-[#16f2d0]/30 rounded-full flex items-center justify-center text-[#16f2d0] shadow-lg shadow-[#16f2d0]/5">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </div>
      </div>
    </div>
  );
};
