
import React, { useState, useRef } from 'react';
import { analyzeMealImage, getQuotaStatus } from '../services/gemini';
import { PhotoAnalysis } from '../types';

export const PhotoAnalyzer: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PhotoAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // PRE-CHECK QUOTA
    if (getQuotaStatus()) {
      setError('Ліміт запитів Gemini AI вичерпано. Спробуйте пізніше.');
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setImage(reader.result as string);
      setAnalyzing(true);
      setError(null);
      setResult(null);

      try {
        const data = await analyzeMealImage(base64);
        setResult(data);
      } catch (err: any) {
        if (err.message?.includes('429') || err.message?.includes('QUOTA')) {
          setError('Занадто багато запитів (Quota Exhausted). Спробуйте пізніше.');
        } else {
          setError('Не вдалося проаналізувати фото. Перевірте з’єднання.');
        }
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="px-6 pb-24">
      <div className="mb-8 pt-8">
        <h1 className="text-4xl font-black mb-2 tracking-tight">Фото-аналіз</h1>
        <p className="text-white/50">Наведіть камеру на страву, щоб отримати КБЖВ</p>
      </div>

      {!image ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="aspect-square glass rounded-[40px] border-dashed border-2 border-white/10 flex flex-col items-center justify-center cursor-pointer btn-tap group transition-all"
        >
          <div className="w-20 h-20 glass rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16f2d0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
          </div>
          <p className="text-lg font-bold">Натисніть для фото</p>
          <p className="text-sm text-white/30 mt-2">або виберіть з галереї</p>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative aspect-square rounded-[40px] overflow-hidden glass">
             <img src={image} alt="Meal" className="w-full h-full object-cover" />
             {analyzing && (
               <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8">
                 <div className="w-16 h-16 border-4 border-[#16f2d0]/30 border-t-[#16f2d0] rounded-full animate-spin mb-4"></div>
                 <p className="text-xl font-bold animate-breathing">Coconut аналізує страву...</p>
               </div>
             )}
          </div>

          {error && (
            <div className="glass border-red-500/30 p-8 rounded-3xl text-center shadow-lg shadow-red-500/5">
              <p className="text-red-400 font-medium mb-6 leading-relaxed">{error}</p>
              <button onClick={reset} className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition-colors">Спробувати ще раз</button>
            </div>
          )}

          {result && (
            <div className="reveal-item space-y-6">
              <div className="glass p-8 rounded-[40px] border-t-4 border-[#16f2d0]">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-3xl font-black">{result.dish_name}</h2>
                    <p className="text-white/40">{result.portion_guess}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full border-4 border-[#16f2d0] flex items-center justify-center mb-1">
                      <span className="text-xl font-black">{result.health_score_0_10}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-[#16f2d0]">Корисність</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="glass p-4 rounded-3xl">
                    <p className="text-2xl font-black">{result.calories_kcal}</p>
                    <p className="text-xs uppercase text-white/40 tracking-wider">Ккал</p>
                  </div>
                  <div className="glass p-4 rounded-3xl">
                    <p className="text-2xl font-black">{result.protein_g}г</p>
                    <p className="text-xs uppercase text-white/40 tracking-wider">Білки</p>
                  </div>
                  <div className="glass p-4 rounded-3xl">
                    <p className="text-2xl font-black">{result.carbs_g}г</p>
                    <p className="text-xs uppercase text-white/40 tracking-wider">Вуглеводи</p>
                  </div>
                  <div className="glass p-4 rounded-3xl">
                    <p className="text-2xl font-black">{result.fat_g}г</p>
                    <p className="text-xs uppercase text-white/40 tracking-wider">Жири</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-[#16f2d0] uppercase text-[10px] tracking-widest mb-2">Чому такий бал?</h4>
                    <p className="text-white/70 text-sm leading-relaxed">{result.why_short}</p>
                  </div>
                  <div className="p-4 bg-[#16f2d0]/5 rounded-2xl border border-[#16f2d0]/20">
                    <h4 className="font-bold text-[#16f2d0] uppercase text-[10px] tracking-widest mb-1">Порада від ШІ</h4>
                    <p className="text-white/80 text-sm italic">"{result.tips}"</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={reset}
                className="w-full py-5 glass rounded-[20px] font-bold text-white/50 active:scale-95 transition-all"
              >
                Скинути та нове фото
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
