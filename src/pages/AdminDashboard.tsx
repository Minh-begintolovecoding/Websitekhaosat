import React, { useEffect, useState } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { DashboardMetrics, RawResponseItem } from '../types/experiment.ts';
import {
  Download,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Zap,
  BarChart3,
  FileSpreadsheet,
  FileCode2,
  Trash2,
  Database,
  RefreshCw,
  LogOut,
  LogIn,
  Search,
  Check,
  X,
  ExternalLink,
  Key,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('imt_admin_token') || null;
  });
  const [passcode, setPasscode] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [responses, setResponses] = useState<RawResponseItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<RawResponseItem | null>(null);
  const [selectedResponseIds, setSelectedResponseIds] = useState<number[]>([]);

  // In-app Confirmation Modal (replaces browser confirm/prompt which are blocked by iframes)
  const [actionConfirm, setActionConfirm] = useState<{
    type: 'delete-single' | 'delete-batch' | 'reset-data' | 'seed-data';
    id?: number;
    count?: number;
    title: string;
    message: string;
    confirmText: string;
    danger?: boolean;
  } | null>(null);
  const [isActionProcessing, setIsActionProcessing] = useState<boolean>(false);

  // Filters for response table
  const [filterGroup, setFilterGroup] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSpeedersOnly, setFilterSpeedersOnly] = useState<boolean>(false);
  const [filterFailedManipOnly, setFilterFailedManipOnly] = useState<boolean>(false);

  // Fetch admin metrics and responses
  const fetchDashboardData = async () => {
    if (!authToken) return;
    setIsLoading(true);
    setStatusMsg(null);

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${authToken}`,
      };

      const [resMetrics, resList] = await Promise.all([
        fetch('/api/admin/metrics', { headers }),
        fetch('/api/admin/responses?limit=200', { headers }),
      ]);

      if (resMetrics.status === 401 || resList.status === 401) {
        handleLogout();
        setAuthError('Phiên đăng nhập đã hết hạn hoặc không hợp lệ.');
        return;
      }

      const dataMetrics = await resMetrics.json();
      const dataList = await resList.json();

      if (dataMetrics.success) setMetrics(dataMetrics.metrics);
      if (dataList.success) setResponses(dataList.responses);
    } catch (err: any) {
      console.error('Fetch dashboard error:', err);
      setStatusMsg('Lỗi khi tải dữ liệu bảng điều khiển.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchDashboardData();
    }
  }, [authToken]);

  const loginWithPasscodeValue = async (codeToUse: string) => {
    setAuthError(null);
    setIsAuthenticating(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: codeToUse.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Mật mã nghiên cứu viên không chính xác');
      }

      setAuthToken(data.token);
      localStorage.setItem('imt_admin_token', data.token);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Passcode login
  const handlePasscodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginWithPasscodeValue(passcode);
  };

  // Google Sign-In with Firebase Auth
  const handleGoogleLogin = async () => {
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await cred.user.getIdToken();
      setAuthToken(idToken);
      localStorage.setItem('imt_admin_token', idToken);
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      if (err.message && err.message.includes('identity-toolkit-api')) {
        setAuthError(
          'Dự án Google Cloud chưa kích hoạt Identity Toolkit API cho Firebase Auth. Vui lòng sử dụng Mật mã quản trị để đăng nhập.'
        );
      } else {
        setAuthError(err.message || 'Đăng nhập Google thất bại. Vui lòng sử dụng Mật mã quản trị.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    localStorage.removeItem('imt_admin_token');
    signOut(auth).catch(() => {});
  };

  // Execute confirmed action from in-app modal
  const executeConfirmedAction = async () => {
    if (!actionConfirm || !authToken) return;
    setIsActionProcessing(true);

    try {
      if (actionConfirm.type === 'delete-single' && actionConfirm.id) {
        const res = await fetch(`/api/admin/response/${actionConfirm.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setStatusMsg(`Đã xóa thành công phản hồi #${actionConfirm.id}.`);
          setSelectedResponse(null);
          setSelectedResponseIds((prev) => prev.filter((item) => item !== actionConfirm.id));
          setActionConfirm(null);
          await fetchDashboardData();
        } else {
          setStatusMsg(data.error || 'Lỗi khi xóa phản hồi.');
        }
      } else if (actionConfirm.type === 'delete-batch' && selectedResponseIds.length > 0) {
        const res = await fetch('/api/admin/responses/delete-batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ ids: selectedResponseIds }),
        });
        const data = await res.json();
        if (data.success) {
          setStatusMsg(`Đã xóa thành công ${data.count} phản hồi đã chọn.`);
          setSelectedResponseIds([]);
          setActionConfirm(null);
          await fetchDashboardData();
        } else {
          setStatusMsg(data.error || 'Lỗi khi xóa hàng loạt.');
        }
      } else if (actionConfirm.type === 'reset-data') {
        const res = await fetch('/api/admin/reset', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setStatusMsg('Đã làm sạch toàn bộ dữ liệu thực nghiệm.');
          setSelectedResponse(null);
          setSelectedResponseIds([]);
          setActionConfirm(null);
          await fetchDashboardData();
        } else {
          setStatusMsg(data.error || 'Lỗi khi đặt lại dữ liệu.');
        }
      } else if (actionConfirm.type === 'seed-data') {
        const countToSeed = actionConfirm.count || 100;
        const res = await fetch('/api/admin/seed-simulation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ countPerGroup: countToSeed }),
        });
        const data = await res.json();
        if (data.success) {
          setStatusMsg(
            `Đã tạo thành công ${data.totalParticipants || countToSeed * 4} người tham gia (${data.completedResponses || 380} phản hồi hoàn tất, ${data.totalDropouts || 20} dropouts) chuẩn SEM Witte et al. (2025).`
          );
          setActionConfirm(null);
          await fetchDashboardData();
        } else {
          setStatusMsg(data.error || 'Lỗi khi tạo dữ liệu mô phỏng.');
        }
      }
    } catch (err: any) {
      console.error('Action error:', err);
      setStatusMsg(err.message || 'Lỗi hệ thống khi xử lý thao tác.');
    } finally {
      setIsActionProcessing(false);
    }
  };

  // Trigger modal for single response deletion
  const handleTriggerDeleteResponse = (id: number) => {
    setActionConfirm({
      type: 'delete-single',
      id,
      title: `Xác nhận xóa phản hồi #${id}`,
      message:
        'Bạn có chắc chắn muốn xóa phản hồi này? Dữ liệu câu trả lời và mã đối tượng tương ứng sẽ được xóa bỏ để bảo toàn độ cân bằng phân bổ.',
      confirmText: 'Xác nhận xóa',
      danger: true,
    });
  };

  // Trigger modal for batch deletion
  const handleTriggerDeleteBatch = () => {
    if (selectedResponseIds.length === 0) return;
    setActionConfirm({
      type: 'delete-batch',
      count: selectedResponseIds.length,
      title: `Xác nhận xóa ${selectedResponseIds.length} phản hồi`,
      message:
        `Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedResponseIds.length} phản hồi đã chọn khỏi hệ thống? Thao tác này không thể hoàn tác.`,
      confirmText: `Xóa ${selectedResponseIds.length} phản hồi`,
      danger: true,
    });
  };

  // Trigger modal for data reset
  const handleTriggerResetData = () => {
    setActionConfirm({
      type: 'reset-data',
      title: 'Đặt lại toàn bộ cơ sở dữ liệu',
      message:
        'CẢNH BÁO: Thao tác này sẽ xóa sạch TOÀN BỘ dữ liệu đối tượng tham gia và tất cả phản hồi đã ghi nhận. Hãy đảm bảo bạn đã tải file sao lưu (CSV/XLSX) trước khi thực hiện.',
      confirmText: 'Xóa toàn bộ dữ liệu',
      danger: true,
    });
  };

  // Trigger modal for seed simulation (Witte et al. 2025 SEM Replication N=400)
  const handleTriggerSeedSimulation = (count: number = 100) => {
    setActionConfirm({
      type: 'seed-data',
      count,
      title: 'Tạo 400 mẫu người tham gia chuẩn SEM (Witte et al. 2025)',
      message:
        'Hệ thống sẽ tạo 400 người tham gia phân bổ đều 4 nhóm (100 người/nhóm), gồm ~380 phản hồi hoàn tất (95%), 20 dropouts (5%), ~12 speeders (3%), đáp ứng chính xác giá trị trung bình latent và cấu trúc tương quan SEM theo nghiên cứu Witte et al. (2025). Bạn có muốn tiếp tục?',
      confirmText: 'Tạo 400 mẫu ngay',
      danger: false,
    });
  };

  // Filtered responses list
  const filteredResponses = responses.filter((r) => {
    if (filterGroup !== 'ALL' && r.groupType !== filterGroup) return false;
    if (filterSpeedersOnly && !r.isSpeeding) return false;
    if (filterFailedManipOnly && !r.failedManipulation) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return r.participantUuid.toLowerCase().includes(q) || String(r.responseId).includes(q);
    }
    return true;
  });

  // Login view if not authenticated
  if (!authToken) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-slate-900 text-white rounded-xl mx-auto flex items-center justify-center mb-3">
              <Database className="w-6 h-6 text-indigo-400" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Cổng Quản trị Nghiên cứu</h1>
            <p className="text-xs text-slate-500 mt-1">
              Dành riêng cho Giảng viên & Nghiên cứu viên (Academic Investigator)
            </p>
          </div>

          {authError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed font-medium">{authError}</div>
              </div>
            </div>
          )}

          <form onSubmit={handlePasscodeLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mật mã Quản trị viên (Passcode)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Nhập mật mã nghiên cứu viên"
                  className="w-full px-3.5 py-2.5 pr-10 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-slate-800 bg-white placeholder:text-slate-400 placeholder:font-sans transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  title={showPassword ? 'Ẩn mật mã' : 'Hiện mật mã'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating || !passcode.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>{isAuthenticating ? 'Đang xác thực...' : 'Đăng nhập vào Bảng điều khiển'}</span>
            </button>
          </form>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <span className="relative bg-white px-2 text-[11px] text-slate-400">hoặc</span>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isAuthenticating}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            title="Đăng nhập qua Google (Yêu cầu bật Identity Toolkit API trong GCP)"
          >
            <LogIn className="w-4 h-4 text-slate-400" />
            <span>Đăng nhập với Google OAuth</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Bảng điều khiển Nghiên cứu & Dữ liệu SEM
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-200">
              Live Cloud SQL
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Replication: Witte et al. (2025) | Between-Subjects 4-Condition Design
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>

          <button
            onClick={() => handleTriggerSeedSimulation(100)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-semibold shadow-xs cursor-pointer active:scale-98 transition-all"
            title="Tạo 400 mẫu người tham gia chuẩn SEM nghiên cứu Witte et al. (2025)"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Tạo 400 mẫu SEM (N=400)</span>
          </button>

          <button
            onClick={handleTriggerResetData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-medium cursor-pointer"
            title="Xóa dữ liệu thử nghiệm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa dữ liệu</span>
          </button>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="mb-6 p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="cursor-pointer text-indigo-500 hover:text-indigo-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. KEY HIGH-LEVEL METRICS */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold uppercase">Tổng tham gia</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{metrics.totalParticipants}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Target: 400 người</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold uppercase">Phản hồi hợp lệ</span>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-600">{metrics.completedResponses}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Tỷ lệ hoàn thành: {metrics.overallCompletionRate}%
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold uppercase">Bỏ dở (Dropouts)</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-600">{metrics.totalDropouts}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Tỷ lệ bỏ dở: {metrics.overallDropoutRate}%
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold uppercase">Tốc độ &lt; 60s</span>
              <Zap className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-rose-600">{metrics.speedingRate}%</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Cờ Speeder (Flagged)</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold uppercase">Lỗi kiểm tra</span>
              <AlertTriangle className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-600">{metrics.manipulationFailureRate}%</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Manipulation Check Fail</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold uppercase">TB Khảo sát</span>
              <Clock className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{metrics.avgSurveyDuration}s</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Toàn phiên: {metrics.avgTotalDuration}s
            </div>
          </div>
        </div>
      )}

      {/* 2. GROUP DISTRIBUTION & BALANCED ASSIGNMENT PROGRESS */}
      {metrics && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Phân bổ Cân bằng 4 Nhóm Thực nghiệm (Target: 100/nhóm)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Thuật toán gán đối tượng theo số lượng tối thiểu hiện tại (Balanced Assignment Algorithm)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {['CONTROL', 'SCARCITY', 'SNEAKING', 'BOTH'].map((gt) => {
              const grp = metrics.groups[gt];
              const pct = Math.min(100, Math.round(((grp?.completedResponses || 0) / 100) * 100));

              return (
                <div key={gt} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900">{gt}</span>
                    <span className="text-xs font-mono font-bold text-slate-700">
                      {grp?.completedResponses || 0} / 100
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full transition-all duration-500 ${
                        gt === 'CONTROL'
                          ? 'bg-slate-700'
                          : gt === 'SCARCITY'
                          ? 'bg-amber-500'
                          : gt === 'SNEAKING'
                          ? 'bg-indigo-600'
                          : 'bg-purple-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                    <div>
                      <span>Tổng tham gia:</span>{' '}
                      <strong className="text-slate-700">{grp?.totalParticipants || 0}</strong>
                    </div>
                    <div>
                      <span>Hoàn thành:</span>{' '}
                      <strong className="text-slate-700">{grp?.completionRate || 0}%</strong>
                    </div>
                    <div>
                      <span>TB Sp:</span>{' '}
                      <strong className="text-slate-700">{grp?.avgProductDuration || 0}s</strong>
                    </div>
                    <div>
                      <span>TB Giỏ:</span>{' '}
                      <strong className="text-slate-700">{grp?.avgCartDuration || 0}s</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. CONSTRUCT COMPARISON MATRIX (ACADEMIC IMT DESCRIPTIVES) */}
      {metrics && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Ma trận Điểm Trung bình Các Khái niệm (IMT Latent Construct Means)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Thang đo 1-7 Likert. So sánh đối chiếu giữa 4 điều kiện thực nghiệm để kiểm tra giả thuyết Witte et al. (2025).
              </p>
            </div>
            <BarChart3 className="w-5 h-5 text-slate-400" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                  <th className="py-2.5 px-3">Khái niệm (Construct)</th>
                  <th className="py-2.5 px-3">Mô tả lý thuyết</th>
                  <th className="py-2.5 px-3 text-center">CONTROL</th>
                  <th className="py-2.5 px-3 text-center">SCARCITY</th>
                  <th className="py-2.5 px-3 text-center">SNEAKING</th>
                  <th className="py-2.5 px-3 text-center">BOTH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">QUAL (Chất lượng)</td>
                  <td className="py-2.5 px-3 text-slate-500">Chính xác, trung thực, phản ánh thực tế</td>
                  <td className="py-2.5 px-3 text-center font-mono">{metrics.groups.CONTROL?.meanQual || '-'}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{metrics.groups.SCARCITY?.meanQual || '-'}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{metrics.groups.SNEAKING?.meanQual || '-'}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{metrics.groups.BOTH?.meanQual || '-'}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">QUAN (Lượng thông tin)</td>
                  <td className="py-2.5 px-3 text-slate-500">Đầy đủ, công khai, không che giấu</td>
                  <td className="py-2.5 px-3 text-center font-mono">{metrics.groups.CONTROL?.meanQuan || '-'}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{metrics.groups.SCARCITY?.meanQuan || '-'}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{metrics.groups.SNEAKING?.meanQuan || '-'}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{metrics.groups.BOTH?.meanQuan || '-'}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">REL (Sự liên quan)</td>
                  <td className="py-2.5 px-3 text-slate-500">Hữu ích, phục vụ việc đánh giá</td>
                  <td className="py-2.5 px-3 text-center font-mono">{metrics.groups.CONTROL?.meanRel || '-'}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{metrics.groups.SCARCITY?.meanRel || '-'}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{metrics.groups.SNEAKING?.meanRel || '-'}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{metrics.groups.BOTH?.meanRel || '-'}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">CLA (Độ rõ ràng)</td>
                  <td className="py-2.5 px-3 text-slate-500">Dễ hiểu, minh bạch, không nhầm lẫn</td>
                  <td className="py-2.5 px-3 text-center font-mono">{metrics.groups.CONTROL?.meanCla || '-'}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{metrics.groups.SCARCITY?.meanCla || '-'}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{metrics.groups.SNEAKING?.meanCla || '-'}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{metrics.groups.BOTH?.meanCla || '-'}</td>
                </tr>
                <tr className="bg-amber-50/40">
                  <td className="py-2.5 px-3 font-semibold text-amber-900">PCM (Cảm nhận thao túng)</td>
                  <td className="py-2.5 px-3 text-amber-800">Dẫn dắt, vụ lợi, tác động phi minh bạch</td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">
                    {metrics.groups.CONTROL?.meanPcm || '-'}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-700">
                    {metrics.groups.SCARCITY?.meanPcm || '-'}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-700">
                    {metrics.groups.SNEAKING?.meanPcm || '-'}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-rose-700">
                    {metrics.groups.BOTH?.meanPcm || '-'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">ATT (Thái độ website)</td>
                  <td className="py-2.5 px-3 text-slate-500">Thiện cảm, đánh giá tích cực</td>
                  <td className="py-2.5 px-3 text-center font-mono">{metrics.groups.CONTROL?.meanAtt || '-'}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{metrics.groups.SCARCITY?.meanAtt || '-'}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{metrics.groups.SNEAKING?.meanAtt || '-'}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{metrics.groups.BOTH?.meanAtt || '-'}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">PI (Ý định mua)</td>
                  <td className="py-2.5 px-3 text-slate-500">Khả năng cân nhắc và quyết định mua</td>
                  <td className="py-2.5 px-3 text-center font-mono">{metrics.groups.CONTROL?.meanPi || '-'}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{metrics.groups.SCARCITY?.meanPi || '-'}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{metrics.groups.SNEAKING?.meanPi || '-'}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{metrics.groups.BOTH?.meanPi || '-'}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">LOY (Lòng trung thành)</td>
                  <td className="py-2.5 px-3 text-slate-500">Quay lại, ưu tiên và giới thiệu</td>
                  <td className="py-2.5 px-3 text-center font-mono">{metrics.groups.CONTROL?.meanLoy || '-'}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{metrics.groups.SCARCITY?.meanLoy || '-'}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{metrics.groups.SNEAKING?.meanLoy || '-'}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{metrics.groups.BOTH?.meanLoy || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3.1 SEM RESEARCH VALIDATION: CRONBACH'S ALPHA & CORRELATION MATRIX */}
      {metrics?.semValidation && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Cronbach's Alpha Scale Reliability */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Độ tin cậy Thang đo (Cronbach's Alpha)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kiểm định tính nhất quán nội tại (Internal Consistency) cho từng khái niệm nghiên cứu
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                SEM Benchmark
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                    <th className="py-2 px-2.5">Thang đo</th>
                    <th className="py-2 px-2.5 text-center">Số mục (K)</th>
                    <th className="py-2 px-2.5 text-center">Cronbach's &alpha;</th>
                    <th className="py-2 px-2.5 text-center">Mục tiêu</th>
                    <th className="py-2 px-2.5 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {metrics.semValidation.reliability.map((rel) => (
                    <tr key={rel.construct} className="hover:bg-slate-50/50">
                      <td className="py-2 px-2.5">
                        <strong className="text-slate-900">{rel.construct}</strong>
                        <span className="text-[11px] text-slate-500 block truncate max-w-[200px]">
                          {rel.label}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-center font-mono">{rel.itemCount}</td>
                      <td className="py-2 px-2.5 text-center font-mono font-bold text-slate-900">
                        {rel.cronbachAlpha.toFixed(3)}
                      </td>
                      <td className="py-2 px-2.5 text-center font-mono text-slate-500">
                        &gt; {rel.targetAlpha.toFixed(2)}
                      </td>
                      <td className="py-2 px-2.5 text-center">
                        {rel.passed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            <Check className="w-3 h-3" /> Đạt chuẩn
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                            Đang tích lũy
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Structural Path Correlations Matrix */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Ma trận Tương quan Cấu trúc SEM (Path Correlations)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kiểm định giả thuyết quan hệ cấu trúc giữa các khái niệm nghiên cứu Witte et al. (2025)
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-100 text-blue-800 font-semibold border border-blue-200">
                Pearson r
              </span>
            </div>

            <div className="space-y-3">
              {metrics.semValidation.correlations.map((c) => {
                const isNegative = c.direction === 'negative';
                return (
                  <div
                    key={`${c.var1}-${c.var2}`}
                    className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 font-mono text-[10px]">
                          {c.var1}
                        </span>
                        <span>⟶</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 font-mono text-[10px]">
                          {c.var2}
                        </span>
                        <span className="text-[11px] font-normal text-slate-500 ml-1 truncate">
                          ({c.label})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Mục tiêu lý thuyết: {c.targetR > 0 ? `+${c.targetR}` : c.targetR}
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-base font-bold font-mono ${
                          isNegative ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {c.r > 0 ? `+${c.r.toFixed(2)}` : c.r.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {Math.abs(c.r) >= 0.6 ? 'Quan hệ mạnh' : 'Quan hệ trung bình'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Manipulation Failure Breakdown */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase mb-2">
                Phân tích Lỗi Kiểm tra Can thiệp (Manipulation Failures)
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                  <span className="text-[10px] text-amber-700 block font-semibold uppercase">SCARCITY (Mục tiêu ≈10)</span>
                  <strong className="text-base text-amber-900 font-mono">
                    {metrics.groups.SCARCITY?.failedManipulationCount || 0}
                  </strong>
                  <span className="text-[10px] text-amber-600 block mt-0.5">
                    {metrics.groups.SCARCITY?.completedResponses
                      ? `${Math.round(
                          ((metrics.groups.SCARCITY.failedManipulationCount || 0) /
                            metrics.groups.SCARCITY.completedResponses) *
                            100
                        )}%`
                      : '0%'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200">
                  <span className="text-[10px] text-indigo-700 block font-semibold uppercase">SNEAKING (Mục tiêu ≈15)</span>
                  <strong className="text-base text-indigo-900 font-mono">
                    {metrics.groups.SNEAKING?.failedManipulationCount || 0}
                  </strong>
                  <span className="text-[10px] text-indigo-600 block mt-0.5">
                    {metrics.groups.SNEAKING?.completedResponses
                      ? `${Math.round(
                          ((metrics.groups.SNEAKING.failedManipulationCount || 0) /
                            metrics.groups.SNEAKING.completedResponses) *
                            100
                        )}%`
                      : '0%'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                  <span className="text-[10px] text-rose-700 block font-semibold uppercase">BOTH (Mục tiêu ≈20)</span>
                  <strong className="text-base text-rose-900 font-mono">
                    {metrics.groups.BOTH?.failedManipulationCount || 0}
                  </strong>
                  <span className="text-[10px] text-rose-600 block mt-0.5">
                    {metrics.groups.BOTH?.completedResponses
                      ? `${Math.round(
                          ((metrics.groups.BOTH.failedManipulationCount || 0) /
                            metrics.groups.BOTH.completedResponses) *
                            100
                        )}%`
                      : '0%'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. EXPORT HUB FOR STATISTICAL SOFTWARE */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Xuất Dữ liệu & Kịch bản Phân tích SEM (Flat-Table Exports)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Định dạng bảng phẳng tương thích 100% với SPSS, AMOS, SmartPLS, R (lavaan), và Python (semopy).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* CSV Flat Table */}
          <a
            href={`/api/admin/export/csv?token=${encodeURIComponent(authToken || '')}`}
            download
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 transition-colors flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  .CSV
                </span>
              </div>
              <div className="font-bold text-xs text-slate-900">Flat Table CSV</div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Bảng dữ liệu chuẩn cho SmartPLS, JASP, Jamovi
              </p>
            </div>
            <div className="mt-4 text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <Download className="w-3.5 h-3.5" />
              <span>Tải file CSV</span>
            </div>
          </a>

          {/* Excel XLSX */}
          <a
            href={`/api/admin/export/xlsx?token=${encodeURIComponent(authToken || '')}`}
            download
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 transition-colors flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <FileSpreadsheet className="w-5 h-5 text-teal-600" />
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                  .XLSX
                </span>
              </div>
              <div className="font-bold text-xs text-slate-900">Excel Workbook</div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Đầy đủ biến định lượng, mã hóa nhóm và nhãn
              </p>
            </div>
            <div className="mt-4 text-xs font-semibold text-teal-700 flex items-center gap-1">
              <Download className="w-3.5 h-3.5" />
              <span>Tải file Excel</span>
            </div>
          </a>

          {/* SPSS Syntax (.sps) */}
          <a
            href={`/api/admin/export/syntax/spss?token=${encodeURIComponent(authToken || '')}`}
            download
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 transition-colors flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <FileCode2 className="w-5 h-5 text-indigo-600" />
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  .SPS
                </span>
              </div>
              <div className="font-bold text-xs text-slate-900">SPSS / AMOS Syntax</div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Variable labels, Cronbach Alpha, ANOVA & Regression
              </p>
            </div>
            <div className="mt-4 text-xs font-semibold text-indigo-700 flex items-center gap-1">
              <Download className="w-3.5 h-3.5" />
              <span>Tải SPSS Syntax</span>
            </div>
          </a>

          {/* R lavaan (.R) */}
          <a
            href={`/api/admin/export/syntax/r?token=${encodeURIComponent(authToken || '')}`}
            download
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 transition-colors flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <FileCode2 className="w-5 h-5 text-blue-600" />
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                  .R
                </span>
              </div>
              <div className="font-bold text-xs text-slate-900">R lavaan SEM</div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                CFA Measurement model, Structural SEM, Fit Indices
              </p>
            </div>
            <div className="mt-4 text-xs font-semibold text-blue-700 flex items-center gap-1">
              <Download className="w-3.5 h-3.5" />
              <span>Tải R Script</span>
            </div>
          </a>

          {/* Python semopy (.py) */}
          <a
            href={`/api/admin/export/syntax/python?token=${encodeURIComponent(authToken || '')}`}
            download
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 transition-colors flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <FileCode2 className="w-5 h-5 text-amber-600" />
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                  .PY
                </span>
              </div>
              <div className="font-bold text-xs text-slate-900">Python semopy</div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Model specification, ML optimization & HTML report
              </p>
            </div>
            <div className="mt-4 text-xs font-semibold text-amber-700 flex items-center gap-1">
              <Download className="w-3.5 h-3.5" />
              <span>Tải Python Script</span>
            </div>
          </a>
        </div>
      </div>

      {/* 5. RAW DATA RESPONSES TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Danh sách Phản hồi Thực nghiệm</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hiển thị {filteredResponses.length} trên tổng số {responses.length} phản hồi đã ghi nhận.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {selectedResponseIds.length > 0 && (
              <button
                type="button"
                onClick={handleTriggerDeleteBatch}
                className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa {selectedResponseIds.length} mục đã chọn</span>
              </button>
            )}

            {/* Search */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm UUID..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            {/* Group selector */}
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="py-1.5 px-2.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none font-medium text-slate-700"
            >
              <option value="ALL">Tất cả nhóm</option>
              <option value="CONTROL">CONTROL</option>
              <option value="SCARCITY">SCARCITY</option>
              <option value="SNEAKING">SNEAKING</option>
              <option value="BOTH">BOTH</option>
            </select>

            {/* Flags */}
            <button
              onClick={() => setFilterSpeedersOnly(!filterSpeedersOnly)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                filterSpeedersOnly
                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Chỉ Speeders (&lt;60s)
            </button>
          </div>
        </div>

        {filteredResponses.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            Chưa có phản hồi nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                  <th className="py-2.5 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={
                        filteredResponses.length > 0 &&
                        filteredResponses.every((r) => selectedResponseIds.includes(r.responseId))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          const allFilteredIds = filteredResponses.map((r) => r.responseId);
                          setSelectedResponseIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
                        } else {
                          const currentFilteredIds = new Set(filteredResponses.map((r) => r.responseId));
                          setSelectedResponseIds((prev) => prev.filter((id) => !currentFilteredIds.has(id)));
                        }
                      }}
                      className="rounded text-slate-900 border-slate-300 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Participant UUID</th>
                  <th className="py-2.5 px-3">Nhóm</th>
                  <th className="py-2.5 px-3">Thời lượng (Sp / Giỏ / KS)</th>
                  <th className="py-2.5 px-3">Cờ chất lượng</th>
                  <th className="py-2.5 px-3">Kiểm tra Manipulation</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredResponses.slice(0, 50).map((r) => {
                  const isSelected = selectedResponseIds.includes(r.responseId);
                  return (
                    <tr key={r.responseId} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                      <td className="py-2.5 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedResponseIds((prev) => [...prev, r.responseId]);
                            } else {
                              setSelectedResponseIds((prev) => prev.filter((id) => id !== r.responseId));
                            }
                          }}
                          className="rounded text-slate-900 border-slate-300 cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        #{r.responseId}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {r.participantUuid.slice(0, 8)}...
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.groupType === 'CONTROL'
                              ? 'bg-slate-100 text-slate-800'
                              : r.groupType === 'SCARCITY'
                              ? 'bg-amber-100 text-amber-800'
                              : r.groupType === 'SNEAKING'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {r.groupType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {r.productPageDuration}s / {r.cartPageDuration}s / {r.surveyDuration}s
                      </td>
                      <td className="py-2.5 px-3">
                        {r.isSpeeding ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            <Zap className="w-3 h-3" />
                            Speeder (&lt;60s)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                            <Check className="w-3 h-3" />
                            Hợp lệ
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {r.failedManipulation ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                            <AlertTriangle className="w-3 h-3" />
                            Không khớp
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">Đạt</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedResponse(r)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                          >
                            Xem điểm
                          </button>
                          <button
                            onClick={() => handleTriggerDeleteResponse(r.responseId)}
                            title="Xóa phản hồi này"
                            className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Response Detail Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Chi tiết Phản hồi #{selectedResponse.responseId}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  UUID: {selectedResponse.participantUuid} | Nhóm: {selectedResponse.groupType}
                </p>
              </div>
              <button
                onClick={() => setSelectedResponse(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg">
                <div>
                  <span className="text-slate-400 block">Thời lượng Sp:</span>
                  <strong className="text-slate-800">{selectedResponse.productPageDuration}s</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Thời lượng Giỏ:</span>
                  <strong className="text-slate-800">{selectedResponse.cartPageDuration}s</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Thời lượng Khảo sát:</span>
                  <strong className="text-slate-800">{selectedResponse.surveyDuration}s</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Tổng phiên:</span>
                  <strong className="text-slate-800">{selectedResponse.totalDuration}s</strong>
                </div>
              </div>

              {/* Construct items */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2 uppercase text-[11px]">
                  Điểm Thang đo Chi tiết (1 - 7 Likert)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2 border border-slate-200 rounded">
                    <strong>QUAL:</strong> {selectedResponse.qual1}, {selectedResponse.qual2},{' '}
                    {selectedResponse.qual3}, {selectedResponse.qual4}
                  </div>
                  <div className="p-2 border border-slate-200 rounded">
                    <strong>QUAN:</strong> {selectedResponse.quan1}, {selectedResponse.quan2},{' '}
                    {selectedResponse.quan3}, {selectedResponse.quan4}
                  </div>
                  <div className="p-2 border border-slate-200 rounded">
                    <strong>REL:</strong> {selectedResponse.rel1}, {selectedResponse.rel2},{' '}
                    {selectedResponse.rel3}
                  </div>
                  <div className="p-2 border border-slate-200 rounded">
                    <strong>CLA:</strong> {selectedResponse.cla1}, {selectedResponse.cla2},{' '}
                    {selectedResponse.cla3}, {selectedResponse.cla4}
                  </div>
                  <div className="p-2 border border-slate-200 rounded col-span-2">
                    <strong>PCM (Thao túng):</strong> {selectedResponse.pcm1}, {selectedResponse.pcm2},{' '}
                    {selectedResponse.pcm3}, {selectedResponse.pcm4}, {selectedResponse.pcm5},{' '}
                    {selectedResponse.pcm6}
                  </div>
                  <div className="p-2 border border-slate-200 rounded">
                    <strong>ATT:</strong> {selectedResponse.att1}, {selectedResponse.att2},{' '}
                    {selectedResponse.att3}, {selectedResponse.att4}
                  </div>
                  <div className="p-2 border border-slate-200 rounded">
                    <strong>PI:</strong> {selectedResponse.pi1}, {selectedResponse.pi2},{' '}
                    {selectedResponse.pi3}
                  </div>
                  <div className="p-2 border border-slate-200 rounded">
                    <strong>LOY:</strong> {selectedResponse.loy1}, {selectedResponse.loy2},{' '}
                    {selectedResponse.loy3}
                  </div>
                  <div className="p-2 border border-slate-200 rounded">
                    <strong>FAM:</strong> {selectedResponse.fam1}, {selectedResponse.fam2},{' '}
                    {selectedResponse.fam3}, {selectedResponse.fam4}
                  </div>
                </div>
              </div>

              {/* Demographics */}
              <div>
                <h4 className="font-bold text-slate-800 mb-1 uppercase text-[11px]">
                  Nhân khẩu học (Demographics)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 bg-slate-50 rounded-lg">
                  <div>
                    <span className="text-slate-500 block">Giới tính:</span>
                    <strong className="text-slate-800">{selectedResponse.gender || 'Chưa ghi nhận'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Nhóm tuổi:</span>
                    <strong className="text-slate-800">
                      {selectedResponse.ageGroup ? `${selectedResponse.ageGroup} tuổi` : 'Chưa ghi nhận'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Học vấn:</span>
                    <strong className="text-slate-800">{selectedResponse.education || 'Chưa ghi nhận'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Nghề nghiệp:</span>
                    <strong className="text-slate-800">{selectedResponse.occupation || 'Chưa ghi nhận'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Tần suất mua online:</span>
                    <strong className="text-slate-800">
                      {selectedResponse.onlineShoppingFreq || 'Chưa ghi nhận'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Manipulation check */}
              <div>
                <h4 className="font-bold text-slate-800 mb-1 uppercase text-[11px]">
                  Kiểm tra Nhận thức Giao diện (Manipulation Checks)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="p-2 border border-slate-200/80 rounded-md bg-white">
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      SC1 (Số sp - Đáp án: 3){selectedResponse.groupType === 'CONTROL' || selectedResponse.groupType === 'SNEAKING' ? ' [Không áp dụng]' : ''}
                    </span>
                    <strong className={`text-xs ${selectedResponse.sc1 === '3 sản phẩm' || selectedResponse.sc1 === '3' ? 'text-emerald-700' : 'text-slate-800'}`}>
                      {selectedResponse.groupType === 'CONTROL' || selectedResponse.groupType === 'SNEAKING' ? 'Không áp dụng' : selectedResponse.sc1 || 'N/A'}
                    </strong>
                  </div>
                  <div className="p-2 border border-slate-200/80 rounded-md bg-white">
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      SC2 (Người xem - Đáp án: 53){selectedResponse.groupType === 'CONTROL' || selectedResponse.groupType === 'SNEAKING' ? ' [Không áp dụng]' : ''}
                    </span>
                    <strong className={`text-xs ${selectedResponse.sc2 === '53' || selectedResponse.sc2 === '53 người' ? 'text-emerald-700' : 'text-slate-800'}`}>
                      {selectedResponse.groupType === 'CONTROL' || selectedResponse.groupType === 'SNEAKING' ? 'Không áp dụng' : selectedResponse.sc2 ? `${selectedResponse.sc2} người` : 'N/A'}
                    </strong>
                  </div>
                  <div className="p-2 border border-slate-200/80 rounded-md bg-white">
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      SN1 (Phí tự thêm - Đáp án: Premium Shipping){selectedResponse.groupType === 'CONTROL' || selectedResponse.groupType === 'SCARCITY' ? ' [Không áp dụng]' : ''}
                    </span>
                    <strong className={`text-xs ${selectedResponse.sn1 === 'Premium Shipping' || selectedResponse.sn1 === 'Premium Shipping (35.000₫)' ? 'text-emerald-700' : 'text-slate-800'}`}>
                      {selectedResponse.groupType === 'CONTROL' || selectedResponse.groupType === 'SCARCITY' ? 'Không áp dụng' : selectedResponse.sn1 || 'N/A'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleTriggerDeleteResponse(selectedResponse.responseId)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-semibold text-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa phản hồi này</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedResponse(null)}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP CONFIRMATION MODAL (Reliable, cannot be blocked by iframe sandboxes) */}
      {actionConfirm && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start gap-3.5 mb-4">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  actionConfirm.danger ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'
                }`}
              >
                {actionConfirm.danger ? <AlertTriangle className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {actionConfirm.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {actionConfirm.message}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setActionConfirm(null)}
                disabled={isActionProcessing}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={executeConfirmedAction}
                disabled={isActionProcessing}
                className={`px-4 py-2 rounded-lg text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 ${
                  actionConfirm.danger
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {isActionProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    {actionConfirm.danger && <Trash2 className="w-3.5 h-3.5" />}
                    <span>{actionConfirm.confirmText}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
