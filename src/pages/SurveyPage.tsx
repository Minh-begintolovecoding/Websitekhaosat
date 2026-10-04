import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExperiment } from '../context/ExperimentContext.tsx';
import { LikertScale } from '../components/LikertScale.tsx';
import { SemanticDifferentialScale } from '../components/SemanticDifferentialScale.tsx';
import {
  ArrowLeft,
  ArrowRight,
  Send,
  AlertCircle,
  Clock,
  Save,
  CheckCircle2,
} from 'lucide-react';

export const SurveyPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    surveyAnswers,
    setAnswer,
    submitSurveyAnswers,
    hasSubmitted,
    timings,
    recordSurveyStart,
    groupType,
  } = useExperiment();

  const isControl = groupType === 'CONTROL';
  const isScarcity = groupType === 'SCARCITY';
  const isSneaking = groupType === 'SNEAKING';
  const isBoth = groupType === 'BOTH';

  // CONTROL group does not encounter dark pattern cues, omitting manipulation check (Section 7)
  const TOTAL_SECTIONS = isControl ? 6 : 7;

  const [currentSection, setCurrentSection] = useState<number>(1);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [savedBadge, setSavedBadge] = useState<boolean>(false);

  useEffect(() => {
    if (!timings.startedSurveyAt) {
      recordSurveyStart();
    }
  }, []);

  // Prevent accidental tab closure / refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasSubmitted) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasSubmitted]);

  // Flash auto-saved indicator on answers update
  useEffect(() => {
    setSavedBadge(true);
    const timer = setTimeout(() => setSavedBadge(false), 1200);
    return () => clearTimeout(timer);
  }, [surveyAnswers]);

  if (hasSubmitted) {
    navigate('/thank-you');
    return null;
  }

  // Validation per section
  const validateCurrentSection = (): boolean => {
    setValidationError(null);

    // Section 1: Demographics
    if (currentSection === 1) {
      if (!surveyAnswers.gender) {
        setValidationError('Vui lòng chọn giới tính của bạn.');
        return false;
      }
      if (!surveyAnswers.ageGroup) {
        setValidationError('Vui lòng chọn nhóm tuổi của bạn.');
        return false;
      }
      if (!surveyAnswers.education) {
        setValidationError('Vui lòng chọn trình độ học vấn của bạn.');
        return false;
      }
      if (!surveyAnswers.occupation) {
        setValidationError('Vui lòng chọn nghề nghiệp của bạn.');
        return false;
      }
      if (!surveyAnswers.onlineShoppingFreq) {
        setValidationError('Vui lòng chọn tần suất mua sắm trực tuyến.');
        return false;
      }
    }

    // Section 2: IMT Dimensions (QUAL, QUAN, REL, CLA)
    else if (currentSection === 2) {
      if (!surveyAnswers.qual1 || !surveyAnswers.qual2 || !surveyAnswers.qual3 || !surveyAnswers.qual4) {
        setValidationError('Vui lòng hoàn thành đủ 4 câu đánh giá Chất lượng thông tin (QUAL1 - QUAL4).');
        return false;
      }
      if (!surveyAnswers.quan1 || !surveyAnswers.quan2 || !surveyAnswers.quan3 || !surveyAnswers.quan4) {
        setValidationError('Vui lòng hoàn thành đủ 4 câu đánh giá Lượng thông tin (QUAN1 - QUAN4).');
        return false;
      }
      if (!surveyAnswers.rel1 || !surveyAnswers.rel2 || !surveyAnswers.rel3) {
        setValidationError('Vui lòng hoàn thành đủ 3 câu đánh giá Mức độ liên quan (REL1 - REL3).');
        return false;
      }
      if (!surveyAnswers.cla1 || !surveyAnswers.cla2 || !surveyAnswers.cla3 || !surveyAnswers.cla4) {
        setValidationError('Vui lòng hoàn thành đủ 4 câu đánh giá Độ rõ ràng (CLA1 - CLA4).');
        return false;
      }
    }

    // Section 3: PCM
    else if (currentSection === 3) {
      if (
        !surveyAnswers.pcm1 ||
        !surveyAnswers.pcm2 ||
        !surveyAnswers.pcm3 ||
        !surveyAnswers.pcm4 ||
        !surveyAnswers.pcm5 ||
        !surveyAnswers.pcm6
      ) {
        setValidationError('Vui lòng trả lời đủ 6 câu hỏi về Cảm nhận thao túng (PCM1 - PCM6).');
        return false;
      }
    }

    // Section 4: Attitude Toward Website
    else if (currentSection === 4) {
      if (!surveyAnswers.att1 || !surveyAnswers.att2 || !surveyAnswers.att3 || !surveyAnswers.att4) {
        setValidationError('Vui lòng hoàn thành đủ 4 câu đánh giá Thái độ đối với website (ATT1 - ATT4).');
        return false;
      }
    }

    // Section 5: Purchase Intention & Loyalty
    else if (currentSection === 5) {
      if (!surveyAnswers.pi1 || !surveyAnswers.pi2 || !surveyAnswers.pi3) {
        setValidationError('Vui lòng trả lời đủ 3 câu hỏi về Ý định mua hàng (PI1 - PI3).');
        return false;
      }
      if (!surveyAnswers.loy1 || !surveyAnswers.loy2 || !surveyAnswers.loy3) {
        setValidationError('Vui lòng trả lời đủ 3 câu hỏi về Ý định gắn bó & lòng trung thành (LOY1 - LOY3).');
        return false;
      }
    }

    // Section 6: Familiarity
    else if (currentSection === 6) {
      if (!surveyAnswers.fam1 || !surveyAnswers.fam2 || !surveyAnswers.fam3 || !surveyAnswers.fam4) {
        setValidationError('Vui lòng trả lời đủ 4 câu hỏi về Thói quen & kinh nghiệm mua sắm (FAM1 - FAM4).');
        return false;
      }
    }

    // Section 7: Manipulation Checks (Condition-specific)
    else if (currentSection === 7 && !isControl) {
      if (isScarcity || isBoth) {
        if (!surveyAnswers.sc1) {
          setValidationError('Vui lòng trả lời câu hỏi kiểm tra về thông báo số lượng sản phẩm (SC1).');
          return false;
        }
        if (!surveyAnswers.sc2) {
          setValidationError('Vui lòng trả lời câu hỏi kiểm tra về số lượng người đang xem (SC2).');
          return false;
        }
      }
      if (isSneaking || isBoth) {
        if (!surveyAnswers.sn1) {
          setValidationError('Vui lòng trả lời câu hỏi kiểm tra về chi phí trong giỏ hàng (SN1).');
          return false;
        }
      }
    }

    return true;
  };

  const handleNext = () => {
    if (!validateCurrentSection()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setCurrentSection((prev) => Math.min(TOTAL_SECTIONS, prev + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrev = () => {
    setValidationError(null);
    setCurrentSection((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!validateCurrentSection()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    const res = await submitSurveyAnswers();
    setIsSubmitting(false);

    if (res.success) {
      navigate('/thank-you');
    } else {
      setValidationError(res.error || 'Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
    }
  };

  // Section meta information
  const sectionMeta: Record<number, { title: string; subtitle: string; code: string }> = {
    1: {
      title: 'Thông tin Chung & Nhân khẩu học (Demographics)',
      subtitle: 'Một số thông tin cơ bản về bạn phục vụ cho việc thống kê mô tả mẫu nghiên cứu.',
      code: 'DEMO',
    },
    2: {
      title: 'Đánh giá Thông tin Website (Information Manipulation Theory)',
      subtitle:
        'Thang đo Semantic Differential (1 đến 7) đối nghịch: Hãy đánh giá mức độ thông tin trên website bạn vừa trải nghiệm.',
      code: 'QUAL • QUAN • REL • CLA',
    },
    3: {
      title: 'Nhận thức về Sự Thao túng (Perceived Customer Manipulation)',
      subtitle:
        'Thang đo 7 mức độ: Đánh giá cảm nhận của bạn về cách website tương tác và định hướng quyết định mua sắm.',
      code: 'PCM',
    },
    4: {
      title: 'Thái độ đối với Website (Attitude toward Website)',
      subtitle:
        'Thang đo Semantic Differential (1 đến 7): Cảm nhận và ấn tượng tổng quan của bạn sau khi trải nghiệm website.',
      code: 'ATT',
    },
    5: {
      title: 'Ý định Mua hàng & Gắn bó (Purchase Intention & Loyalty)',
      subtitle:
        'Thang đo 7 mức độ: Đánh giá khả năng bạn cân nhắc mua sản phẩm và khả năng quay lại hoặc giới thiệu website.',
      code: 'PI & LOY',
    },
    6: {
      title: 'Kinh nghiệm Mua sắm Trực tuyến (Familiarity)',
      subtitle:
        'Thang đo 7 mức độ: Đánh giá mức độ am hiểu và thói quen mua sắm trực tuyến thường ngày của bạn.',
      code: 'FAM',
    },
    7: {
      title: 'Kiểm tra Ghi nhớ Giao diện (Manipulation Checks)',
      subtitle:
        'Vui lòng nhớ lại các chi tiết bạn đã quan sát được trên website và trang giỏ hàng để chọn đáp án phù hợp.',
      code: 'MANIPULATION CHECK',
    },
  };

  const meta = sectionMeta[currentSection];
  const progressPercent = Math.round((currentSection / TOTAL_SECTIONS) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Top Progress & Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span className="font-semibold text-slate-800">
            Phần {currentSection} / {TOTAL_SECTIONS}
          </span>
          <div className="flex items-center gap-3">
            {savedBadge && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded transition-opacity">
                <Save className="w-3 h-3" />
                Đã lưu tự động
              </span>
            )}
            <span className="font-mono text-slate-600">{progressPercent}%</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-slate-900 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Validation banner */}
      {validationError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span className="leading-relaxed font-medium">{validationError}</span>
        </div>
      )}

      {/* Construct Title Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-6">
        <div className="inline-block text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 mb-2">
          {meta.code}
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2">
          {meta.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
          {meta.subtitle}
        </p>

        {/* --- SECTION 1: DEMOGRAPHICS --- */}
        {currentSection === 1 && (
          <div className="space-y-6 pt-2">
            {/* Giới tính */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
              <label className="block text-xs font-bold text-slate-900 mb-2">
                1. Giới tính của bạn: <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {['Nam', 'Nữ', 'Khác'].map((g) => {
                  const isSelected = surveyAnswers.gender === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setAnswer('gender', g)}
                      className={`py-3 px-4 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300'
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Độ tuổi */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
              <label className="block text-xs font-bold text-slate-900 mb-2">
                2. Nhóm tuổi của bạn: <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {['18-22', '23-30', '31-40', '41+'].map((age) => {
                  const isSelected = surveyAnswers.ageGroup === age;
                  return (
                    <button
                      key={age}
                      type="button"
                      onClick={() => setAnswer('ageGroup', age)}
                      className={`py-3 px-4 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300'
                      }`}
                    >
                      {age} tuổi
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trình độ học vấn (EDU1) */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
              <label className="block text-xs font-bold text-slate-900 mb-2">
                3. Trình độ học vấn của bạn: <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {['Cao đẳng', 'Đại học', 'Sau đại học', 'Khác'].map((edu) => {
                  const isSelected = surveyAnswers.education === edu;
                  return (
                    <button
                      key={edu}
                      type="button"
                      onClick={() => setAnswer('education', edu)}
                      className={`py-3 px-4 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300'
                      }`}
                    >
                      {edu}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nghề nghiệp (OCC1) */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
              <label className="block text-xs font-bold text-slate-900 mb-2">
                4. Nghề nghiệp của bạn: <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {['Sinh viên', 'Nhân viên văn phòng', 'Kinh doanh', 'Khác'].map((occ) => {
                  const isSelected = surveyAnswers.occupation === occ;
                  return (
                    <button
                      key={occ}
                      type="button"
                      onClick={() => setAnswer('occupation', occ)}
                      className={`py-3 px-4 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300'
                      }`}
                    >
                      {occ}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tần suất mua online */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
              <label className="block text-xs font-bold text-slate-900 mb-2">
                5. Tần suất mua sắm trực tuyến của bạn: <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  'Dưới 1 lần/tháng',
                  '1-3 lần/tháng',
                  '4-10 lần/tháng',
                  'Trên 10 lần/tháng',
                ].map((freq) => {
                  const isSelected = surveyAnswers.onlineShoppingFreq === freq;
                  return (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setAnswer('onlineShoppingFreq', freq)}
                      className={`py-3 px-4 rounded-lg border text-xs font-semibold text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300'
                      }`}
                    >
                      <span>{freq}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* --- SECTION 2: IMT SEMANTIC DIFFERENTIAL DIMENSIONS --- */}
        {currentSection === 2 && (
          <div className="space-y-8 pt-2">
            {/* 1. Quality */}
            <div>
              <div className="pb-2 border-b border-slate-200 mb-3">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  1. Chất lượng Thông tin (Information Quality)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Đánh giá mức độ tin cậy và phản ánh thực tế của thông tin trên website:
                </p>
              </div>

              <SemanticDifferentialScale
                id="qual1"
                itemCode="QUAL1"
                leadQuestion="Thông tin trên website là:"
                leftAnchor="False"
                leftAnchorSub="Sai sự thật"
                rightAnchor="True"
                rightAnchorSub="Đúng sự thật"
                value={surveyAnswers.qual1}
                onChange={(val) => setAnswer('qual1', val)}
              />
              <SemanticDifferentialScale
                id="qual2"
                itemCode="QUAL2"
                leadQuestion="Thông tin trên website là:"
                leftAnchor="Distorted"
                leftAnchorSub="Bị bóp méo"
                rightAnchor="Accurate"
                rightAnchorSub="Chính xác"
                value={surveyAnswers.qual2}
                onChange={(val) => setAnswer('qual2', val)}
              />
              <SemanticDifferentialScale
                id="qual3"
                itemCode="QUAL3"
                leadQuestion="Thông tin trên website là:"
                leftAnchor="Fabricated"
                leftAnchorSub="Bịa đặt / Tự tạo"
                rightAnchor="Genuine"
                rightAnchorSub="Xác thực / Có thật"
                value={surveyAnswers.qual3}
                onChange={(val) => setAnswer('qual3', val)}
              />
              <SemanticDifferentialScale
                id="qual4"
                itemCode="QUAL4"
                leadQuestion="Thông tin trên website là:"
                leftAnchor="Altered"
                leftAnchorSub="Bị biến đổi"
                rightAnchor="Authentic"
                rightAnchorSub="Nguyên bản / Chân thực"
                value={surveyAnswers.qual4}
                onChange={(val) => setAnswer('qual4', val)}
              />
            </div>

            {/* 2. Quantity */}
            <div>
              <div className="pb-2 border-b border-slate-200 mb-3">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  2. Lượng Thông tin (Information Quantity)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Đánh giá tính đầy đủ và minh bạch về khối lượng thông tin được hiển thị:
                </p>
              </div>

              <SemanticDifferentialScale
                id="quan1"
                itemCode="QUAN1"
                leadQuestion="Thông tin trên website:"
                leftAnchor="Uninformative"
                leftAnchorSub="Ít thông tin"
                rightAnchor="Informative"
                rightAnchorSub="Nhiều thông tin"
                value={surveyAnswers.quan1}
                onChange={(val) => setAnswer('quan1', val)}
              />
              <SemanticDifferentialScale
                id="quan2"
                itemCode="QUAN2"
                leadQuestion="Thông tin trên website:"
                leftAnchor="Incomplete"
                leftAnchorSub="Chưa hoàn chỉnh"
                rightAnchor="Complete"
                rightAnchorSub="Hoàn chỉnh / Đầy đủ"
                value={surveyAnswers.quan2}
                onChange={(val) => setAnswer('quan2', val)}
              />
              <SemanticDifferentialScale
                id="quan3"
                itemCode="QUAN3"
                leadQuestion="Thông tin trên website:"
                leftAnchor="Concealing"
                leftAnchorSub="Che giấu"
                rightAnchor="Revealing"
                rightAnchorSub="Bộc lộ / Cởi mở"
                value={surveyAnswers.quan3}
                onChange={(val) => setAnswer('quan3', val)}
              />
              <SemanticDifferentialScale
                id="quan4"
                itemCode="QUAN4"
                leadQuestion="Thông tin trên website:"
                leftAnchor="Non-disclosive"
                leftAnchorSub="Kín kẽ / Không tiết lộ"
                rightAnchor="Disclosive"
                rightAnchorSub="Công khai đầy đủ"
                value={surveyAnswers.quan4}
                onChange={(val) => setAnswer('quan4', val)}
              />
            </div>

            {/* 3. Relevance */}
            <div>
              <div className="pb-2 border-b border-slate-200 mb-3">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  3. Mức độ Liên quan (Information Relevance)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Đánh giá sự phù hợp và hữu ích của thông tin đối với việc xem xét sản phẩm:
                </p>
              </div>

              <SemanticDifferentialScale
                id="rel1"
                itemCode="REL1"
                leadQuestion="Thông tin trên website:"
                leftAnchor="Irrelevant"
                leftAnchorSub="Không liên quan"
                rightAnchor="Relevant"
                rightAnchorSub="Liên quan"
                value={surveyAnswers.rel1}
                onChange={(val) => setAnswer('rel1', val)}
              />
              <SemanticDifferentialScale
                id="rel2"
                itemCode="REL2"
                leadQuestion="Thông tin trên website:"
                leftAnchor="Inapplicable"
                leftAnchorSub="Không áp dụng được"
                rightAnchor="Applicable"
                rightAnchorSub="Có thể áp dụng"
                value={surveyAnswers.rel2}
                onChange={(val) => setAnswer('rel2', val)}
              />
              <SemanticDifferentialScale
                id="rel3"
                itemCode="REL3"
                leadQuestion="Thông tin trên website:"
                leftAnchor="Impertinent"
                leftAnchorSub="Không thích đáng"
                rightAnchor="Pertinent"
                rightAnchorSub="Thích đáng / Đúng chỗ"
                value={surveyAnswers.rel3}
                onChange={(val) => setAnswer('rel3', val)}
              />
            </div>

            {/* 4. Clarity */}
            <div>
              <div className="pb-2 border-b border-slate-200 mb-3">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  4. Độ Rõ ràng (Information Clarity)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Đánh giá cách thức trình bày có sáng sủa, dễ hiểu hay gây nhầm lẫn:
                </p>
              </div>

              <SemanticDifferentialScale
                id="cla1"
                itemCode="CLA1"
                leadQuestion="Thông tin trên website:"
                leftAnchor="Ambiguous"
                leftAnchorSub="Mơ hồ / Nước đôi"
                rightAnchor="Clear"
                rightAnchorSub="Rõ ràng"
                value={surveyAnswers.cla1}
                onChange={(val) => setAnswer('cla1', val)}
              />
              <SemanticDifferentialScale
                id="cla2"
                itemCode="CLA2"
                leadQuestion="Thông tin trên website:"
                leftAnchor="Obscure"
                leftAnchorSub="Tối nghĩa / Khó hiểu"
                rightAnchor="Straightforward"
                rightAnchorSub="Dễ hiểu / Thẳng thắn"
                value={surveyAnswers.cla2}
                onChange={(val) => setAnswer('cla2', val)}
              />
              <SemanticDifferentialScale
                id="cla3"
                itemCode="CLA3"
                leadQuestion="Thông tin trên website:"
                leftAnchor="Vague"
                leftAnchorSub="Mông lung / Mập mờ"
                rightAnchor="Precise"
                rightAnchorSub="Chuẩn xác / Chặt chẽ"
                value={surveyAnswers.cla3}
                onChange={(val) => setAnswer('cla3', val)}
              />
              <SemanticDifferentialScale
                id="cla4"
                itemCode="CLA4"
                leadQuestion="Thông tin trên website:"
                leftAnchor="Indefinite"
                leftAnchorSub="Không dứt khoát"
                rightAnchor="Definite"
                rightAnchorSub="Dứt khoát / Rõ rệt"
                value={surveyAnswers.cla4}
                onChange={(val) => setAnswer('cla4', val)}
              />
            </div>
          </div>
        )}

        {/* --- SECTION 3: PERCEIVED CUSTOMER MANIPULATION (PCM1 - PCM6) --- */}
        {currentSection === 3 && (
          <div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between mb-4">
              <span>Thang đo mức độ đồng ý:</span>
              <span className="font-semibold text-slate-800">
                1 = Hoàn toàn không đồng ý ⟶ 7 = Hoàn toàn đồng ý
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              <LikertScale
                id="pcm1"
                itemCode="PCM1"
                question="Website đang cố tác động đến quyết định mua hàng của tôi."
                value={surveyAnswers.pcm1}
                onChange={(val) => setAnswer('pcm1', val)}
              />
              <LikertScale
                id="pcm2"
                itemCode="PCM2"
                question="Tôi cảm thấy website đang hạn chế khả năng tự do lựa chọn của mình."
                value={surveyAnswers.pcm2}
                onChange={(val) => setAnswer('pcm2', val)}
              />
              <LikertScale
                id="pcm3"
                itemCode="PCM3"
                question="Tôi cảm thấy quyền tự chủ trong quyết định mua hàng của mình bị giảm."
                value={surveyAnswers.pcm3}
                onChange={(val) => setAnswer('pcm3', val)}
              />
              <LikertScale
                id="pcm4"
                itemCode="PCM4"
                question="Tôi cảm thấy website đang thao túng hành vi mua sắm của tôi."
                value={surveyAnswers.pcm4}
                onChange={(val) => setAnswer('pcm4', val)}
              />
              <LikertScale
                id="pcm5"
                itemCode="PCM5"
                question="Website ưu tiên lợi ích của mình hơn lợi ích của khách hàng."
                value={surveyAnswers.pcm5}
                onChange={(val) => setAnswer('pcm5', val)}
              />
              <LikertScale
                id="pcm6"
                itemCode="PCM6"
                question="Tôi cảm thấy mình bị lừa hoặc bị đánh lạc hướng trong quá trình mua hàng."
                value={surveyAnswers.pcm6}
                onChange={(val) => setAnswer('pcm6', val)}
              />
            </div>
          </div>
        )}

        {/* --- SECTION 4: ATTITUDE TOWARD WEBSITE (ATT1 - ATT4) --- */}
        {currentSection === 4 && (
          <div className="space-y-6 pt-2">
            <div className="pb-2 border-b border-slate-200 mb-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Thái độ & Cảm xúc Tổng thể (Attitude Toward Website)
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Vui lòng chọn mức điểm từ 1 đến 7 phù hợp nhất với cảm nhận của bạn:
              </p>
            </div>

            <SemanticDifferentialScale
              id="att1"
              itemCode="ATT1"
              leadQuestion="Ấn tượng tổng quan:"
              leftAnchor="Negative"
              leftAnchorSub="Tiêu cực"
              rightAnchor="Positive"
              rightAnchorSub="Tích cực"
              value={surveyAnswers.att1}
              onChange={(val) => setAnswer('att1', val)}
            />
            <SemanticDifferentialScale
              id="att2"
              itemCode="ATT2"
              leadQuestion="Đánh giá chất lượng:"
              leftAnchor="Bad"
              leftAnchorSub="Tệ"
              rightAnchor="Good"
              rightAnchorSub="Tốt"
              value={surveyAnswers.att2}
              onChange={(val) => setAnswer('att2', val)}
            />
            <SemanticDifferentialScale
              id="att3"
              itemCode="ATT3"
              leadQuestion="Cảm xúc ưa thích:"
              leftAnchor="Dislike"
              leftAnchorSub="Không thích"
              rightAnchor="Like"
              rightAnchorSub="Thích"
              value={surveyAnswers.att3}
              onChange={(val) => setAnswer('att3', val)}
            />
            <SemanticDifferentialScale
              id="att4"
              itemCode="ATT4"
              leadQuestion="Thái độ thiện chí:"
              leftAnchor="Unfavorable"
              leftAnchorSub="Không thuận lợi"
              rightAnchor="Favorable"
              rightAnchorSub="Thuận lợi"
              value={surveyAnswers.att4}
              onChange={(val) => setAnswer('att4', val)}
            />
          </div>
        )}

        {/* --- SECTION 5: PURCHASE INTENTION & LOYALTY --- */}
        {currentSection === 5 && (
          <div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between mb-4">
              <span>Thang đo mức độ đồng ý:</span>
              <span className="font-semibold text-slate-800">
                1 = Hoàn toàn không đồng ý ⟶ 7 = Hoàn toàn đồng ý
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              <div className="pt-2 pb-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Ý định Mua hàng (Purchase Intention)
                </span>
              </div>
              <LikertScale
                id="pi1"
                itemCode="PI1"
                question="I would consider buying this product (Tôi sẽ cân nhắc mua sản phẩm này)."
                value={surveyAnswers.pi1}
                onChange={(val) => setAnswer('pi1', val)}
              />
              <LikertScale
                id="pi2"
                itemCode="PI2"
                question="I intend to buy this product (Tôi có ý định mua sản phẩm này)."
                value={surveyAnswers.pi2}
                onChange={(val) => setAnswer('pi2', val)}
              />
              <LikertScale
                id="pi3"
                itemCode="PI3"
                question="The likelihood of purchasing this product is high (Khả năng tôi mua sản phẩm này là cao)."
                value={surveyAnswers.pi3}
                onChange={(val) => setAnswer('pi3', val)}
              />

              <div className="pt-6 pb-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Ý định Gắn bó & Giới thiệu (Loyalty Intention)
                </span>
              </div>
              <LikertScale
                id="loy1"
                itemCode="LOY1"
                question="I would revisit this website (Nếu cần mua sản phẩm tương tự, tôi có khả năng quay lại website này)."
                value={surveyAnswers.loy1}
                onChange={(val) => setAnswer('loy1', val)}
              />
              <LikertScale
                id="loy2"
                itemCode="LOY2"
                question="I would purchase from this website again (Tôi sẽ cân nhắc mua hàng từ website này trong các lần tiếp theo)."
                value={surveyAnswers.loy2}
                onChange={(val) => setAnswer('loy2', val)}
              />
              <LikertScale
                id="loy3"
                itemCode="LOY3"
                question="I would recommend this website to others (Tôi có thể giới thiệu website này cho người khác)."
                value={surveyAnswers.loy3}
                onChange={(val) => setAnswer('loy3', val)}
              />
            </div>
          </div>
        )}

        {/* --- SECTION 6: ONLINE SHOPPING FAMILIARITY --- */}
        {currentSection === 6 && (
          <div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between mb-4">
              <span>Thang đo mức độ đồng ý:</span>
              <span className="font-semibold text-slate-800">
                1 = Hoàn toàn không đồng ý ⟶ 7 = Hoàn toàn đồng ý
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              <LikertScale
                id="fam1"
                itemCode="FAM1"
                question="I frequently shop online (Tôi thường xuyên mua sắm trực tuyến)."
                value={surveyAnswers.fam1}
                onChange={(val) => setAnswer('fam1', val)}
              />
              <LikertScale
                id="fam2"
                itemCode="FAM2"
                question="I have extensive experience with online shopping (Tôi là một người mua sắm trực tuyến có nhiều kinh nghiệm)."
                value={surveyAnswers.fam2}
                onChange={(val) => setAnswer('fam2', val)}
              />
              <LikertScale
                id="fam3"
                itemCode="FAM3"
                question="I am familiar with online shopping websites (Tôi rất quen thuộc với các website thương mại điện tử)."
                value={surveyAnswers.fam3}
                onChange={(val) => setAnswer('fam3', val)}
              />
              <LikertScale
                id="fam4"
                itemCode="FAM4"
                question="I understand how online shopping websites work (Tôi hiểu rõ cách thức hoạt động của các website bán hàng trực tuyến)."
                value={surveyAnswers.fam4}
                onChange={(val) => setAnswer('fam4', val)}
              />
            </div>
          </div>
        )}

        {/* --- SECTION 7: MANIPULATION CHECK (CONDITION-SPECIFIC) --- */}
        {currentSection === 7 && !isControl && (
          <div className="space-y-6 pt-2">
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-900 leading-relaxed">
              <span className="font-bold block mb-1">Kiểm tra ghi nhớ nội dung giao diện (Manipulation Check):</span>
              Vui lòng nhớ lại các chi tiết bạn đã quan sát được trên website và trang giỏ hàng để chọn đáp án tương ứng:
            </div>

            {/* SCARCITY or BOTH: Show SC1 and SC2 */}
            {(isScarcity || isBoth) && (
              <>
                {/* SC1: Số lượng sản phẩm còn lại */}
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                      SC1
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      Theo bạn website thông báo còn bao nhiêu sản phẩm? <span className="text-rose-500">*</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {['1 sản phẩm', '3 sản phẩm', '10 sản phẩm', 'Không nhớ'].map((opt) => {
                      const isSelected = surveyAnswers.sc1 === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setAnswer('sc1', opt)}
                          className={`py-3 px-4 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SC2: Số người đang xem */}
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                      SC2
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      Theo bạn website hiển thị bao nhiêu người đang xem sản phẩm? <span className="text-rose-500">*</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {['12', '53', '100', 'Không nhớ'].map((opt) => {
                      const isSelected = surveyAnswers.sc2 === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setAnswer('sc2', opt)}
                          className={`py-3 px-4 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* SNEAKING or BOTH: Show SN1 */}
            {(isSneaking || isBoth) && (
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                    SN1
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    Khoản chi phí nào đã được tự động thêm vào giỏ hàng? <span className="text-rose-500">*</span>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {['Không có', 'Premium Shipping', 'Coupon giảm giá', 'Không nhớ'].map((opt) => {
                    const isSelected = surveyAnswers.sn1 === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAnswer('sn1', opt)}
                        className={`py-3 px-4 rounded-lg border text-xs font-semibold text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300'
                        }`}
                      >
                        <span>{opt}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentSection === 1 || isSubmitting}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border text-xs font-semibold transition-colors ${
            currentSection === 1
              ? 'opacity-40 cursor-not-allowed border-slate-200 text-slate-400'
              : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>

        {currentSection < TOTAL_SECTIONS ? (
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs cursor-pointer active:scale-98"
          >
            <span>Tiếp theo (Phần {currentSection + 1})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`inline-flex items-center gap-2 px-7 py-3 rounded-lg text-xs font-bold text-white transition-all shadow-xs ${
              isSubmitting
                ? 'bg-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer active:scale-98'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Đang gửi phản hồi...' : 'Hoàn tất & Nộp phiếu khảo sát'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
