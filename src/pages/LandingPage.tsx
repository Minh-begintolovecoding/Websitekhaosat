import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExperiment } from '../context/ExperimentContext.tsx';
import { ArrowRight, BookOpen, CheckCircle, ShieldCheck, HelpCircle } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { participantUuid, groupType, hasSubmitted, initializeParticipant, isLoading } = useExperiment();
  const [agreedToConsent, setAgreedToConsent] = useState<boolean>(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    // If participant hasn't been initialized yet, initialize them
    if (!participantUuid) {
      initializeParticipant().catch((e) => console.error(e));
    }
  }, [participantUuid]);

  const handleStart = async () => {
    if (!agreedToConsent) return;
    try {
      if (!participantUuid) {
        const session = await initializeParticipant();
        if (!session) {
          setInitError('Không thể khởi tạo phiên nghiên cứu. Vui lòng thử lại.');
          return;
        }
      }
      navigate('/product');
    } catch (err: any) {
      setInitError(err.message || 'Lỗi khởi động thí nghiệm');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
      {/* Research Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 mb-6">
        <BookOpen className="w-4 h-4 text-indigo-600" />
        <span>Nghiên cứu Thực nghiệm Học thuật (Replication Study)</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-3">
        Nghiên cứu về Trải nghiệm Người tiêu dùng trong Mua sắm Trực tuyến
      </h1>
      
      <p className="text-sm font-medium text-slate-500 mb-8">
        Dựa trên nền tảng Lý thuyết Thao túng Thông tin (Information Manipulation Theory - Witte et al., 2025)
      </p>

      {hasSubmitted && (
        <div className="mb-8 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Bạn đã hoàn tất cuộc khảo sát này!</div>
            <p className="text-amber-800 text-xs mt-1">
              Mỗi người tham gia chỉ được phản hồi một lần. Cảm ơn sự đóng góp quý báu của bạn cho nghiên cứu khoa học.
            </p>
            <button
              onClick={() => navigate('/thank-you')}
              className="mt-3 px-3 py-1.5 rounded bg-amber-600 text-white font-medium text-xs hover:bg-amber-700 cursor-pointer"
            >
              Xem trang hoàn tất & mã xác nhận
            </button>
          </div>
        </div>
      )}

      {/* Overview Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8 space-y-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900 mb-2">1. Mục đích nghiên cứu</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Dự án này nhằm nghiên cứu các yếu tố ảnh hưởng đến nhận thức, thái độ và ý định hành vi của người tiêu dùng khi tương tác với giao diện thương mại điện tử. Kết quả nghiên cứu được sử dụng độc quyền cho mục đích phân tích học thuật (SEM - Structural Equation Modeling).
          </p>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h2 className="text-base font-semibold text-slate-900 mb-2">2. Quy trình thực nghiệm</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
              <span className="font-bold text-slate-900 block mb-1">Bước 1:</span>
              Xem trang giới thiệu sản phẩm và đưa ra quyết định mua hàng.
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
              <span className="font-bold text-slate-900 block mb-1">Bước 2:</span>
              Xem giỏ hàng và kiểm tra các thông tin liên quan.
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
              <span className="font-bold text-slate-900 block mb-1">Bước 3:</span>
              Trả lời bảng câu hỏi khảo sát khoa học (khoảng 3-5 phút).
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
              <span className="font-bold text-slate-900 block mb-1">Bước 4:</span>
              Nhận mã xác nhận hoàn thành (Debriefing Code).
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h2 className="text-base font-semibold text-slate-900 mb-2">3. Quyền lợi và Bảo mật (IRB Statement)</h2>
          <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
            <li>Sự tham gia của bạn là hoàn toàn tự nguyện. Bạn có quyền dừng lại bất cứ lúc nào.</li>
            <li>Chúng tôi <strong>không</strong> thu thập bất kỳ thông tin nhận dạng cá nhân nào (tên, số điện thoại, tài khoản ngân hàng).</li>
            <li>Dữ liệu được mã hóa bằng UUID và phân tích ở mức độ gộp tổng thể.</li>
            <li>Bạn sẽ được phân bổ ngẫu nhiên có kiểm soát vào một kịch bản giao diện duy nhất.</li>
          </ul>
        </div>
      </div>

      {/* Informed Consent Agreement */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 mb-8">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedToConsent}
            onChange={(e) => setAgreedToConsent(e.target.checked)}
            className="mt-1 w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300"
          />
          <div className="text-xs text-slate-700 leading-relaxed">
            <span className="font-semibold text-slate-900 block">Cam kết đồng ý tham gia (Informed Consent):</span>
            Tôi xác nhận tôi từ 18 tuổi trở lên, đã đọc và hiểu các thông tin nghiên cứu nêu trên. Tôi tự nguyện đồng ý tham gia thực nghiệm và trả lời trung thực các câu hỏi khảo sát.
          </div>
        </label>
      </div>

      {initError && (
        <div className="mb-6 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {initError}
        </div>
      )}

      {/* Action CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Thời gian dự kiến: 4 - 6 phút</span>
        </div>

        <button
          onClick={handleStart}
          disabled={!agreedToConsent || isLoading || hasSubmitted}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all shadow-xs ${
            !agreedToConsent || isLoading || hasSubmitted
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-slate-900 text-white hover:bg-slate-800 cursor-pointer active:scale-98'
          }`}
        >
          <span>{isLoading ? 'Đang kết nối hệ thống...' : 'Bắt đầu Thí nghiệm'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
