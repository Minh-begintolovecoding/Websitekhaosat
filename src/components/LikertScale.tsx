import React from 'react';

interface LikertScaleProps {
  id: string;
  question: string;
  itemCode: string;
  value?: number;
  onChange: (val: number) => void;
  required?: boolean;
}

const SCALE_POINTS = [
  { val: 1, shortLabel: '1', fullLabel: 'Hoàn toàn không đồng ý' },
  { val: 2, shortLabel: '2', fullLabel: 'Không đồng ý' },
  { val: 3, shortLabel: '3', fullLabel: 'Hơi không đồng ý' },
  { val: 4, shortLabel: '4', fullLabel: 'Trung lập' },
  { val: 5, shortLabel: '5', fullLabel: 'Hơi đồng ý' },
  { val: 6, shortLabel: '6', fullLabel: 'Đồng ý' },
  { val: 7, shortLabel: '7', fullLabel: 'Hoàn toàn đồng ý' },
];

export const LikertScale: React.FC<LikertScaleProps> = ({
  id,
  question,
  itemCode,
  value,
  onChange,
  required = true,
}) => {
  return (
    <div className="py-4 border-b border-slate-100 last:border-b-0">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            {itemCode}
          </span>
          <p className="text-sm font-medium text-slate-900 leading-snug">
            {question}
            {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
          </p>
        </div>
        {value && (
          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full shrink-0">
            {value} / 7
          </span>
        )}
      </div>

      {/* Desktop/Tablet 7-point horizontal scale */}
      <div className="hidden sm:grid grid-cols-7 gap-2">
        {SCALE_POINTS.map((pt) => {
          const isSelected = value === pt.val;
          return (
            <button
              key={pt.val}
              type="button"
              onClick={() => onChange(pt.val)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs scale-102 font-semibold'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className={`text-base font-bold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                {pt.shortLabel}
              </span>
              <span
                className={`text-[10px] mt-1 line-clamp-2 leading-tight ${
                  isSelected ? 'text-slate-200' : 'text-slate-500'
                }`}
              >
                {pt.fullLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile Stacked / Segmented Buttons */}
      <div className="sm:hidden space-y-1.5">
        <div className="grid grid-cols-7 gap-1">
          {SCALE_POINTS.map((pt) => {
            const isSelected = value === pt.val;
            return (
              <button
                key={pt.val}
                type="button"
                onClick={() => onChange(pt.val)}
                className={`h-11 flex items-center justify-center rounded-md font-bold text-sm border transition-colors ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {pt.val}
              </button>
            );
          })}
        </div>
        <div className="flex justify-between text-[11px] text-slate-500 px-1 pt-1">
          <span>1: Hoàn toàn không đồng ý</span>
          <span>7: Hoàn toàn đồng ý</span>
        </div>
      </div>
    </div>
  );
};
