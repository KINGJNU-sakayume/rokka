import { useState, useEffect } from 'react';
import {
  Shield, ChevronRight, ChevronLeft, Eye, EyeOff,
  AlertCircle, Loader2, CheckCircle2, Lock, User, Hash,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  BATTALION_LABELS,
  COMPANY_CODES, COMPANY_LABELS,
  buildEmail, validateSerial,
  type BattalionCode, type CompanyCode,
} from '../../types/auth';

// ─── 타입 ──────────────────────────────────────────────────────────────────────
type Mode = 'select' | 'register' | 'login';
type RegStep = 'company' | 'info' | 'confirm';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

// ─── 별 장식 배경 ──────────────────────────────────────────────────────────────
function StarField() {
  const stars = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    top:    `${Math.random() * 100}%`,
    left:   `${Math.random() * 100}%`,
    size:   Math.random() * 2 + 1,
    delay:  Math.random() * 3,
    dur:    Math.random() * 3 + 2,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map(s => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            top: s.top, left: s.left,
            width: s.size, height: s.size,
            opacity: 0,
            animation: `twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ─── 진행 단계 표시 ────────────────────────────────────────────────────────────
function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5 justify-center mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i < current
              ? 'w-5 h-1.5 bg-army-green-400'
              : i === current
              ? 'w-5 h-1.5 bg-white'
              : 'w-1.5 h-1.5 bg-white/20'
          }`}
        />
      ))}
    </div>
  );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode]           = useState<Mode>('select');
  const [regStep, setRegStep]     = useState<RegStep>('company');
  const [submitting, setSubmit]   = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);

  // 공통 필드
  const [battalion] = useState<BattalionCode>('155bn');
  const [company,   setCompany]   = useState<CompanyCode | ''>('');
  const [name,      setName]      = useState('');
  const [serial,    setSerial]    = useState('');
  const [showPw,    setShowPw]    = useState(false);

  useEffect(() => { setError(''); }, [mode, regStep, company, name, serial]);

  // ── 애니메이션 keyframes 주입 ──────────────────────────────────────────────
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes twinkle {
        0%, 100% { opacity: 0; }
        50%       { opacity: 0.6; }
      }
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(16px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      .anim-slide { animation: slideUp .35s ease-out both; }
      .anim-fade  { animation: fadeIn .25s ease-out both; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  // ─────────────────── 입력 검증 ─────────────────────────────────────────────
  const validateRegStep = (): string => {
    if (regStep === 'company') {
      if (!company) return '중대를 선택해주세요.';
    }
    if (regStep === 'info') {
      if (!name.trim())       return '이름을 입력해주세요.';
      if (name.trim().length < 2) return '이름은 2자 이상이어야 합니다.';
      const err = validateSerial(serial);
      if (err) return err;
    }
    return '';
  };

  // ─────────────────── 회원가입 ─────────────────────────────────────────────
  const handleRegister = async () => {
    const err = validateRegStep();
    if (err) { setError(err); return; }

    if (regStep === 'company') { setRegStep('info'); return; }
    if (regStep === 'info')    { setRegStep('confirm'); return; }

    // confirm 단계: 실제 가입
    setSubmit(true);
    setError('');

    const email    = buildEmail(serial, company as CompanyCode, battalion);
    const password = serial;

    const { error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name:            name.trim(),
          unit_company:    company,
          unit_battalion:  battalion,
          serial_number:   serial,
        },
      },
    });

    if (signUpErr) {
      if (signUpErr.message.includes('already registered')) {
        setError('이미 등록된 군번입니다. 로그인을 이용해주세요.');
      } else {
        setError(signUpErr.message);
      }
      setSubmit(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => onAuthenticated(), 1200);
  };

  // ─────────────────── 로그인 ─────────────────────────────────────────────
  const handleLogin = async () => {
    const serialErr = validateSerial(serial);
    if (serialErr) { setError(serialErr); return; }
    if (!company)  { setError('중대를 선택해주세요.'); return; }

    setSubmit(true);
    setError('');

    const email    = buildEmail(serial, company as CompanyCode, battalion);
    const password = serial;

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email, password,
    });

    if (signInErr) {
      if (signInErr.message.includes('Invalid login')) {
        setError('군번 또는 중대 정보가 일치하지 않습니다.');
      } else {
        setError(signInErr.message);
      }
      setSubmit(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => onAuthenticated(), 800);
  };

  // ─────────────────── 렌더 ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0d1520] flex items-center justify-center relative overflow-hidden px-5">
      <StarField />

      {/* 배경 광원 */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-army-green-800/20 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-army-green-900/20 blur-3xl" />

      <div className="relative w-full max-w-sm anim-fade">
        {/* 로고 헤더 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-army-green-900/50 border border-army-green-700/40 mb-5 shadow-lg shadow-army-green-900/30">
            <Shield size={40} className="text-army-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
            군생활 관리
          </h1>
          <p className="text-gray-500 text-sm">155대대 병사 전용</p>
        </div>

        {/* ── 모드 선택 화면 ── */}
        {mode === 'select' && (
          <div className="anim-slide space-y-3">
            <button
              onClick={() => { setMode('register'); setRegStep('company'); }}
              className="w-full flex items-center justify-between px-5 py-4 bg-army-green-700/30 border border-army-green-600/40 rounded-2xl hover:bg-army-green-700/50 transition-all group"
            >
              <div className="text-left">
                <p className="text-white font-semibold text-sm">처음 사용합니다</p>
                <p className="text-gray-400 text-xs mt-0.5">계정을 새로 만들기</p>
              </div>
              <ChevronRight size={18} className="text-army-green-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => setMode('login')}
              className="w-full flex items-center justify-between px-5 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
            >
              <div className="text-left">
                <p className="text-white font-semibold text-sm">기존 계정 로그인</p>
                <p className="text-gray-400 text-xs mt-0.5">이미 계정이 있습니다</p>
              </div>
              <ChevronRight size={18} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <p className="text-center text-gray-600 text-xs pt-2">
              155대대 병사 전용 서비스입니다
            </p>
          </div>
        )}

        {/* ── 회원가입 화면 ── */}
        {mode === 'register' && (
          <div className="anim-slide">
            <StepDots
              total={3}
              current={regStep === 'company' ? 0 : regStep === 'info' ? 1 : 2}
            />

            {/* STEP 1: 중대 선택 */}
            {regStep === 'company' && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <p className="text-white font-semibold">소속 중대를 선택하세요</p>
                  <p className="text-gray-400 text-xs mt-1">{BATTALION_LABELS[battalion]}</p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {COMPANY_CODES.map(code => (
                    <button
                      key={code}
                      onClick={() => setCompany(code)}
                      className={`py-4 rounded-2xl border text-sm font-bold transition-all ${
                        company === code
                          ? 'bg-army-green-600 border-army-green-500 text-white shadow-lg shadow-army-green-900/40'
                          : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      {COMPANY_LABELS[code]}
                    </button>
                  ))}
                </div>

                {error && <ErrorMsg msg={error} />}

                <NextBtn onClick={() => { const e = validateRegStep(); e ? setError(e) : setRegStep('info'); }} label="다음" />
                <BackBtn onClick={() => setMode('select')} />
              </div>
            )}

            {/* STEP 2: 이름 + 군번 */}
            {regStep === 'info' && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <p className="text-white font-semibold">이름과 군번을 입력하세요</p>
                  <p className="text-gray-400 text-xs mt-1">군번이 로그인 비밀번호가 됩니다</p>
                </div>

                <FieldInput
                  icon={<User size={15} className="text-gray-400" />}
                  type="text"
                  placeholder="홍길동"
                  label="이름"
                  value={name}
                  onChange={setName}
                />

                <FieldInput
                  icon={<Hash size={15} className="text-gray-400" />}
                  type={showPw ? 'text' : 'password'}
                  placeholder="25-12345678"
                  label="군번 (비밀번호)"
                  value={serial}
                  onChange={setSerial}
                  suffix={
                    <button type="button" onClick={() => setShowPw(v => !v)} className="text-gray-400 hover:text-white transition-colors">
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  }
                />

                {error && <ErrorMsg msg={error} />}

                <NextBtn
                  onClick={() => { const e = validateRegStep(); e ? setError(e) : setRegStep('confirm'); }}
                  label="다음"
                />
                <BackBtn onClick={() => setRegStep('company')} />
              </div>
            )}

            {/* STEP 3: 최종 확인 */}
            {regStep === 'confirm' && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <p className="text-white font-semibold">정보를 확인해주세요</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                  {[
                    { label: '소속', value: `${BATTALION_LABELS[battalion]} ${COMPANY_LABELS[company as CompanyCode]}` },
                    { label: '이름', value: name },
                    { label: '군번', value: serial },
                    { label: '계정 ID', value: buildEmail(serial, company as CompanyCode, battalion) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">{label}</span>
                      <span className="text-white text-sm font-medium">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-900/20 border border-amber-700/30 rounded-xl">
                  <Lock size={12} className="text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-amber-300/80 text-xs leading-relaxed">
                    군번이 비밀번호로 사용됩니다. 주변인과 공유하지 않도록 주의하세요.
                  </p>
                </div>

                {error && <ErrorMsg msg={error} />}

                {success ? (
                  <SuccessMsg msg="가입 완료! 잠시 후 이동합니다..." />
                ) : (
                  <NextBtn onClick={handleRegister} label="가입 완료" loading={submitting} />
                )}
                <BackBtn onClick={() => setRegStep('info')} />
              </div>
            )}
          </div>
        )}

        {/* ── 로그인 화면 ── */}
        {mode === 'login' && (
          <div className="anim-slide space-y-4">
            <div className="text-center mb-6">
              <p className="text-white font-semibold">로그인</p>
              <p className="text-gray-400 text-xs mt-1">군번과 소속 중대를 입력하세요</p>
            </div>

            {/* 중대 선택 */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">소속 중대</label>
              <div className="grid grid-cols-4 gap-1.5">
                {COMPANY_CODES.map(code => (
                  <button
                    key={code}
                    onClick={() => setCompany(code)}
                    className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      company === code
                        ? 'bg-army-green-600 border-army-green-500 text-white'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {COMPANY_LABELS[code]}
                  </button>
                ))}
              </div>
            </div>

            <FieldInput
              icon={<Hash size={15} className="text-gray-400" />}
              type={showPw ? 'text' : 'password'}
              placeholder="25-12345678"
              label="군번 (비밀번호)"
              value={serial}
              onChange={setSerial}
              suffix={
                <button type="button" onClick={() => setShowPw(v => !v)} className="text-gray-400 hover:text-white transition-colors">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
            />

            {error && <ErrorMsg msg={error} />}

            {success ? (
              <SuccessMsg msg="로그인 중..." />
            ) : (
              <NextBtn onClick={handleLogin} label="로그인" loading={submitting} />
            )}
            <BackBtn onClick={() => setMode('select')} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 공용 서브컴포넌트 ──────────────────────────────────────────────────────────

function FieldInput({
  icon, type, placeholder, label, value, onChange, suffix,
}: {
  icon: React.ReactNode; type: string; placeholder: string; label: string;
  value: string; onChange: (v: string) => void; suffix?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <div className="flex items-center gap-2 bg-white/5 border border-white/15 rounded-xl px-3 py-3 focus-within:border-army-green-500/60 transition-colors">
        {icon}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none"
        />
        {suffix}
      </div>
    </div>
  );
}

function NextBtn({ onClick, label, loading }: { onClick: () => void; label: string; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 bg-army-green-600 hover:bg-army-green-500 disabled:opacity-60 text-white font-semibold py-3.5 rounded-2xl transition-all text-sm shadow-lg shadow-army-green-900/40"
    >
      {loading
        ? <><Loader2 size={16} className="animate-spin" /> 처리 중...</>
        : <>{label} <ChevronRight size={16} /></>
      }
    </button>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-1.5 text-gray-500 hover:text-gray-300 text-xs py-1.5 transition-colors"
    >
      <ChevronLeft size={12} /> 이전으로
    </button>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2.5 bg-red-900/20 border border-red-700/40 rounded-xl">
      <AlertCircle size={13} className="text-red-400 mt-0.5 shrink-0" />
      <p className="text-red-300 text-xs leading-relaxed">{msg}</p>
    </div>
  );
}

function SuccessMsg({ msg }: { msg: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-3.5 bg-army-green-900/30 border border-army-green-600/40 rounded-2xl">
      <CheckCircle2 size={16} className="text-army-green-400" />
      <p className="text-army-green-300 text-sm font-semibold">{msg}</p>
    </div>
  );
}
