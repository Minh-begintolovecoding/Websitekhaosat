import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExperiment } from '../context/ExperimentContext.tsx';
import { ExperimentalGroup } from '../types/experiment.ts';
import { hoodieImg } from '../assets/images/index.ts';
import {
  FlaskConical,
  CheckCircle,
  AlertTriangle,
  Eye,
  Truck,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';

export const ResearcherSandbox: React.FC = () => {
  const navigate = useNavigate();
  const { initializeParticipant } = useExperiment();
  const [selectedGroup, setSelectedGroup] = useState<ExperimentalGroup>('CONTROL');
  const [isLaunching, setIsLaunching] = useState<boolean>(false);

  const handleLaunchExperience = async (group: ExperimentalGroup) => {
    setIsLaunching(true);
    await initializeParticipant(group);
    setIsLaunching(false);
    navigate('/product');
  };

  const conditions: {
    group: ExperimentalGroup;
    name: string;
    description: string;
    productStimulus: string;
    cartStimulus: string;
    imtTheoreticalExpectation: string;
  }[] = [
    {
      group: 'CONTROL',
      name: 'Nhóm 1: Đối chứng (Control Condition)',
      description: 'Giao diện thương mại điện tử chuẩn mực học thuật, trung tính, không chứa bất kỳ mẫu thiết kế tối nào.',
      productStimulus: 'Chỉ hiển thị Ảnh, Tên áo Hoodie, Giá 599.000 VND, Mô tả chuẩn và nút Mua ngay.',
      cartStimulus: 'Hiển thị áo Hoodie 599.000 VND, Vận chuyển tiêu chuẩn Miễn phí (0 VND). Tổng: 599.000 VND.',
      imtTheoreticalExpectation: 'Độ rõ ràng (CLA) và Chất lượng (QUAL) cao nhất. Cảm nhận thao túng (PCM) thấp nhất.',
    },
    {
      group: 'SCARCITY',
      name: 'Nhóm 2: Khan hiếm (Scarcity Dark Pattern)',
      description: 'Đưa ra cảnh báo giả định về số lượng hàng còn lại và số người đang theo dõi nhằm kích hoạt tâm lý lo sợ bỏ lỡ (FOMO).',
      productStimulus: 'Giao diện Control + Thêm: "⚠ Chỉ còn 3 sản phẩm trong kho" và "👁 53 người đang xem sản phẩm này".',
      cartStimulus: 'Vận chuyển tiêu chuẩn Miễn phí (0 VND). Tổng: 599.000 VND.',
      imtTheoreticalExpectation: 'Kích thích tính khẩn cấp giả mạo, vi phạm phương châm Chất lượng & Chân thực (QUAL/REL).',
    },
    {
      group: 'SNEAKING',
      name: 'Nhóm 3: Đưa lén (Sneaking / Hidden Fee Dark Pattern)',
      description: 'Tự động thêm dịch vụ phụ phí có thu phí vào giỏ hàng mà khách hàng không hề tích chọn hoặc chấp thuận từ trước.',
      productStimulus: 'Trang sản phẩm hoàn toàn giống hệt nhóm CONTROL (không có dark pattern ở bước này).',
      cartStimulus: 'Tự động chèn "Premium Shipping = 100.000 VND" vào giỏ hàng. Tổng tiền tăng lên 699.000 VND.',
      imtTheoreticalExpectation: 'Vi phạm nghiêm trọng phương châm Lượng thông tin (QUAN) và Độ minh bạch (CLA). Tăng vọt PCM.',
    },
    {
      group: 'BOTH',
      name: 'Nhóm 4: Kết hợp cả hai (Both: Scarcity + Sneaking)',
      description: 'Áp dụng đồng thời cả yếu tố Khan hiếm tại trang sản phẩm và yếu tố Đưa lén phụ phí tại trang giỏ hàng.',
      productStimulus: 'Hiển thị cảnh báo Khan hiếm ("Chỉ còn 3 sản phẩm", "53 người đang xem").',
      cartStimulus: 'Tự động chèn phí "Premium Shipping = 100.000 VND" vào đơn hàng.',
      imtTheoreticalExpectation: 'Mức độ vi phạm IMT cộng gộp tối đa. Cảm nhận thao túng (PCM) cao nhất, tổn hại nghiêm trọng đến Thái độ (ATT) và Lòng trung thành (LOY).',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200 mb-3">
          <FlaskConical className="w-3.5 h-3.5" />
          <span>Môi trường Nghiên cứu & Giảng dạy (Experiment Inspector)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Kiểm tra Các Điều kiện Thực nghiệm (4 Conditions)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Nghiên cứu viên có thể trực tiếp thử nghiệm từng kịch bản giao diện để kiểm tra thiết kế kích thích (stimulus validity).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {conditions.map((item) => (
          <div
            key={item.group}
            className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
              item.group === 'CONTROL'
                ? 'bg-white border-slate-200'
                : item.group === 'SCARCITY'
                ? 'bg-amber-50/30 border-amber-200'
                : item.group === 'SNEAKING'
                ? 'bg-indigo-50/30 border-indigo-200'
                : 'bg-purple-50/30 border-purple-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                  {item.group}
                </span>
                <span className="text-xs text-slate-400 font-semibold">N = 100 mục tiêu</span>
              </div>

              <h2 className="text-base font-bold text-slate-900 mb-2">{item.name}</h2>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">{item.description}</p>

              <div className="space-y-2 text-xs border-t border-slate-200/60 pt-3">
                <div>
                  <span className="font-semibold text-slate-900">Tại trang Sản phẩm:</span>{' '}
                  <span className="text-slate-600">{item.productStimulus}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Tại trang Giỏ hàng:</span>{' '}
                  <span className="text-slate-600">{item.cartStimulus}</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/60 mt-2">
                  <span className="font-semibold text-indigo-900 block mb-0.5">Kỳ vọng SEM:</span>
                  <span className="text-[11px] text-slate-600">{item.imtTheoreticalExpectation}</span>
                </div>
              </div>
            </div>

            <div className="pt-5 mt-4 border-t border-slate-200/60">
              <button
                type="button"
                onClick={() => handleLaunchExperience(item.group)}
                disabled={isLaunching}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <span>Trải nghiệm kịch bản này ({item.group})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
