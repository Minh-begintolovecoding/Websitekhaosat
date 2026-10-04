import React from 'react';

interface SemanticDifferentialScaleProps {
  id: string;
  leadQuestion: string;
  itemCode: string;
  leftAnchor: string;
  rightAnchor: string;
  leftAnchorSub?: string;
  rightAnchorSub?: string;
  value?: number;
  onChange: (val: number) => void;
  required?: boolean;
}

const POINTS = [1, 2, 3, 4, 5, 6, 7];

export const SemanticDifferentialScale: React.FC<SemanticDifferentialScaleProps> = ({
  id,
  leadQuestion,
  itemCode,
  leftAnchor,
  rightAnchor,
  leftAnchorSub,
  rightAnchorSub,
  value,
  onChange,
  required = true,
}) => {
  return (
    <div className="py-5 border-b border-slate-100 last:border-b-0">
      {/* Question Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            {itemCode}
          </span>
          <span className="text-xs font-medium text-slate-500">{leadQuestion}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </div>
        {value && (
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full shrink-0">
            {value} / 7
          </span>
        )}
      </div>

      {/* Semantic Differential Scale Layout */}
      <div className="bg-slate-50/70 rounded-xl p-3 sm:p-4 border border-slate-200/80">
        {/* Desktop Layout */}
        <div className="hidden md:grid grid-cols-12 gap-3 items-center">
          {/* Left Anchor */}
          <div className="col-span-3 text-right">
            <span
              className={`text-xs sm:text-sm font-bold block transition-colors ${
                value && value <= 3 ? 'text-amber-700 font-extrabold' : 'text-slate-800'
              }`}
            >
              {leftAnchor}
            </span>
            {leftAnchorSub && (
              <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                {leftAnchorSub}
              </span>
            )}
          </div>

          {/* 7-Point Buttons */}
          <div className="col-span-6 grid grid-cols-7 gap-1.5">
            {POINTS.map((pt) => {
              const isSelected = value === pt;
              return (
                <button
                  key={pt}
                  type="button"
                  onClick={() => onChange(pt)}
                  className={`h-11 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm scale-105 font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-100/80'
                  }`}
                >
                  <span className="text-sm font-semibold">{pt}</span>
                </button>
              );
            })}
          </div>

          {/* Right Anchor */}
          <div className="col-span-3 text-left">
            <span
              className={`text-xs sm:text-sm font-bold block transition-colors ${
                value && value >= 5 ? 'text-emerald-700 font-extrabold' : 'text-slate-800'
              }`}
            >
              {rightAnchor}
            </span>
            {rightAnchorSub && (
              <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                {rightAnchorSub}
              </span>
            )}
          </div>
        </div>

        {/* Mobile / Tablet Layout */}
        <div className="md:hidden space-y-2.5">
          <div className="flex items-start justify-between text-xs px-1">
            <div className="max-w-[45%] text-left">
              <span
                className={`font-bold block leading-snug ${
                  value && value <= 3 ? 'text-amber-700' : 'text-slate-800'
                }`}
              >
                {leftAnchor}
              </span>
              {leftAnchorSub && (
                <span className="text-[10px] text-slate-500 block leading-tight">{leftAnchorSub}</span>
              )}
            </div>

            <div className="max-w-[45%] text-right">
              <span
                className={`font-bold block leading-snug ${
                  value && value >= 5 ? 'text-emerald-700' : 'text-slate-800'
                }`}
              >
                {rightAnchor}
              </span>
              {rightAnchorSub && (
                <span className="text-[10px] text-slate-500 block leading-tight">{rightAnchorSub}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {POINTS.map((pt) => {
              const isSelected = value === pt;
              return (
                <button
                  key={pt}
                  type="button"
                  onClick={() => onChange(pt)}
                  className={`h-10 rounded-md font-bold text-sm border transition-colors ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pt}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-0.5">
            <span>1 = Cực trái</span>
            <span>4 = Trung gian</span>
            <span>7 = Cực phải</span>
          </div>
        </div>
      </div>
    </div>
  );
};
