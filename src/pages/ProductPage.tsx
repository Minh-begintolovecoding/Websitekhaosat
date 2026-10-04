import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExperiment } from '../context/ExperimentContext.tsx';
import { hoodieImg } from '../assets/images/index.ts';
import { ShoppingBag, AlertTriangle, Eye } from 'lucide-react';

export const ProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { groupType, recordProductEnter, recordProductExit, participantUuid } = useExperiment();
  const hasEnteredRef = useRef(false);

  useEffect(() => {
    if (!hasEnteredRef.current) {
      recordProductEnter();
      hasEnteredRef.current = true;
    }
  }, [recordProductEnter]);

  const handleBuyNow = () => {
    recordProductExit();
    navigate('/cart');
  };

  // Determine if Scarcity dark pattern is active for this condition
  const showScarcity = groupType === 'SCARCITY' || groupType === 'BOTH';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Product Image Section */}
          <div className="bg-slate-50 p-6 sm:p-10 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-200">
            <div className="relative aspect-square w-full max-w-sm rounded-xl overflow-hidden shadow-xs bg-slate-100">
              <img
                src={hoodieImg}
                alt="Premium Hoodie"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Stimulus Details */}
          <div className="p-6 sm:p-10 flex flex-col justify-between">
            <div>
              {/* Neutral Academic Product Header */}
              <div className="text-xs uppercase font-medium tracking-wider text-slate-400 mb-1">
                Thời trang Thu - Đông
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3">
                Premium Hoodie
              </h1>

              {/* Price */}
              <div className="mb-6">
                <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                  599.000 VND
                </span>
              </div>

              {/* EXPERIMENTAL MANIPULATION: SCARCITY */}
              {showScarcity && (
                <div className="mb-6 space-y-2 p-3.5 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>⚠ Chỉ còn 3 sản phẩm trong kho</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-amber-800">
                    <Eye className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>👁 53 người đang xem sản phẩm này</span>
                  </div>
                </div>
              )}

              {/* Product Description */}
              <div className="space-y-3 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-5">
                <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Mô tả sản phẩm
                </h2>
                <p>
                  Áo hoodie cao cấp chất liệu nỉ bông tự nhiên 100% cotton định lượng 380gsm.
                  Thiết kế form dáng regular-fit hiện đại, bề mặt vải êm ái, chống xù lông,
                  giữ nhiệt tối ưu và đảm bảo thông thoáng khi vận động.
                </p>
                <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside pt-1">
                  <li>Chất liệu: 100% Heavyweight Cotton (380gsm)</li>
                  <li>Form dáng: Regular-fit chuẩn dáng Châu Á</li>
                  <li>Đường may gia cố đôi chắc chắn, bo thun co giãn đàn hồi cao</li>
                  <li>Màu sắc: Đen than tinh tế (Charcoal Black)</li>
                </ul>
              </div>
            </div>

            {/* Buy Now Action */}
            <div className="pt-8 mt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={handleBuyNow}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-lg bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors shadow-xs cursor-pointer active:scale-98"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Mua ngay</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-[11px] text-slate-400">
          Hãy quan sát thông tin sản phẩm và đưa ra quyết định tương tác như khi bạn mua sắm thực tế.
        </p>
      </div>
    </div>
  );
};
