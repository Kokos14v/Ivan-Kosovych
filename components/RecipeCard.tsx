
import React, { useEffect, useState, useRef } from 'react';
import { Recipe } from '../types';
import { generateRecipeImage, estimateRecipeNutrition, isQuotaError, getQuotaStatus, enqueueRequest } from '../services/gemini';
import { saveImage, getImage, saveMeta, getMeta } from '../services/storage';

interface RecipeCardProps {
  recipe: Recipe;
  index: number;
  onClick: (recipe: Recipe) => void;
  onQuotaError?: () => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, index, onClick, onQuotaError }) => {
  const [localRecipe, setLocalRecipe] = useState(recipe);
  const [status, setStatus] = useState<'idle' | 'loading' | 'queuing' | 'ready' | 'error'>('idle');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [quotaHit, setQuotaHit] = useState(getQuotaStatus());
  const [isVisible, setIsVisible] = useState(false);
  const enrichmentStarted = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const enrich = async () => {
      if ((localRecipe.image && localRecipe.nutrition) || enrichmentStarted.current) {
        if (localRecipe.image && localRecipe.nutrition) setStatus('ready');
        return;
      }
      enrichmentStarted.current = true;

      try {
        let cachedMeta = await getMeta(recipe.id);
        let cachedImg = await getImage(recipe.id);

        if (cachedMeta && cachedImg) {
          setLocalRecipe(prev => ({ ...prev, nutrition: cachedMeta.nutrition, image: cachedImg }));
          setStatus('ready');
          return;
        }

        if (getQuotaStatus()) {
          setQuotaHit(true);
          setStatus('error');
          return;
        }

        setStatus('queuing');

        await enqueueRequest(async () => {
          setStatus('loading');
          
          let nutrition = cachedMeta?.nutrition;
          let image = cachedImg;

          if (!image) {
            try {
              image = await generateRecipeImage(recipe.title);
              if (image) await saveImage(recipe.id, image);
            } catch (err) {
              if (isQuotaError(err)) {
                setQuotaHit(true);
                onQuotaError?.();
                throw err;
              }
            }
          }

          if (!nutrition) {
            try {
              nutrition = await estimateRecipeNutrition(recipe.title, recipe.ingredients);
              await saveMeta(recipe.id, { nutrition });
            } catch (err) {
              if (isQuotaError(err)) {
                setQuotaHit(true);
                onQuotaError?.();
                throw err;
              }
            }
          }

          setLocalRecipe(prev => ({ 
            ...prev, 
            nutrition: nutrition || prev.nutrition, 
            image: image || prev.image 
          }));
          setStatus('ready');
        });

      } catch (err) {
        setStatus('error');
      }
    };
    enrich();
  }, [isVisible, recipe.id, recipe.title, recipe.ingredients, onQuotaError]);

  const handleCardClick = () => {
    if (status === 'ready') onClick(localRecipe);
  };

  return (
    <div 
      ref={cardRef}
      className={`reveal-item bg-[#0a2326] rounded-[32px] overflow-hidden mb-6 btn-tap shadow-xl border border-white/5 transition-all duration-500 hover:scale-[1.01] ${status !== 'ready' ? 'cursor-wait opacity-90' : 'cursor-pointer'}`}
      style={{ animationDelay: `${(index % 5) * 100}ms` }}
      onClick={handleCardClick}
    >
      <div className="relative h-52 overflow-hidden bg-white/[0.01]">
        {/* Main Image with Transition */}
        {localRecipe.image && (
          <img 
            src={localRecipe.image} 
            alt={localRecipe.title} 
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-opacity duration-1000 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`} 
          />
        )}

        {/* Loading Overlay */}
        {(status !== 'ready' || !imageLoaded) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#0a2326]/40 backdrop-blur-sm">
             {status === 'loading' ? (
               <div className="w-8 h-8 border-2 border-[#16f2d0]/20 border-t-[#16f2d0] rounded-full animate-spin mb-3"></div>
             ) : (
               <div className={`w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3 ${status === 'queuing' ? 'animate-pulse' : ''}`}>
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-20"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
               </div>
             )}
             <p className="text-[8px] text-white/40 uppercase font-black tracking-[0.2em]">
               {status === 'queuing' ? 'В черзі ШІ...' : status === 'loading' ? 'Створюємо фото...' : quotaHit ? 'Ліміт ШІ' : 'Підготовка...'}
             </p>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="px-3 py-1 bg-[#0a2326]/60 backdrop-blur-md text-[8px] font-black uppercase tracking-widest rounded-full text-white/70 border border-white/10">
            {localRecipe.category}
          </span>
        </div>
      </div>
      
      <div className="p-5 relative">
        <h3 className={`text-xl font-bold mb-2 text-white line-clamp-1 transition-all ${status === 'ready' ? 'opacity-100' : 'opacity-40'}`}>
          {localRecipe.title}
        </h3>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <p className={`text-[#16f2d0] text-sm font-black transition-all ${status === 'ready' ? 'scale-100' : 'scale-90 opacity-20'}`}>
              {status === 'ready' && localRecipe.nutrition?.kcal ? `${localRecipe.nutrition.kcal} Ккал` : '---'}
            </p>
            {status === 'queuing' && <div className="w-1 h-1 rounded-full bg-[#16f2d0] animate-ping" />}
          </div>
          <p className="text-white/10 text-[9px] font-bold tracking-wider uppercase">
            КБЖВ: {localRecipe.nutrition?.protein || 0} / {localRecipe.nutrition?.carbs || 0} / {localRecipe.nutrition?.fat || 0}
          </p>
        </div>
      </div>
    </div>
  );
};
