import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExperiment } from '../context/ExperimentContext.tsx';
import { CheckCircle2, Copy, Check, BookOpen, RotateCcw, Shield } from 'lucide-react';

export const ThankYouPage: React.FC = () => {
  const navigate = useNavigate();
  const { participantUuid, groupType, resetLocalParticipant } = useExperiment();
  const [copied, setCopied] = useState<boolean>(false);

  const completionCode = participantUuid
    ? `IMT-2025-${participantUuid.slice(0, 8).toUpperCase()}`
    : 'IMT-2025-COMPLETED';

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(completionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNewTestSession = () => {
    resetLocalParticipant();
    navigate('/');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-16">
      {/* Success Badge */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mb-4 shadow-xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Cảm ơn bạn đã tham gia nghiên cứu!
        </h1>
        <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto">
          Phản hồi của bạn đã được ghi nhận an toàn vào cơ sở dữ liệu nghiên cứu khoa học.
        </p>
      </div>

      {/* Completion Code Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs mb-8">
        <div className="text-center">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Mã xác nhận hoàn thành (Completion Proof)
          </span>
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 font-mono text-base sm:text-lg font-bold text-slate-900 mt-2">
            <span>{completionCode}</span>
            <button
              onClick={handleCopy}
              className="p-1 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="Sao chép mã"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Lưu mã này nếu bạn tham gia nghiên cứu qua khảo sát lớp học hoặc nền tảng cấp điểm/thưởng.
          </p>
        </div>
      </div>

      {/* Academic Debriefing Statement (Tiết lộ mục đích thực nghiệm học thuật) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8 space-y-5">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-3">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <span>Bản công bố thông tin thực nghiệm (Academic Debriefing)</span>
        </div>

        <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
          <p>
            Theo chuẩn mực đạo đức nghiên cứu tâm lý học và hành vi người tiêu dùng, chúng tôi xin công bố đầy đủ thông tin thực nghiệm:
          </p>

          <p>
            <strong>Mục đích thực sự:</strong> Nghiên cứu này đo lường tác động của các <em>Mẫu thiết kế tối (Dark Patterns)</em> trong thương mại điện tử đối với nhận thức thao túng và ý định hành vi, dựa trên <strong>Lý thuyết Thao túng Thông tin (Information Manipulation Theory - IMT)</strong> do Witte và cộng sự (2025) đề xuất.
          </p>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-900 block mb-1">Kịch bản thử nghiệm:</span>
            Mỗi người tham gia được phân ngẫu nhiên có kiểm soát vào 1 trong 4 nhóm thực nghiệm (Between-Subjects Design):
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-700">
              <li><strong>Nhóm Đối chứng (Control):</strong> Giao diện sản phẩm chuẩn, không có bất kỳ mẫu thiết kế tối nào.</li>
              <li><strong>Nhóm Khan hiếm (Scarcity):</strong> Kích thích áp lực giả định (&quot;Chỉ còn 3 sản phẩm&quot;, &quot;53 người đang xem&quot;).</li>
              <li><strong>Nhóm Đưa lén (Sneaking):</strong> Tự động chèn phí &quot;Premium Shipping 100.000 VND&quot; vào giỏ hàng mà khách hàng không chủ động chọn.</li>
              <li><strong>Nhóm Kết hợp (Both):</strong> Xuất hiện đồng thời cả yếu tố Khan hiếm và Đưa lén.</li>
            </ul>
          </div>

          <p>
            <strong>Đảm bảo an toàn tài chính:</strong> Đây là mô phỏng học thuật phi thương mại. Bạn hoàn toàn không bị trừ bất kỳ khoản tiền nào, không có giao dịch tài chính thật sự nào diễn ra.
          </p>

          <p>
            <strong>Trích dẫn học thuật tham khảo:</strong>
            <br />
            <em className="text-slate-800">
              Witte, M., et al. (2025). Dark patterns in online retailing: an analysis based on information manipulation theory. Journal of Retailing and Consumer Services.
            </em>
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={handleNewTestSession}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Tạo phiên thử nghiệm mới (Test reset)</span>
        </button>

        <button
          onClick={() => navigate('/admin')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
        >
          <Shield className="w-4 h-4 text-indigo-400" />
          <span>Xem bảng điều khiển Dữ liệu & Admin</span>
        </button>
      </div>
    </div>
  );
};
