import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExperiment } from '../context/ExperimentContext.tsx';
import { hoodieImg } from '../assets/images/index.ts';
import { ArrowRight, ShoppingCart, ShieldCheck, Truck } from 'lucide-react';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { groupType, recordCartEnter, recordCartExit, recordSurveyStart } = useExperiment();
  const hasEnteredRef = useRef(false);

  useEffect(() => {
    if (!hasEnteredRef.current) {
      recordCartEnter();
      hasEnteredRef.current = true;
    }
  }, [recordCartEnter]);

  // Determine if Sneaking dark pattern is active for this condition
  const showSneaking = groupType === 'SNEAKING' || groupType === 'BOTH';

  const productPrice = 599000;
  const premiumShippingFee = 100000;
  const totalPrice = showSneaking ? productPrice + premiumShippingFee : productPrice;

  const handleProceedToSurvey = () => {
    recordCartExit();
    recordSurveyStart();
    navigate('/survey');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="flex items-center gap-2 mb-6">
        <ShoppingCart className="w-5 h-5 text-slate-700" />
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Giỏ hàng của bạn
        </h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs mb-6">
        {/* Cart Item: Premium Hoodie */}
        <div className="p-4 sm:p-6 flex items-center gap-4 sm:gap-6 border-b border-slate-100">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-50 rounded-lg overflow-hidden shrink-0 border border-slate-200">
            <img
              src={hoodieImg}
              alt="Premium Hoodie"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-slate-900 truncate">
              Premium Hoodie
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Màu sắc: Đen than | Kích thước: L | Số lượng: 1
            </p>
            <div className="text-sm font-bold text-slate-900 mt-2">
              599.000 VND
            </div>
          </div>
        </div>

        {/* EXPERIMENTAL MANIPULATION: SNEAKING */}
        {showSneaking ? (
          <div className="p-4 sm:p-6 bg-amber-50/50 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  Premium Shipping
                </div>
                <div className="text-xs text-slate-500">
                  Dịch vụ giao hàng hỏa tốc bảo đảm & bảo hiểm kiện hàng
                </div>
              </div>
            </div>
            <div className="text-sm font-bold text-slate-900 shrink-0">
              100.000 VND
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-slate-100 text-slate-600 shrink-0 mt-0.5">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-700">
                  Vận chuyển tiêu chuẩn
                </div>
                <div className="text-xs text-slate-500">
                  Giao hàng dự kiến trong 2-3 ngày làm việc
                </div>
              </div>
            </div>
            <div className="text-sm font-semibold text-emerald-600 shrink-0">
              Miễn phí (0 VND)
            </div>
          </div>
        )}

        {/* Order Summary Calculations */}
        <div className="p-4 sm:p-6 bg-slate-50 space-y-2.5">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Tiền hàng:</span>
            <span>599.000 VND</span>
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>Phí vận chuyển:</span>
            <span>{showSneaking ? '100.000 VND' : '0 VND'}</span>
          </div>
          <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
            <span className="text-sm font-bold text-slate-900">Tổng thanh toán:</span>
            <span className="text-xl font-bold text-slate-900">
              {totalPrice.toLocaleString('vi-VN')} VND
            </span>
          </div>
        </div>
      </div>

      {/* Transition to Evaluation Survey */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-600 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Bạn đã hoàn thành bước trải nghiệm mua sắm. Tiếp theo, hãy trả lời bảng khảo sát khoa học về trải nghiệm vừa qua.
          </span>
        </div>

        <button
          type="button"
          onClick={handleProceedToSurvey}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors shadow-xs shrink-0 cursor-pointer active:scale-98"
        >
          <span>Tiến hành Khảo sát</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
