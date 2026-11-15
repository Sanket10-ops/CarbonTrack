import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, ArrowLeft, ArrowRight, BarChart3, Check, CheckCircle2, ChevronDown,
  CircleHelp, Cloud, Eye, EyeOff, Globe2, Leaf, LockKeyhole, LogOut,
  Mail, Menu, ShieldCheck, Sparkles, Sprout, TrendingDown, TrendingUp,
  UserRound, X, Target, Award, Settings, Plus, Trash2, Pencil, RefreshCw,
  CalendarDays, Users, Building2, Download, Zap, CarFront, Utensils, ShoppingBag,
  AlertCircle, FileText, Compass, Trophy, Flame, MessageCircle, Send
} from "lucide-react";

import AppLayout from "./components/layout/AppLayout.jsx";
import ActivityTypeIcon from "./components/ActivityTypeIcon.jsx";

import {
  getFootprintAnalytics,
  getActivities,
  addActivity,
  updateActivity,
  deleteActivity,
  getToken,
  login,
  logout,
  register,
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  getGoalProgress,
  getMyBadges,
  getMyProfile,
  updateMyProfile,
  getEmissionFactors,
  getMyBenchmark,
  getWeeklyRecommendations,
  getOrganisationSummary,
  getOrganisationEmployees,
  getAllBadges,
  downloadCsrReport,
  requestPasswordReset,
  confirmPasswordReset,
} from "./api.js";

const LazyBlurText = lazy(() => import("./components/animations/BlurText.jsx"));
const LazyCountUp = lazy(() => import("./components/animations/CountUp.jsx"));
const LazyFadeContent = lazy(() => import("./components/animations/FadeContent.jsx"));
const LazySpotlightCard = lazy(() => import("./components/animations/SpotlightCard.jsx"));
const MyFootprintPage = lazy(() => import("./pages/MyFootprintPage.jsx"));
const DashboardCharts = lazy(() => import("./components/charts/DashboardCharts.jsx"));
const OrganisationCharts = lazy(() => import("./components/charts/OrganisationCharts.jsx"));

function FadeContent(props) {
  const { children, className = "", style } = props;
  return (
    <Suspense fallback={<div className={className} style={style}>{children}</div>}>
      <LazyFadeContent {...props} />
    </Suspense>
  );
}

function BlurText(props) {
  const { text, className = "" } = props;
  return (
    <Suspense fallback={<span className={className}>{text}</span>}>
      <LazyBlurText {...props} />
    </Suspense>
  );
}

const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const listOf = (value, keys = []) => {
  if (Array.isArray(value)) return value;
  for (const key of keys) {
    if (Array.isArray(value?.[key])) return value[key];
  }
  return [];
};

const number = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatNumber = (value) =>
  number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });

const goalStatusLabel = (progress) => {
  if (progress?.status === "ACHIEVED") return "Achieved";
  if (progress?.status === "MISSED") return "Missed";
  if (progress?.status === "BASELINE_PENDING") return "Baseline collection";
  if (progress?.onTrack === true) return "On track";
  if (progress?.onTrack === false) return "At risk";
  return "Data needed";
};

const goalCompletionPercentage = (progress) => {
  if (progress?.goalCompletionPct != null) {
    return number(progress.goalCompletionPct);
  }
  const targetReduction = number(progress?.targetReductionPct);
  return progress?.currentReductionPct != null && targetReduction > 0
    ? (number(progress.currentReductionPct) / targetReduction) * 100
    : null;
};

const pretty = (value) =>
  String(value || "").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

function activityCategory(item) {
  const category = String(item?.category || "").toLowerCase();
  return category === "energy" ? "electricity" : category;
}

function passwordChecks(password) {
  return [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "One uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "One lowercase letter", valid: /[a-z]/.test(password) },
    { label: "One number", valid: /\d/.test(password) },
    { label: "One symbol", valid: /[^A-Za-z0-9]/.test(password) },
  ];
}

function PasswordInput({ value, onChange, placeholder, autoComplete = "current-password" }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-wrap">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Enter your password"}
        autoComplete={autoComplete}
        required
      />
      <button className="icon-button password-toggle" type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}>
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

function Brand({ compact = false }) {
  return (
    <a className={`brand ${compact ? "brand-compact" : ""}`} href="#home">
      <span className="brand-mark"><Leaf size={21} strokeWidth={2.5} /></span>
      <span>carbon<span>track</span></span>
    </a>
  );
}

function Header({ user, page, setPage, onLogin, onRegister, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = (next) => {
    setPage(next);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="site-header">
      <div className="nav-shell">
        <Brand />
        <button className="mobile-menu icon-button" onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation">
          {menuOpen ? <X /> : <Menu />}
        </button>
        <nav className={menuOpen ? "nav-links nav-open" : "nav-links"}>
          {!user ? (
            <>
              <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
              <a href="#impact" onClick={() => setMenuOpen(false)}>Your impact</a>
              <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
              <button className="button button-quiet" onClick={onLogin}>Sign in</button>
              <button className="button button-primary nav-cta" onClick={onRegister}>
                Get started <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <>
              {[
                ["dashboard", "Dashboard"],
                ["goals", "Goals"],
                ["leaderboard", "Community"],
                ["organisation", "Organisation"],
                ["badges", "Badges"],
                ["activity", "Log Activity"],
                ["profile", "Profile"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  className={`button ${
                    key === "activity"
                      ? "button-primary nav-log-activity"
                      : page === key
                        ? "button-primary"
                        : "button-quiet"
                  }`}
                  onClick={() => navigate(key)}
                >
                  {key === "activity" && <Plus size={16} />}
                  {label}
                </button>
              ))}
              <button className="button button-quiet" onClick={onLogout}>
                <LogOut size={16} /> Sign out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Brand compact />
        <p>CarbonTrack — Precision carbon intelligence and sustainability analytics.</p>
        <small>© {new Date().getFullYear()} CarbonTrack. All rights reserved.</small>
      </div>
    </footer>
  );
}

function Landing({ onRegister, onLogin }) {
  return (
    <main className="landing-page" id="home">
      {/* HERO */}
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">ENVIRONMENTAL IMPACT INTELLIGENCE</span>
            <div className="hero-heading" role="heading" aria-level="1">
              <BlurText
                text="Measure, reduce, and benchmark your"
                className="hero-heading-line"
                delay={45}
                stepDuration={0.3}
              />
              <BlurText
                text="carbon footprint."
                className="hero-heading-line hero-heading-accent"
                delay={85}
                stepDuration={0.3}
              />
            </div>
            <p className="hero-description">
              Track real-time emissions from transport, energy, food, and shopping. Set verifiable
              reduction goals, benchmark with peers, and empower your organization.
            </p>
            <div className="hero-actions">
              <button className="button button-primary" onClick={onRegister}>
                Start tracking free <ArrowRight size={17} />
              </button>
              <button className="button button-outline" onClick={onLogin}>
                Sign in to dashboard
              </button>
            </div>
          </div>
          <div className="hero-art">
            <div className="art-orbit" />
            <div className="planet" />
            <div className="float-card float-card-top">
              <Sprout size={22} className="text-green-700" />
              <div>
                <b>Track Your Impact. Shape a Greener Future</b>
                <small>Full Analytics &amp; Organisation Platform</small>
              </div>
            </div>
            <div className="float-card float-card-bottom">
              <ShieldCheck size={22} className="text-green-700" />
              <div>
                <b>Zero-Knowledge Privacy</b>
                <small>Anonymous peer benchmarking</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK INTRODUCTION */}
      <FadeContent className="landing-reveal" duration={0.5} once>
        <div className="value-strip" aria-label="CarbonTrack benefits">
          <div className="value-item">
            <div className="value-icon"><Activity size={22} /></div>
            <div><b>Track Activities</b><p>Understand everyday carbon emissions.</p></div>
          </div>
          <div className="value-item">
            <div className="value-icon"><BarChart3 size={22} /></div>
            <div><b>Measure Progress</b><p>See your footprint and improvements over time.</p></div>
          </div>
          <div className="value-item">
            <div className="value-icon"><Sprout size={22} /></div>
            <div><b>Make a Difference</b><p>Take practical steps towards a greener future.</p></div>
          </div>
        </div>
      </FadeContent>

      {/* HOW IT WORKS */}
      <FadeContent className="landing-reveal" duration={0.5} once>
      <section className="section" id="how-it-works">
        <div className="section-heading">
          <span className="eyebrow">A SIMPLE THREE-STEP JOURNEY</span>
          <h2>How <span>CarbonTrack works.</span></h2>
          <p>Start understanding your environmental impact with three simple steps.</p>
        </div>
        <div className="steps-grid">
          <article className="step-card">
            <span className="step-number">01</span>
            <div className="step-icon"><Activity size={25} /></div>
            <h3>Log Your Activities</h3>
            <p>Enter everyday activities such as travelling, using electricity, eating and shopping.</p>
          </article>
          <article className="step-card featured-step">
            <span className="step-number">02</span>
            <div className="step-icon"><BarChart3 size={25} /></div>
            <h3>Calculate Your Footprint</h3>
            <p>CarbonTrack estimates your carbon emissions and presents your environmental footprint.</p>
          </article>
          <article className="step-card">
            <span className="step-number">03</span>
            <div className="step-icon"><Sprout size={25} /></div>
            <h3>Reduce Your Impact</h3>
            <p>Follow recommendations, set goals and build habits that support a sustainable future.</p>
          </article>
        </div>
      </section>
      </FadeContent>

      {/* YOUR IMPACT */}
      <FadeContent className="landing-reveal" duration={0.5} once>
      <section className="impact-section" id="impact">
        <div className="impact-copy">
          <span className="eyebrow eyebrow-light">SMALL ACTIONS. BIGGER CHANGE.</span>
          <h2>Understand your impact. <span>Shape a better future.</span></h2>
          <p>
            Every journey, meal and everyday choice contributes to your carbon footprint.
            CarbonTrack makes those emissions easier to understand so you can make informed,
            sustainable decisions and track your progress over time.
          </p>
          <button className="button button-primary" onClick={onRegister}>
            Start your journey <ArrowRight size={17} />
          </button>
        </div>
        <div className="impact-illustration" aria-hidden="true">
          <div className="impact-sun" />
          <div className="impact-cloud"><Cloud size={48} /></div>
          <div className="hill hill-back" />
          <div className="hill hill-front" />
          <div className="impact-tree tree-left"><span /><i /><b /></div>
          <div className="impact-tree tree-right"><span /><i /><b /></div>
          <div className="tiny-house">
            <div className="roof" />
            <div className="house-body"><span /><span /></div>
          </div>
        </div>
      </section>
      </FadeContent>

      {/* FEATURES */}
      <FadeContent className="landing-reveal" duration={0.5} once>
      <section className="section" id="features">
        <div className="section-heading">
          <span className="eyebrow">WHAT CARBONTRACK OFFERS</span>
          <h2>Everything you need for a <span>greener lifestyle.</span></h2>
          <p>
            CarbonTrack helps individuals and organisations understand, manage and reduce
            their environmental impact through meaningful information and practical tools.
          </p>
        </div>
        <div className="steps-grid">
          <article className="step-card">
            <div className="step-icon"><Activity size={25} /></div>
            <h3>Activity Tracking</h3>
            <p>Record transport, electricity, food and shopping activities to understand where your emissions come from.</p>
          </article>
          <article className="step-card featured-step">
            <div className="step-icon"><BarChart3 size={25} /></div>
            <h3>Footprint Analytics</h3>
            <p>Explore daily, weekly and monthly carbon footprint trends through clear analytics.</p>
          </article>
          <article className="step-card">
            <div className="step-icon"><Target size={25} /></div>
            <h3>Personal Goals</h3>
            <p>Set emission-reduction targets, monitor progress and work towards achievable goals.</p>
          </article>
          <article className="step-card">
            <div className="step-icon"><Award size={25} /></div>
            <h3>Achievements</h3>
            <p>Celebrate sustainable habits and milestones with badges and achievements.</p>
          </article>
          <article className="step-card">
            <div className="step-icon"><Sprout size={25} /></div>
            <h3>Smart Recommendations</h3>
            <p>Discover practical suggestions to reduce emissions from your highest-impact activities.</p>
          </article>
          <article className="step-card">
            <div className="step-icon"><Users size={25} /></div>
            <h3>Community Benchmarking</h3>
            <p>Compare your footprint anonymously and learn how your progress relates to the community.</p>
          </article>
        </div>
      </section>
      </FadeContent>

      {/* GET STARTED */}
      <FadeContent className="landing-reveal" duration={0.5} once>
      <section className="closing-section">
        <div className="closing-icon"><Leaf size={25} /></div>
        <span className="eyebrow">YOUR JOURNEY STARTS HERE</span>
        <h2>Ready to make a <span>difference?</span></h2>
        <p>
          Start tracking your carbon footprint and take your first step towards
          a more sustainable lifestyle.
        </p>
        <button className="button button-primary" onClick={onRegister}>
          Join CarbonTrack <ArrowRight size={17} />
        </button>
        <button className="text-link" onClick={onLogin}>
          Already have an account? Sign in
        </button>
      </section>
      </FadeContent>
    </main>
  );
}

function AuthModal({
  mode,
  setMode,
  onClose,
  onAuthenticated,
  onPasswordResetComplete,
  onCloseRecovery,
  successMessage,
  clearSuccessMessage,
  resetToken,
}) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [recoverySubmitted, setRecoverySubmitted] = useState(false);

  const checks = useMemo(() => passwordChecks(password), [password]);
  const isRegister = mode === "register";
  const isForgot = mode === "forgot";
  const isReset = mode === "reset";
  const isRecovery = isForgot || isReset;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (isForgot) {
      setBusy(true);
      try {
        await requestPasswordReset(email.trim());
        setRecoverySubmitted(true);
      } catch (err) {
        setError(err.message || "Could not request password recovery. Please try again.");
      } finally {
        setBusy(false);
      }
      return;
    }

    if (isReset) {
      if (!resetToken) {
        setError("This reset link is invalid or has expired. Request a new link to continue.");
        return;
      }
      if (!checks.every((item) => item.valid)) {
        setError("Choose a password that meets all the requirements below.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      setBusy(true);
      try {
        await confirmPasswordReset(resetToken, password);
        onPasswordResetComplete();
      } catch (err) {
        setError(err.message || "This reset link is invalid or has expired. Request a new link.");
      } finally {
        setBusy(false);
      }
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const result = isRegister
        ? await register({ username: username.trim(), email: email.trim(), password })
        : await login({ username: username.trim(), password });

      onAuthenticated(result);
    } catch (err) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <section
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onClick={(e) => e.stopPropagation()}
      >
        <aside className="auth-story" aria-label="CarbonTrack sustainability platform">
          <div className="auth-story-brand">
            <Brand compact />
          </div>
          <div className="auth-story-copy">
            <span className="auth-story-kicker">CARBON INTELLIGENCE, MADE PERSONAL</span>
            <h2>Small choices. A lighter footprint.</h2>
            <p>
              Make your everyday impact visible, build better habits, and move
              toward a more sustainable future.
            </p>
          </div>
          <div className="auth-art" aria-hidden="true">
            <div className="auth-art-orbit auth-art-orbit-one" />
            <div className="auth-art-orbit auth-art-orbit-two" />
            <div className="auth-art-globe">
              <Globe2 size={54} strokeWidth={1.1} />
              <span className="auth-art-leaf"><Leaf size={29} strokeWidth={1.5} /></span>
            </div>
            <span className="auth-art-sprout"><Sprout size={24} strokeWidth={1.5} /></span>
            <span className="auth-art-dot auth-art-dot-one" />
            <span className="auth-art-dot auth-art-dot-two" />
          </div>
          <div className="auth-story-note">
            <ShieldCheck size={17} />
            <span>Your sustainability journey, securely yours.</span>
          </div>
        </aside>

        <div className="auth-content">
          <button
            type="button"
            className="icon-button modal-close"
            onClick={onClose}
            aria-label="Close sign-in dialog"
          >
          <X size={18} />
          </button>
          <div className="auth-mobile-brand">
            <Brand compact />
          </div>
          <div className="auth-header">
            <span className="auth-form-eyebrow">
              {isRecovery ? "ACCOUNT RECOVERY" : isRegister ? "GET STARTED" : "WELCOME BACK"}
            </span>
            <h2 id="auth-title">
              {isRecovery ? (isReset ? "Choose a new password" : "Account recovery") :
                isRegister ? "Create account" : "Sign in"}
            </h2>
            <p>{isReset ? "Set a new password to get back to your CarbonTrack account." :
              isForgot ? "Enter the email address associated with your account. We’ll send recovery instructions if an account matches." :
              isRegister ? "Join CarbonTrack and take control of your footprint." :
                "Pick up where your sustainability journey left off."}</p>
          </div>
          {isRecovery && (recoverySubmitted || (isReset && !resetToken)) ? (
            <>
              <div className="auth-unavailable" role="status">
                <span className="auth-unavailable-icon">
                  {recoverySubmitted ? <Mail size={20} aria-hidden="true" /> :
                    <LockKeyhole size={20} aria-hidden="true" />}
                </span>
                <p>{recoverySubmitted
                  ? "If an account exists for that email, recovery instructions will be sent when delivery is configured. In local development, check the backend console."
                  : "This reset link is invalid or has expired. Request a new link to continue."}</p>
              </div>
              <button
                type="button"
                className="button button-primary auth-submit auth-recovery-back"
                onClick={() => {
                  setError("");
                  setRecoverySubmitted(false);
                  onCloseRecovery();
                }}
              >
                <ArrowLeft size={17} />
                Back to Sign In
              </button>
              {isReset && (
                <button
                  type="button"
                  className="auth-forgot-link auth-recovery-retry"
                  onClick={() => {
                    setError("");
                    setRecoverySubmitted(false);
                    setMode("forgot");
                  }}
                >
                  Request a new recovery link
                </button>
              )}
            </>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit} aria-busy={busy}>
              {!isRecovery && successMessage && (
                <div className="form-message form-success" role="status">
                  <CheckCircle2 size={17} />
                  {successMessage}
                </div>
              )}
                {isForgot ? (
                  <label className="field-label">Email address
                    <span className="input-wrap"><Mail size={18} aria-hidden="true" />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com" autoComplete="email" maxLength={255} required /></span>
                  </label>
                ) : isReset ? (
                  <>
                    <label className="field-label">New password
                      <PasswordInput value={password} onChange={setPassword}
                        autoComplete="new-password" placeholder="Choose a new password" />
                    </label>
                    <div className="password-checks">
                      <div className="password-checks-title">Your password should include</div>
                      <div className="checks-grid">{checks.map((item) =>
                        <div key={item.label} className={`password-check ${item.valid ? "valid" : ""}`}>
                          <span>{item.valid ? <Check size={12} /> : <span className="check-dot" />}</span>
                          {item.label}
                        </div>)}</div>
                    </div>
                    <label className="field-label">Confirm new password
                      <PasswordInput value={confirmPassword} onChange={setConfirmPassword}
                        autoComplete="new-password" placeholder="Re-enter your new password" />
                    </label>
                  </>
                ) : (
                  <>
                <label className="field-label">{isRegister ? "Username" : "Username or email"}
                  <span className="input-wrap"><UserRound size={18} aria-hidden="true" />
                    <input value={username} onChange={(e) => setUsername(e.target.value)}
                      placeholder={isRegister ? "Choose a username" : "Enter your username or email"} autoComplete="username"
                      minLength={isRegister ? 3 : undefined} maxLength={isRegister ? 100 : 255} required /></span>
                </label>
                {isRegister && <label className="field-label">Email address
                  <span className="input-wrap"><Mail size={18} aria-hidden="true" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com" autoComplete="email" required /></span>
                </label>}
                <label className="field-label">Password
                  <PasswordInput value={password} onChange={setPassword}
                    autoComplete={isRegister ? "new-password" : "current-password"} />
                </label>
                {isRegister && <>
                  <div className="password-checks">
                    <div className="password-checks-title">Your password should include</div>
                    <div className="checks-grid">{checks.map((item) =>
                      <div key={item.label} className={`password-check ${item.valid ? "valid" : ""}`}>
                        <span>{item.valid ? <Check size={12} /> : <span className="check-dot" />}</span>
                        {item.label}
                      </div>)}</div>
                  </div>
                  <label className="field-label">Confirm password
                    <PasswordInput value={confirmPassword} onChange={setConfirmPassword}
                      autoComplete="new-password" placeholder="Re-enter your password" />
                  </label>
                </>}
                {!isRegister && (
                  <div className="auth-forgot-row">
                    <button
                      type="button"
                      className="auth-forgot-link"
                      onClick={() => {
                        setError("");
                        clearSuccessMessage();
                        setMode("forgot");
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
                  </>
                )}
              {error && <div className="form-message form-error" role="alert"><CircleHelp size={17} />{error}</div>}
              {isReset && error && (
                <button
                  type="button"
                  className="auth-forgot-link auth-recovery-retry"
                  onClick={() => {
                    setError("");
                    setMode("forgot");
                  }}
                >
                  Request a new recovery link
                </button>
              )}
              <button className="button button-primary auth-submit" disabled={busy}>
                {busy ? "Please wait…" : isForgot ? "Send recovery instructions" :
                  isReset ? "Reset password" : isRegister ? "Create account" : "Sign in"}
                {!busy && <ArrowRight size={17} />}
              </button>
            </form>
          )}
          {isRecovery && !recoverySubmitted && (isForgot || resetToken) && (
            <button
              type="button"
              className="button button-primary auth-submit auth-recovery-back"
              onClick={() => {
                setError("");
                onCloseRecovery();
              }}
            >
              <ArrowLeft size={17} />
              Back to Sign In
            </button>
          )}
          {!isRecovery && <div className="auth-switch">
            {isRegister ? <>Already have an account? <button type="button" onClick={() => { setError(""); setMode("login"); }}>Sign in</button></> :
                <>New to CarbonTrack? <button type="button" onClick={() => { setError(""); setMode("register"); }}>Create an account</button></>}
          </div>}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, unit, note, tone = "" }) {
  const numericValue = Number(value);
  const isNumeric = value !== null
    && value !== undefined
    && String(value).trim() !== ""
    && Number.isFinite(numericValue);

  return (
    <Suspense fallback={
      <div className="metric-card">
        <div className={`metric-icon ${tone}`}><Icon size={20} /></div>
        <span className="metric-label">{label}</span>
        <div className="metric-value">{value ?? "—"} <small>{unit || ""}</small></div>
        <p className="metric-note">{note}</p>
      </div>
    }>
      <LazySpotlightCard
        className="metric-card"
        role="article"
        aria-label={label}
        theme="light"
        spotlightColor="#63ad78"
        intensity={0.12}
        spotlightSize={220}
        softness={0.92}
        borderGlow={0.18}
        proximity={64}
        smoothing={0.42}
      >
        <div className={`metric-icon ${tone}`}><Icon size={20} /></div>
        <span className="metric-label">{label}</span>
        <div className="metric-value">
          {isNumeric ? (
            <Suspense fallback={value}>
              <LazyCountUp
                from={0}
                to={numericValue}
                duration={0.8}
                separator=","
                decimals={Number.isInteger(numericValue) ? 0 : 2}
              />
            </Suspense>
          ) : value ?? "—"}
          {" "}<small>{unit || ""}</small>
        </div>
        <p className="metric-note">{note}</p>
      </LazySpotlightCard>
    </Suspense>
  );
}

// -------------------------------------------------------------
// MODULE 1: ACTIVITY LOGGING UI
// -------------------------------------------------------------

const DEFAULT_QUICK_LOGS = {
   transport: [
     { label: "2 km Walking", activityType: "walking", quantity: 2, unit: "km" },
     { label: "5 km Cycling", activityType: "cycling", quantity: 5, unit: "km" },
     { label: "10 km Car Commute", activityType: "car_travel", quantity: 10, unit: "km" },
     { label: "15 km Train Commute", activityType: "train_travel", quantity: 15, unit: "passenger-km" },
     { label: "5 km City Bus", activityType: "bus_travel", quantity: 5, unit: "passenger-km" },
     { label: "500 km Flight", activityType: "flight_travel", quantity: 500, unit: "passenger-km", flightDistanceKm: 500 },
   ],
  energy: [
    { label: "5 kWh Home Power", activityType: "grid_electricity", quantity: 5, unit: "kWh", energySource: "Grid electricity" },
    { label: "15 kWh AC Cooling", activityType: "grid_electricity", quantity: 15, unit: "kWh", energySource: "Air Conditioning" },
  ],
  food: [
    { label: "Plant-based Meal", activityType: "plant_based_food", quantity: 0.4, unit: "kg", mealType: "Lunch", servings: 1 },
    { label: "Chicken Meal", activityType: "chicken", quantity: 0.3, unit: "kg", mealType: "Dinner", servings: 1 },
    { label: "Beef Meal", activityType: "beef", quantity: 0.25, unit: "kg", mealType: "Dinner", servings: 1 },
  ],
  shopping: [
    { label: "Apparel Item", activityType: "clothing", quantity: 0.5, unit: "kg", productCategory: "Clothing", spendAmount: 30, spendCurrency: "USD" },
    { label: "Electronic Gadget", activityType: "electronics", quantity: 1, unit: "item", productCategory: "Electronics", spendAmount: 200, spendCurrency: "USD" },
    { label: "2 kg Books / Paper", activityType: "paper", quantity: 2, unit: "kg", productCategory: "Stationery", spendAmount: 15, spendCurrency: "USD" },
  ],
};

function ActivityForm({ onAdded, initialActivity = null, onCancel }) {
  const [category, setCategory] = useState("transport");
  const [factors, setFactors] = useState([]);
  const [activityType, setActivityType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [logDate, setLogDate] = useState(todayLocal());

  // Category specific details
  const [energySource, setEnergySource] = useState("Grid electricity");
  const [mealType, setMealType] = useState("Lunch");
  const [servings, setServings] = useState("1");
  const [productCategory, setProductCategory] = useState("General");
  const [spendAmount, setSpendAmount] = useState("20");
  const [spendCurrency, setSpendCurrency] = useState("USD");
  const [flightDistanceKm, setFlightDistanceKm] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [factorsLoading, setFactorsLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    if (!initialActivity) return;
    const storedCategory = String(initialActivity.category || "transport").toLowerCase();
    setCategory(storedCategory === "electricity" ? "energy" : storedCategory);
    setActivityType(initialActivity.activityType || "");
    setQuantity(String(initialActivity.quantity ?? ""));
    setUnit(initialActivity.unit || "");
    setLogDate(initialActivity.logDate || todayLocal());
    setEnergySource(initialActivity.energySource || "Grid electricity");
    setMealType(initialActivity.mealType || "Lunch");
    setServings(String(initialActivity.servings ?? "1"));
    setProductCategory(initialActivity.productCategory || "General");
    setSpendAmount(String(initialActivity.spendAmount ?? "20"));
    setSpendCurrency(initialActivity.spendCurrency || "USD");
    setFlightDistanceKm(String(initialActivity.flightDistanceKm ?? ""));
    setError("");
    setSuccess("");
  }, [initialActivity]);

  useEffect(() => {
    let cancelled = false;
    setFactorsLoading(true);
    getActivities()
      .then((data) => {
        if (!cancelled) setRecentActivities(listOf(data, ["content", "activities"]));
      })
      .catch(() => {
        if (!cancelled) setRecentActivities([]);
      });
    getEmissionFactors()
      .then((data) => {
        if (!cancelled) {
          setFactors(Array.isArray(data) ? data : []);
          if (!Array.isArray(data) || data.length === 0) {
            setError("No emission factors are configured by the backend. Activity logging is unavailable until they are added.");
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setFactors([]);
          setError(err.message || "Could not load emission factors. Check the backend connection and try again.");
        }
      })
      .finally(() => { if (!cancelled) setFactorsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const categoryFactors = useMemo(() => {
    return factors.filter((f) => {
      const type = String(f?.activityType || "").toLowerCase();
      if (category === "transport") {
        return (
          type.includes("travel") ||
          type.includes("flight") ||
          type === "walking" ||
          type === "cycling"
        );
      }
      if (category === "energy") return type.includes("electricity") || type.includes("energy");
      if (category === "food") return ["beef", "chicken", "plant_based_food"].includes(type);
      if (category === "shopping") return ["clothing", "electronics", "paper", "plastic"].includes(type);
      return false;
    });
  }, [category, factors]);

  useEffect(() => {
    const current = categoryFactors.find((f) => f.activityType === activityType);
    const next = current || categoryFactors[0];
    if (next) {
      if (activityType !== next.activityType) setActivityType(next.activityType);
      if (unit !== next.unit) setUnit(next.unit);
    } else {
      setActivityType("");
      setUnit("");
    }
  }, [categoryFactors, activityType, unit]);

  const selectedFactor = useMemo(() => {
    return categoryFactors.find((f) => f.activityType === activityType) || categoryFactors[0];
  }, [categoryFactors, activityType]);

  // Rank the user's own saved activities by frequency. If this is a new account,
  // fall back to starter shortcuts that are still validated against backend factors.
  const quickLogs = useMemo(() => {
    const backendCategory = category === "energy" ? "electricity" : category;

    const matching = recentActivities.filter((item) =>
      String(item.category || "").toLowerCase() === backendCategory &&
      categoryFactors.some(
        (factor) =>
          factor.activityType === item.activityType &&
          factor.unit === item.unit
      )
    );

    // Group previously logged activities by type and unit.
    const grouped = new Map();

    matching.forEach((item) => {
      const key = `${item.activityType}::${item.unit}`;
      const current = grouped.get(key) || { count: 0, latest: item };

      current.count += 1;

      if (
        String(item.logDate || "") >
        String(current.latest.logDate || "")
      ) {
        current.latest = item;
      }

      grouped.set(key, current);
    });

    // Recent activities appear first.
    const recentPresets = [...grouped.values()]
      .sort((a, b) => b.count - a.count)
      .map(({ count, latest }) => ({
        ...latest,
        label: pretty(latest.activityType),
        frequency: count,
      }));

    // Add default suggestions even when the user has activity history.
    const defaultPresets = (DEFAULT_QUICK_LOGS[category] || []).filter(
      (preset) =>
        categoryFactors.some(
          (factor) =>
            factor.activityType === preset.activityType &&
            factor.unit === preset.unit
        )
    );

    // Avoid exact duplicate suggestions.
    const combined = [...recentPresets, ...defaultPresets];
    const seen = new Set();

    return combined
      .filter((preset) => {
        const key = `${preset.activityType}::${preset.unit}::${preset.quantity}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 6);
  }, [category, recentActivities, categoryFactors]);

  const isFlight = category === "transport" && activityType === "flight_travel";
  const effectiveQuantity = isFlight
    ? number(flightDistanceKm || quantity)
    : number(quantity);

  const liveCo2e = useMemo(() => {
    if (effectiveQuantity <= 0 || !selectedFactor) return "0.00";
    const factor = number(selectedFactor.kgCo2ePerUnit);
    return (effectiveQuantity * factor).toFixed(2);
  }, [effectiveQuantity, selectedFactor]);

  function changeCategory(cat) {
    setCategory(cat);
    setError("");
    setSuccess("");
    setQuantity("");
    setFlightDistanceKm("");
  }

  function handleSelectType(typeVal) {
    setActivityType(typeVal);
    const match = categoryFactors.find((f) => f.activityType === typeVal);
    if (match) setUnit(match.unit);
    if (typeVal === "flight_travel") {
      setFlightDistanceKm(quantity);
    } else {
      setFlightDistanceKm("");
    }
    setError("");
    setSuccess("");
  }

  function applyQuickLog(item) {
    setActivityType(item.activityType);
    setQuantity(String(item.quantity));
    setUnit(item.unit);
    if (item.energySource) setEnergySource(item.energySource);
    if (item.mealType) setMealType(item.mealType);
    if (item.servings) setServings(String(item.servings));
    if (item.productCategory) setProductCategory(item.productCategory);
    if (item.spendAmount) setSpendAmount(String(item.spendAmount));
    if (item.spendCurrency) setSpendCurrency(item.spendCurrency);
    if (item.activityType === "flight_travel") {
      const distance = String(item.flightDistanceKm ?? item.quantity ?? "");
      setFlightDistanceKm(distance);
      setQuantity(distance);
    } else {
      setFlightDistanceKm("");
    }
    setError("");
    setSuccess(`Preset "${item.label}" populated. Review and click Save.`);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (factorsLoading || !selectedFactor) {
      setError("A backend emission factor is required before this activity can be saved.");
      return;
    }

    const submittedQuantity = isFlight
      ? number(flightDistanceKm || quantity)
      : number(quantity);

    if (!Number.isFinite(submittedQuantity) || submittedQuantity <= 0) {
      setError("Please specify a quantity greater than zero.");
      return;
    }

    if (isFlight && submittedQuantity < 1) {
      setError("Flight distance must be at least 1 km.");
      return;
    }

    if (category === "food" && number(servings) <= 0) {
      setError("Please enter a valid number of servings.");
      return;
    }

    if (category === "shopping" && number(spendAmount) < 0) {
      setError("Spend amount cannot be negative.");
      return;
    }

    const payload = {
      category: category === "energy" ? "electricity" : category,
      activityType,
      quantity: submittedQuantity,
      unit: isFlight ? "passenger-km" : (unit || selectedFactor.unit || "unit"),
      logDate,
    };

    if (isFlight) {
      payload.flightDistanceKm = submittedQuantity;
    }
    if (category === "energy") {
      payload.energySource = energySource.trim() || "Grid electricity";
    }
    if (category === "food") {
      payload.mealType = mealType.trim() || "Meal";
      payload.servings = number(servings) > 0 ? number(servings) : 1;
    }
    if (category === "shopping") {
      payload.productCategory = productCategory.trim() || "General Goods";
      payload.spendAmount = number(spendAmount) >= 0 ? number(spendAmount) : 0;
      payload.spendCurrency = (spendCurrency.trim() || "INR").toUpperCase();
    }

    setBusy(true);
    try {
      if (initialActivity?.id) {
        await updateActivity(initialActivity.id, payload);
      } else {
        await addActivity(payload);
      }
      setSuccess(
        initialActivity
          ? `Updated ${pretty(activityType)} (${liveCo2e} kg CO₂e).`
          : `Successfully logged ${pretty(activityType)} (${liveCo2e} kg CO₂e)!`
      );
      setQuantity("");
      setFlightDistanceKm("");
      try {
        const refreshed = await getActivities();
        setRecentActivities(listOf(refreshed, ["content", "activities"]));
      } catch { /* Keep the current quick-log list if the refresh is temporarily unavailable. */ }
      if (onAdded) await onAdded();
    } catch (err) {
      setError(err.message || "Failed to record activity. Please check your inputs.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="dashboard-panel activity-entry-panel">
      <div className="panel-heading">
        <div>
          <h3>{initialActivity ? "Update lifestyle activity" : "Log lifestyle activity"}</h3>
          <p>Record transport, food, energy, or shopping to update your footprint live</p>
        </div>
        <span className="panel-icon"><Activity size={18} /></span>
      </div>

      {/* Category Tabs */}
      <div className="category-tabs" role="group" aria-label="Activity category">
        {[
          { id: "transport", label: "Transport", icon: CarFront },
          { id: "energy", label: "Electricity", icon: Zap },
          { id: "food", label: "Food", icon: Utensils },
          { id: "shopping", label: "Shopping", icon: ShoppingBag },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`category-tab ${category === id ? "active" : ""}`}
            onClick={() => changeCategory(id)}
            aria-pressed={category === id}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Quick-log carousel: only show presets backed by a factor returned by the API */}
      <div className="quick-log-wrapper">
        <div className="quick-log-heading">
          <div>
            <span className="quick-log-label">QUICK LOG</span>
            <p>Choose a common activity to prefill the form</p>
          </div>
          <span className="quick-log-hint">Scroll horizontally <ArrowRight size={13} /></span>
        </div>
        <div className="quick-log-chips" role="list" aria-label="Frequently logged activities">
          {quickLogs.map((preset, idx) => {
              const factor = categoryFactors.find((item) => item.activityType === preset.activityType);
              const title = preset.label.replace(/\s*\([^)]*\)/g, "");
              return (
                <button
                  key={`${preset.activityType}-${idx}`}
                  type="button"
                  className={`quick-chip ${activityType === preset.activityType && String(quantity) === String(preset.quantity) ? "active" : ""}`}
                  onClick={() => applyQuickLog(preset)}
                  aria-pressed={activityType === preset.activityType && String(quantity) === String(preset.quantity)}
                  role="listitem"
                  title={`Use ${title}`}
                >
                  <ActivityTypeIcon activityType={preset.activityType} />
                  <span className="quick-chip-copy">
                    <b>{title}</b>
                    <small>{preset.quantity} {preset.unit} · {preset.frequency ? `Used ${preset.frequency} times` : `${number(factor?.kgCo2ePerUnit).toFixed(3)} kg CO₂e/${preset.unit}`}</small>
                  </span>
                  <span className="quick-chip-add">+</span>
                </button>
              );
            })}
          {quickLogs.length === 0 && (
            <div className="quick-log-empty">Quick logs will appear when matching emission factors are available.</div>
          )}
        </div>
      </div>

      <form className="activity-form" onSubmit={handleSubmit}>
        <div className="activity-form-grid">
          <label className="field-label">
            Activity Type
            <select
              value={activityType}
              onChange={(e) => handleSelectType(e.target.value)}
              required
            >
              {categoryFactors.map((f) => (
                <option key={f.activityType} value={f.activityType}>
                  {pretty(f.activityType)} ({f.kgCo2ePerUnit} kg CO₂e/{f.unit})
                </option>
              ))}
            </select>
          </label>

          <label className="field-label">
            {isFlight ? "Flight Distance (km)" : `Quantity (${unit || selectedFactor?.unit || "units"})`}
            <input
              type="number"
              min={isFlight ? "1" : "0.0001"}
              step="any"
              value={isFlight ? flightDistanceKm : quantity}
              onChange={(e) => {
                const value = e.target.value;
                setQuantity(value);
                if (isFlight) setFlightDistanceKm(value);
                setError("");
                setSuccess("");
              }}
              placeholder={isFlight ? "Enter flight distance in km" : `Enter amount in ${unit || selectedFactor?.unit || ""}`}
              required
            />
          </label>

          <label className="field-label">
            Activity Date
            <input
              type="date"
              value={logDate}
              max={todayLocal()}
              onChange={(e) => setLogDate(e.target.value)}
              required
            />
          </label>

          {/* Dynamic Category Specific Inputs */}
          {category === "energy" && (
            <label className="field-label">
              Energy Source
              <input
                type="text"
                value={energySource}
                onChange={(e) => setEnergySource(e.target.value)}
                placeholder="e.g. Grid electricity, Solar backup"
                required
              />
            </label>
          )}

          {category === "food" && (
            <>
              <label className="field-label">
                Meal Type
                <input
                  type="text"
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  placeholder="e.g. Lunch, Dinner"
                  required
                />
              </label>
              <label className="field-label">
                Servings
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  required
                />
              </label>
            </>
          )}

          {category === "shopping" && (
            <>
              <label className="field-label">
                Product Category
                <input
                  type="text"
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  placeholder="e.g. Clothing, Electronics"
                  required
                />
              </label>
              <label className="field-label">
                Spend Amount
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={spendAmount}
                  onChange={(e) => setSpendAmount(e.target.value)}
                  required
                />
              </label>
              <label className="field-label">
                Currency
                <select
                  value={spendCurrency}
                  onChange={(e) => setSpendCurrency(e.target.value)}
                  required
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </label>
            </>
          )}
        </div>

        {/* Live CO₂e Preview Box */}
        <div className="live-preview-box">
          <div className="live-preview-info">
            <Leaf size={22} className="text-green-700" />
            <div>
              <b style={{ fontSize: 13, color: "var(--green-950)" }}>Estimated Carbon Footprint</b>
              <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>
                {effectiveQuantity || 0} {isFlight ? "passenger-km" : (unit || selectedFactor?.unit || "units")} × {selectedFactor?.kgCo2ePerUnit || 0} kg CO₂e/{selectedFactor?.unit || "unit"}
                {selectedFactor?.source ? ` · Source: ${selectedFactor.source}` : " · Source not provided by backend"}
                {selectedFactor?.effectiveDate ? ` · Effective: ${selectedFactor.effectiveDate}` : ""}
              </p>
            </div>
          </div>
          <div className="live-preview-number">
            {liveCo2e} <small style={{ fontSize: 13, fontWeight: 500 }}>kg CO₂e</small>
          </div>
        </div>

        {factorsLoading && <div className="form-message">Loading backend emission factors…</div>}
        {!factorsLoading && categoryFactors.length === 0 && <div className="form-message form-error"><CircleHelp size={16} />No backend emission factors are configured for this category.</div>}
        {error && <div className="form-message form-error"><CircleHelp size={16} /> {error}</div>}
        {success && <div className="form-message form-success"><CheckCircle2 size={16} /> {success}</div>}

        <div className="activity-form-actions">
          <button className="button button-primary activity-submit" disabled={busy || factorsLoading || !selectedFactor}>
            {busy ? "Saving activity…" : <><CheckCircle2 size={17} /> {initialActivity ? "Update activity" : "Save activity"}</>}
          </button>
          {initialActivity && onCancel && (
            <button className="button button-outline" type="button" onClick={onCancel} disabled={busy}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

function ActivityHistory({ activities, loading, error, setPage}) {
  return (
    <section className="dashboard-panel activity-history-panel">
     <div className="panel-heading">
       <div>
         <h3>Recent Activities</h3>
         <p>Your latest recorded lifestyle activities</p>
       </div>

       <button
         type="button"
         className="button button-outline"
         onClick={() => setPage("activity")}
       >
         View all <ArrowRight size={15} />
       </button>
     </div>
      {loading ? <div className="empty-state">Loading activities…</div> :
        error ? <div className="empty-state"><b>Activities could not be loaded</b><p>{error}</p></div> :
          activities.length === 0 ? <div className="empty-state">
            <span className="empty-state-icon"><Sprout size={24} /></span>
            <b>No activities recorded yet</b><p>Record your first activity from the Activity Log.</p>
          </div> :
            <div className="activity-history-list">
              {activities.slice(0, 10).map((item, index) => (
                <div className="activity-history-item" key={item.id ?? index}>
                  <ActivityTypeIcon activityType={item.activityType} />
                  <div className="activity-history-details">
                    <b>{pretty(item.activityType || item.category || "Activity")}</b>
                    <small>{item.logDate || "Date not provided"} · {item.quantity ?? "—"} {item.unit || ""}</small>
                  </div>
                  <strong>{item.co2eKg == null ? "—" : `${formatNumber(item.co2eKg)} kg`}
                    <small>CO₂e</small></strong>
                </div>
              ))}
            </div>}
    </section>
  );
}

function ActivityManagementPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function loadActivities() {
    setLoading(true);
    setError("");
    try {
      const result = await getActivities();
      setActivities(listOf(result, ["content", "activities"]));
    } catch (err) {
      setError(err.message || "Could not load your activities.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadActivities(); }, []);

  async function saveComplete() {
    setEditingActivity(null);
    setShowForm(false);
    await loadActivities();
  }

  async function removeActivity(activity) {
    if (!window.confirm(`Delete this ${pretty(activity.activityType)} activity?`)) return;
    setBusyId(activity.id);
    setError("");
    try {
      await deleteActivity(activity.id);
      setActivities((current) => current.filter((item) => item.id !== activity.id));
    } catch (err) {
      setError(err.message || "Could not delete the activity.");
    } finally {
      setBusyId(null);
    }
  }

  const visibleActivities = activities
    .filter((item) => filter === "all" || activityCategory(item) === filter)
    .filter((item) => {
      const query = search.trim().toLowerCase();
      return !query || `${item.activityType} ${item.category} ${item.logDate}`.toLowerCase().includes(query);
    })
    .sort((a, b) => String(b.logDate || "").localeCompare(String(a.logDate || "")));

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <PageHeading eyebrow="ACTIVITY MANAGEMENT" title="Activity Log"
          description="Review, filter, and update the activities behind your footprint analytics."
          icon={Activity} />

        <div className="activity-manager-toolbar">
          <label className="activity-search">
            <span className="sr-only">Search activities</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)}
              placeholder="Search activities" />
          </label>
          <label className="activity-filter">
            <span className="sr-only">Filter by category</span>
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">All categories</option>
              <option value="transport">Transport</option>
              <option value="electricity">Electricity</option>
              <option value="food">Food</option>
              <option value="shopping">Shopping</option>
            </select>
          </label>
          <button className="button button-primary" type="button" onClick={() => {
            setEditingActivity(null);
            setShowForm((open) => !open);
          }}>
            <Plus size={16} /> {showForm && !editingActivity ? "Close form" : "Log Activity"}
          </button>
        </div>

        {(showForm || editingActivity) && (
          <ActivityForm
            initialActivity={editingActivity}
            onAdded={saveComplete}
            onCancel={() => { setEditingActivity(null); setShowForm(false); }}
          />
        )}

        {error && <div className="dashboard-error"><CircleHelp size={18} /><div>{error}</div></div>}
        {loading ? <div className="empty-state">Loading your activities…</div> :
          visibleActivities.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon"><Sprout size={24} /></span>
              <b>{activities.length ? "No activities match this filter" : "No activities recorded yet"}</b>
              <p>{activities.length ? "Try a different search or category." : "Log an activity to start building your footprint history."}</p>
            </div>
          ) : (
            <div className="activity-management-list">
              {visibleActivities.map((item) => (
                <article className="activity-management-card" key={item.id}>
                  <ActivityTypeIcon activityType={item.activityType} />
                  <div className="activity-management-details">
                    <span className={`activity-category-label category-${activityCategory(item)}`}>
                      {pretty(activityCategory(item))}
                    </span>
                    <h3>{pretty(item.activityType || "Activity")}</h3>
                    <p>{item.logDate || "Date not provided"} · {item.quantity ?? "—"} {item.unit || ""}</p>
                  </div>
                  <strong className="activity-management-emissions">
                    {item.co2eKg == null ? "—" : formatNumber(item.co2eKg)}
                    <small>kg CO₂e</small>
                  </strong>
                  <div className="activity-management-actions">
                    <button className="button button-outline" type="button" aria-label="Edit activity"
                      onClick={() => { setEditingActivity(item); setShowForm(true); }}>
                      <Pencil size={15} /> Edit
                    </button>
                    <button className="button button-outline danger-button" type="button" aria-label="Delete activity"
                      disabled={busyId === item.id} onClick={() => removeActivity(item)}>
                      <Trash2 size={15} /> {busyId === item.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
      </div>
    </main>
  );
}

// -------------------------------------------------------------
// MODULE 3: GOAL WIDGET
// -------------------------------------------------------------

function GoalWidget({ goals, setPage }) {
  const [activeGoal, setActiveGoal] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ringSweep, setRingSweep] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setRingSweep(1), 80);
    return () => clearTimeout(t);
  }, [progress]);

  useEffect(() => {
    const active = (goals || []).find((g) => g.status === "ACTIVE") || (goals || [])[0];
    setActiveGoal(active || null);
    setProgress(null);
    setError("");
    if (active) {
      setLoading(true);
      getGoalProgress(active.id)
        .then((res) => setProgress(res))
        .catch((err) => {
          setProgress(null);
          setError(err.message || "Could not load goal progress.");
        })
        .finally(() => setLoading(false));
    } else {
      setProgress(null);
      setLoading(false);
    }
  }, [goals]);

  if (!activeGoal) {
    return (
      <div className="goal-widget-container">
        <div className="panel-heading">
          <div>
            <h3>Active reduction goal</h3>
            <p>Set a reduction target to measure progress and earn badges</p>
          </div>
          <Target size={20} />
        </div>
        <div className="empty-state">
          <b>No active goal currently set</b>
          <p>Create a reduction target to start tracking your daily progress and projections.</p>
          <button className="button button-primary" style={{ marginTop: 12 }} onClick={() => setPage("goals")}>
            <Plus size={16} /> Create Goal
          </button>
        </div>
      </div>
    );
  }

  if (loading || !progress) {
    return (
      <div className="goal-widget-container">
        <div className="panel-heading">
          <div>
            <h3>Active reduction goal</h3>
            <p>{loading ? "Loading goal progress…" : error || "Goal progress is currently unavailable."}</p>
          </div>
          <Target size={20} />
        </div>
      </div>
    );
  }

  if (progress.status === "BASELINE_PENDING") {
    const parseLocalDate = (value) => {
      if (!value) return null;
      const parts = String(value).slice(0, 10).split("-").map(Number);
      return parts.length === 3 && parts.every((n) => Number.isFinite(n))
        ? new Date(parts[0], parts[1] - 1, parts[2])
        : null;
    };
    const baseStart = parseLocalDate(progress.baselineStartDate || activeGoal.startDate);
    const baseEnd = parseLocalDate(progress.baselineEndDate);
    const todayDate = parseLocalDate(todayLocal());
    let baselineDay = null;
    let baselineTotalDays = null;
    let baselinePct = 0;
    if (baseStart && baseEnd && todayDate) {
      baselineTotalDays = Math.max(1, Math.round((baseEnd - baseStart) / 86400000) + 1);
      baselineDay = Math.min(baselineTotalDays, Math.max(1, Math.floor((todayDate - baseStart) / 86400000) + 1));
      baselinePct = Math.round((baselineDay / baselineTotalDays) * 100);
    }
    return (
      <div className="goal-widget-container goal-baseline-pending">
        <div className="panel-heading">
          <div>
            <h3>Building your emissions baseline</h3>
            <p>Log activities during the seven-day baseline period before reduction progress begins.</p>
          </div>
          <span className="pill-tag goal-status-baseline_pending">Baseline collection</span>
        </div>
        <p className="goal-baseline-dates">
          {progress.baselineStartDate || activeGoal.startDate} – {progress.baselineEndDate || "7-day period"}
        </p>
        {baselineDay !== null && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
              <span>Baseline progress: <b>Day {baselineDay} of {baselineTotalDays}</b></span>
              <span>{baselinePct}%</span>
            </div>
            <div className="goal-progress-track" role="progressbar"
              aria-label="Baseline collection progress" aria-valuemin={0} aria-valuemax={100}
              aria-valuenow={baselinePct}>
              <span style={{ width: `${baselinePct}%`, transition: "width 0.8s ease" }} />
            </div>
            <p className="goal-budget-note">
              Log your normal activities every day — a complete week makes your reduction target accurate.
            </p>
          </div>
        )}
        <div className="goal-widget-metrics">
          <div className="goal-metric-pill"><small>Baseline emissions</small><b>Collecting</b></div>
          <div className="goal-metric-pill"><small>Current emissions</small><b>—</b></div>
          <div className="goal-metric-pill"><small>Target emissions</small><b>Available after baseline</b></div>
          <div className="goal-metric-pill"><small>Actual reduction</small><b>—</b></div>
          <div className="goal-metric-pill"><small>Goal completion</small><b>—</b></div>
          <div className="goal-metric-pill"><small>Days remaining</small><b>Not started</b></div>
          <div className="goal-metric-pill"><small>Daily reduction required</small><b>Available after baseline</b></div>
        </div>
      </div>
    );
  }

  const current = progress.currentFootprintKg == null ? null : number(progress.currentFootprintKg);
  const target = progress.targetFootprintKg == null ? null : number(progress.targetFootprintKg);
  const baseline = progress.baselineFootprintKg == null ? null : number(progress.baselineFootprintKg);
  const projected = progress.projectedFootprintKg == null ? null : number(progress.projectedFootprintKg);
  const remainingDays = Math.max(0, number(progress.daysRemaining));
  const reductionPct = progress.currentReductionPct != null ? number(progress.currentReductionPct) : null;
  const completionPct = goalCompletionPercentage(progress);
  const targetPct = number(progress.targetReductionPct);
  const remainingBudget = target == null || current == null ? null : Math.max(0, target - current);
  const dailyReductionRequired =
    projected == null || target == null || remainingDays <= 0
      ? null
      : Math.max(0, projected - target) / remainingDays;
  const completionWidth = completionPct == null
    ? 0
    : Math.min(100, Math.max(0, completionPct));
  const statusLabel = goalStatusLabel(progress);

  return (
    <div className="goal-widget-container">
      <div className="panel-heading">
        <div>
          <h3>Goal: {targetPct}% Carbon Reduction</h3>
          <p>{progress.startDate} to {progress.endDate}</p>
        </div>
        <span className={`pill-tag goal-status-${String(progress.status || "").toLowerCase()}`}>
          {statusLabel}
        </span>
      </div>

      <div className="goal-widget-metrics">
        <div className="goal-metric-pill">
          <small>Baseline Emissions</small>
          <b>{baseline == null ? "—" : formatNumber(baseline)} <small>{baseline == null ? "" : "kg CO₂e"}</small></b>
        </div>
        <div className="goal-metric-pill">
          <small>Current Emissions</small>
          <b>{current == null ? "—" : formatNumber(current)} <small>kg CO₂e</small></b>
        </div>
        <div className="goal-metric-pill">
          <small>Target Ceiling</small>
          <b>{target == null ? "—" : formatNumber(target)} <small>kg CO₂e</small></b>
        </div>
        <div className="goal-metric-pill">
          <small>Actual Reduction</small>
          <b style={{ color: reductionPct != null && reductionPct >= targetPct ? "#21613e" : "#174631" }}>
            {reductionPct == null ? "—" : `${reductionPct.toFixed(1)}%`} <small>/ {targetPct}%</small>
          </b>
        </div>
        <div className="goal-metric-pill">
          <small>Goal Completion</small>
          <b>{completionPct == null ? "—" : `${completionPct.toFixed(1)}%`}</b>
        </div>
        <div className="goal-metric-pill">
          <small>Days Remaining</small>
          <b>{progress.status === "BASELINE_PENDING" ? "Not started" : remainingDays}</b>
        </div>
        <div className="goal-metric-pill">
          <small>Daily Reduction Required</small>
          <b style={{ color: dailyReductionRequired != null && dailyReductionRequired > 0 ? "#b45309" : "#21613e" }}>
            {dailyReductionRequired == null ? "—" : formatNumber(dailyReductionRequired)} <small>{dailyReductionRequired == null ? "" : "kg CO₂e / day"}</small>
          </b>
        </div>
      </div>

      <div style={{ marginTop: 10, display: "flex", gap: 16, alignItems: "center" }}>
        <svg width="76" height="76" viewBox="0 0 76 76" role="img" style={{ flexShrink: 0 }}
          aria-label={`Goal completion ${completionPct == null ? "not available" : `${completionPct.toFixed(0)} percent`}`}>
          <circle cx="38" cy="38" r="30" fill="none" stroke="#e6eee5" strokeWidth="8" />
          <circle cx="38" cy="38" r="30" fill="none"
            stroke={progress.onTrack === false ? "#d97706" : "#21613e"}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 30}
            strokeDashoffset={(2 * Math.PI * 30) * (1 - (completionWidth * ringSweep) / 100)}
            transform="rotate(-90 38 38)"
            style={{ transition: "stroke-dashoffset 0.9s ease" }}
          />
          <text x="38" y="37" textAnchor="middle" fontSize="15" fontWeight="700" fill="#174631">
            {completionPct == null ? "—" : `${completionPct.toFixed(0)}%`}
          </text>
          <text x="38" y="51" textAnchor="middle" fontSize="8.5" fill="#718177">complete</text>
        </svg>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
            <span>Goal completion: {completionPct == null ? "—" : `${completionPct.toFixed(1)}% of target`}</span>
            <span>Projected Footprint: <b>{projected == null ? "—" : `${formatNumber(projected)} kg CO₂e`}</b></span>
          </div>
          <div className="goal-progress-track" role="progressbar"
            aria-label="Goal completion" aria-valuemin={0} aria-valuemax={100}
            aria-valuenow={completionWidth}>
            <span className={progress.onTrack === false ? "goal-progress-at-risk" : ""}
              style={{ width: `${completionWidth}%` }} />
          </div>
          <p className="goal-budget-note">
            {remainingBudget == null
              ? "Remaining emissions budget: —"
              : `Remaining emissions budget: ${formatNumber(remainingBudget)} kg CO₂e`}
            {" · "}{remainingDays} days remaining
            {dailyReductionRequired != null && (dailyReductionRequired > 0
              ? ` · Cut about ${formatNumber(dailyReductionRequired)} kg CO₂e per day to finish on target`
              : " · On pace — no daily reduction needed")}
          </p>
        </div>
      </div>

      {progress.alerts && progress.alerts.length > 0 && (
        <div style={{ fontSize: 12, color: "#854d0e", background: "#fefce8", padding: "8px 12px", borderRadius: 8 }}>
          {progress.alerts[0]}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// MODULE 2: PERSONAL SUSTAINABILITY DASHBOARD WITH RECHARTS
// -------------------------------------------------------------

function buildWeeklyComparisonData(activities, timeline) {
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7; // Mon = 0, Sun = 6

  const currentMon = new Date(today);
  currentMon.setDate(today.getDate() - dayOfWeek);

  const prevMon = new Date(currentMon);
  prevMon.setDate(currentMon.getDate() - 7);

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dateMap = {};

  if (Array.isArray(activities)) {
    activities.forEach((a) => {
      if (a.logDate) {
        dateMap[a.logDate] = (dateMap[a.logDate] || 0) + number(a.co2eKg);
      }
    });
  }

  const result = [];
  for (let i = 0; i < 7; i++) {
    const curDate = new Date(currentMon);
    curDate.setDate(currentMon.getDate() + i);
    const curKey = `${curDate.getFullYear()}-${String(curDate.getMonth() + 1).padStart(2, "0")}-${String(curDate.getDate()).padStart(2, "0")}`;

    const prevDate = new Date(prevMon);
    prevDate.setDate(prevMon.getDate() + i);
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-${String(prevDate.getDate()).padStart(2, "0")}`;

    result.push({
      day: dayNames[i],
      "Current Week": Number((dateMap[curKey] || 0).toFixed(2)),
      "Previous Week": Number((dateMap[prevKey] || 0).toFixed(2)),
    });
  }
  return result;
}

function buildMonthlyCumulativeData(activities, goalTarget) {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const currentDay = today.getDate();

  const dateMap = {};
  if (Array.isArray(activities)) {
    activities.forEach((a) => {
      if (a.logDate) {
        dateMap[a.logDate] = (dateMap[a.logDate] || 0) + number(a.co2eKg);
      }
    });
  }

  const keyFor = (dateObj) =>
    `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;

  // Recent trend: average daily emissions over the last 7 days (missing days count as 0)
  let last7Total = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    last7Total += dateMap[keyFor(d)] || 0;
  }
  const recentDailyAverage = last7Total / 7;

  const dailyBudget = Number.isFinite(Number(goalTarget)) && Number(goalTarget) > 0
    ? Number(goalTarget) / daysInMonth
    : null;

  let cumulativeActual = 0;
  let projectedBase = null;
  const result = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(today.getFullYear(), today.getMonth(), d);
    const dateKey = keyFor(dateObj);
    const targetCeiling = dailyBudget === null ? null : Number((dailyBudget * d).toFixed(2));

    if (d <= currentDay) {
      const dailyVal = dateMap[dateKey] || 0;
      cumulativeActual += dailyVal;
      if (d === currentDay) projectedBase = cumulativeActual;
      result.push({
        day: `${d}`,
        "Cumulative Actual": Number(cumulativeActual.toFixed(2)),
        ...(d === currentDay ? { "Projected Cumulative": Number(cumulativeActual.toFixed(2)) } : {}),
        ...(targetCeiling !== null ? { "Target Ceiling": targetCeiling } : {}),
      });
    } else {
      result.push({
        day: `${d}`,
        ...(projectedBase !== null ? { "Projected Cumulative": Number((projectedBase + recentDailyAverage * (d - currentDay)).toFixed(2)) } : {}),
        ...(targetCeiling !== null ? { "Target Ceiling": targetCeiling } : {}),
      });
    }
  }
  return result;
}

function Dashboard({ user, setPage }) {
  const [period, setPeriod] = useState("monthly");
  const [analytics, setAnalytics] = useState(null);
  const [activities, setActivities] = useState([]);
  const [goals, setGoals] = useState([]);
  const [activeGoalProgress, setActiveGoalProgress] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationError, setRecommendationError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refreshAll() {
    setLoading(true);
    setError("");

    try {
      const [analyticsRes, activitiesRes, goalsRes, recommendationsRes] = await Promise.allSettled([
        getFootprintAnalytics(period),
        getActivities(),
        getGoals(),
        getWeeklyRecommendations(),
      ]);

      if (analyticsRes.status === "fulfilled") setAnalytics(analyticsRes.value);
      else setError(analyticsRes.reason?.message || "Could not load analytics.");

      if (activitiesRes.status === "fulfilled") {
        setActivities(listOf(activitiesRes.value, ["content", "activities"]));
      }

      if (goalsRes.status === "fulfilled") {
        const loadedGoals = listOf(goalsRes.value, ["content", "goals"]);
        setGoals(loadedGoals);
        const currentGoal = loadedGoals.find((g) => g.status === "ACTIVE");
        if (currentGoal?.id) {
          try { setActiveGoalProgress(await getGoalProgress(currentGoal.id)); }
          catch { setActiveGoalProgress(null); }
        } else {
          setActiveGoalProgress(null);
        }
      }
      if (recommendationsRes.status === "fulfilled") {
        setRecommendations(listOf(recommendationsRes.value, ["recommendations"]));
        setRecommendationError("");
      } else {
        setRecommendations([]);
        setRecommendationError(recommendationsRes.reason?.message || "Could not load recommendations.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll();
  }, [period]);

  // Today's footprint calculation
  const todayKey = todayLocal();
  const todayFootprint = useMemo(() => {
    return activities
      .filter((a) => a.logDate === todayKey)
      .reduce((sum, item) => sum + number(item.co2eKg), 0);
  }, [activities, todayKey]);

  const categories = Array.isArray(analytics?.categoryTotals) ? analytics.categoryTotals : [];
  const total = analytics?.totalEmissionsKg;

  // Pie chart data
  const pieData = useMemo(() => {
    return categories.map((c) => ({
      name: pretty(c.category),
      value: number(c.totalEmissionsKg),
      categoryKey: c.category.toLowerCase(),
    }));
  }, [categories]);

  // Weekly comparison data (handling missing dates correctly)
  const weeklyData = useMemo(() => {
    return buildWeeklyComparisonData(activities, analytics?.timeline);
  }, [activities, analytics]);

  // Monthly cumulative data vs target
  const activeGoal = (goals || []).find((g) => g.status === "ACTIVE");
  const monthlyTarget = useMemo(() => {
    const periodDays = Number(activeGoalProgress?.periodDays);
    const targetFootprint = Number(activeGoalProgress?.targetFootprintKg);
    if (!activeGoal || !Number.isFinite(periodDays) || periodDays <= 0 || !Number.isFinite(targetFootprint) || targetFootprint <= 0) return null;
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    return (targetFootprint / periodDays) * daysInMonth;
  }, [activeGoal, activeGoalProgress]);
  const monthlyCumulativeData = useMemo(() => {
    return buildMonthlyCumulativeData(activities, monthlyTarget);
  }, [activities, monthlyTarget]);

  const projectedMonthEnd = monthlyCumulativeData.length
    ? monthlyCumulativeData[monthlyCumulativeData.length - 1]["Projected Cumulative"]
    : null;

  const assistantData = {
    username: user?.username,
    todayFootprint,
    totalKg: total == null ? null : number(total),
    period,
    categories,
    activities,
    goals,
    goalProgress: activeGoalProgress,
    recommendations,
    weeklyData,
    projectedMonthEnd,
    streak: computeLoggingStreak(activities),
  };

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <div className="dashboard-topline">
          <div>
            <span className="eyebrow">YOUR PERSONAL SUSTAINABILITY DASHBOARD</span>
            <h1>Welcome, <span>{user?.username || "there"}.</span></h1>
            <p>Your carbon footprint, reduction goals, and sustainability progress at a glance.</p>
          </div>
        </div>

        {/* Dashboard Top Metrics */}
        <FadeContent className="dashboard-reveal" duration={0.45} once>
        <div className="metrics-grid">
          <MetricCard
            icon={Leaf}
            label="Today's Footprint"
            value={todayFootprint}
            unit="kg CO₂e"
            note="Logged lifestyle activities for today"
            tone="mint"
          />
          <MetricCard
            icon={Globe2}
            label={`Total Footprint (${period})`}
            value={loading ? "…" : total == null ? "—" : number(total)}
            unit="kg CO₂e"
            note={`Sum of emissions for ${period} period`}
          />
          <MetricCard
            icon={Activity}
            label="Tracked Categories"
            value={loading ? "…" : categories.length}
            note="Active lifestyle domains"
            tone="gold"
          />
        </div>
        </FadeContent>

        <FadeContent className="dashboard-reveal" duration={0.45} once>
          <WeekHighlights activities={activities} weeklyData={weeklyData} />
        </FadeContent>

        {/* Goal Widget */}
        <FadeContent className="dashboard-reveal" duration={0.45} once>
          <GoalWidget goals={goals} setPage={setPage} />
        </FadeContent>

        {/* Visual Analytics Charts Grid */}
        <FadeContent className="dashboard-reveal" duration={0.45} once>
          <Suspense fallback={<div className="charts-grid-2">
            <div className="chart-card empty-state">Loading category and weekly charts…</div>
            <div className="chart-card" aria-hidden="true" />
          </div>}>
            <DashboardCharts
              pieData={pieData}
              weeklyData={weeklyData}
              monthlyData={monthlyCumulativeData}
              monthlyTarget={monthlyTarget}
            />
          </Suspense>
        </FadeContent>

        <FadeContent className="dashboard-reveal" duration={0.45} once>
          <CategoryShareCard categories={categories} />
        </FadeContent>

        <FadeContent className="dashboard-reveal" duration={0.45} once>
          <RotatingTipBanner recommendations={recommendations} />
        </FadeContent>

        <FadeContent className="dashboard-reveal" duration={0.45} once>
          <RecommendationsPanel recommendations={recommendations} error={recommendationError} />
        </FadeContent>

        <FadeContent className="dashboard-reveal" duration={0.45} once>
          <ImpactEquivalentsCard totalKg={total == null ? null : number(total)} />
        </FadeContent>

        {/* Recent Activity Summary */}
        <FadeContent className="dashboard-reveal" duration={0.45} once>
        <ActivityHistory
          activities={activities}
          loading={loading}
          error={error}
          setPage={setPage}
        />
        </FadeContent>

        <AssistantChat data={assistantData} />
      </div>
    </main>
  );
}

function RecommendationsPanel({ recommendations, error }) {
  return (
    <section className="chart-card recommendations-panel">
      <div className="chart-card-header">
        <div>
          <h3>Personalized next steps</h3>
          <p>Suggestions based on your highest-emitting activity types over the past 30 days.</p>
        </div>
        <Sparkles size={19} className="text-green-700" />
      </div>
      {error ? (
        <div className="dashboard-error"><CircleHelp size={18} /><div>{error}</div></div>
      ) : recommendations.length === 0 ? (
        <div className="empty-state">Log more activities to receive recommendations tailored to your footprint.</div>
      ) : (
        <div className="recommendation-grid">
          {recommendations.map((item) => (
            <article className="recommendation-card" key={item.activityType}>
              <div className="recommendation-card-heading">
                <b>{pretty(item.activityType)}</b>
                <span>{formatNumber(item.totalEmissionsKg)} kg CO₂e</span>
              </div>
              <ul>
                {(item.recommendations || []).map((recommendation) => (
                  <li key={recommendation}>{recommendation}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ImpactEquivalentsCard({ totalKg }) {
  if (totalKg == null || !(totalKg > 0)) return null;
  const trees = totalKg / 21;
  const carKm = totalKg / 0.17;
  return (
    <section className="chart-card recommendations-panel">
      <div className="chart-card-header">
        <div>
          <h3>Your impact in real life</h3>
          <p>What this period's footprint means in everyday terms.</p>
        </div>
        <Sprout size={19} className="text-green-700" />
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 200px", display: "flex", gap: 12, alignItems: "center", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "14px 16px" }}>
          <Sprout size={26} style={{ color: "#21613e", flexShrink: 0 }} />
          <div>
            <b style={{ fontSize: 20, color: "#174631" }}>{formatNumber(trees)} trees</b>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>would need a full year to absorb this much CO₂</p>
          </div>
        </div>
        <div style={{ flex: "1 1 200px", display: "flex", gap: 12, alignItems: "center", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "14px 16px" }}>
          <CarFront size={26} style={{ color: "#0284c7", flexShrink: 0 }} />
          <div>
            <b style={{ fontSize: 20, color: "#174631" }}>{formatNumber(Math.round(carKm))} km</b>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>of petrol-car driving produces the same emissions</p>
          </div>
        </div>
      </div>
      <p style={{ margin: "10px 0 0", fontSize: 11, color: "var(--muted)" }}>
        Estimates: one tree absorbs ≈ 21 kg CO₂ per year · petrol car factor 0.17 kg CO₂e/km (from the CarbonTrack emission factors).
      </p>
    </section>
  );
}

function computeLoggingStreak(activities) {
  const days = new Set((activities || []).map((a) => a.logDate).filter(Boolean));
  const keyOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const cursor = new Date();
  if (!days.has(keyOf(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(keyOf(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function WeekHighlights({ activities, weeklyData }) {
  if (!activities || activities.length === 0) return null;

  const streak = computeLoggingStreak(activities);
  const loggedDays = new Set(activities.map((a) => a.logDate).filter(Boolean));
  const keyOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekDots = dayNames.map((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { name, active: loggedDays.has(keyOf(d)), isToday: keyOf(d) === keyOf(today) };
  });

  const currentWeek = (weeklyData || []).reduce((s, d) => s + number(d["Current Week"]), 0);
  const previousWeek = (weeklyData || []).reduce((s, d) => s + number(d["Previous Week"]), 0);
  const pctChange = previousWeek > 0 ? ((currentWeek - previousWeek) / previousWeek) * 100 : null;

  return (
    <section className="chart-card recommendations-panel">
      <div className="chart-card-header">
        <div>
          <h3>Your week at a glance</h3>
          <p>Logging habit and this week's footprint versus last week.</p>
        </div>
        <span className="panel-icon"><CalendarDays size={18} /></span>
      </div>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Flame size={34} style={{ color: streak > 0 ? "#e8590c" : "#94a3b8" }} />
          <div>
            <b style={{ fontSize: 22, color: "#174631" }}>{streak} {streak === 1 ? "day" : "days"}</b>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
              logging streak{loggedDays.has(keyOf(today)) ? " — logged today, keep it going" : streak > 0 ? " — log today to keep it alive" : " — log today to start one"}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 7 }}>
          {weekDots.map((d) => (
            <span key={d.name} style={{ textAlign: "center", fontSize: 9, color: "var(--muted)" }}>
              <span style={{
                display: "block", width: 16, height: 16, borderRadius: "50%", margin: "0 auto 3px",
                background: d.active ? "#409461" : "#ffffff",
                border: d.isToday ? "2px solid #174631" : "2px solid #cfdccf",
              }} />
              {d.name}
            </span>
          ))}
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
            This week <b style={{ color: "#174631", fontSize: 15 }}>{formatNumber(currentWeek)} kg</b>
            {" · "}Last week <b style={{ color: "#174631", fontSize: 15 }}>{formatNumber(previousWeek)} kg</b>
          </p>
          {previousWeek === 0 && currentWeek > 0 ? (
            <span className="pill-tag" style={{ background: "#fdf0d3", color: "#92600a", marginTop: 6, display: "inline-block" }}>
              First active week — you're getting started
            </span>
          ) : pctChange != null && pctChange < 0 ? (
            <span className="pill-tag" style={{ background: "#e4f2e7", color: "#21613e", marginTop: 6, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <TrendingDown size={13} /> {Math.abs(pctChange).toFixed(0)}% lower than last week
            </span>
          ) : pctChange != null && pctChange > 0 ? (
            <span className="pill-tag" style={{ background: "#ffe4e6", color: "#be123c", marginTop: 6, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <TrendingUp size={13} /> {pctChange.toFixed(0)}% higher than last week
            </span>
          ) : pctChange === 0 ? (
            <span className="pill-tag" style={{ marginTop: 6, display: "inline-block" }}>Same as last week</span>
          ) : null}
        </div>
      </div>
    </section>
  );
}

const SHARE_COLORS = {
  transport: "#0284c7",
  electricity: "#eab308",
  energy: "#eab308",
  food: "#16a34a",
  shopping: "#9333ea",
  other: "#64748b",
};

function CategoryShareCard({ categories }) {
  const [grown, setGrown] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setGrown(1), 80);
    return () => clearTimeout(t);
  }, [categories]);

  const totalShare = (categories || []).reduce((s, c) => s + number(c.totalEmissionsKg), 0);
  if (!categories || categories.length === 0 || totalShare <= 0) return null;

  const sorted = [...categories]
    .map((c) => ({ ...c, share: (number(c.totalEmissionsKg) / totalShare) * 100 }))
    .sort((a, b) => b.share - a.share);
  const top = sorted[0];

  return (
    <section className="chart-card recommendations-panel">
      <div className="chart-card-header">
        <div>
          <h3>Where your footprint comes from</h3>
          <p>Share of this period's emissions by category. Biggest source: <b>{pretty(top.category)}</b>.</p>
        </div>
        <span className="panel-icon"><BarChart3 size={18} /></span>
      </div>
      <div style={{ display: "flex", height: 26, borderRadius: 8, overflow: "hidden" }}>
        {sorted.map((c) => (
          <div key={c.category}
            title={`${pretty(c.category)}: ${formatNumber(c.totalEmissionsKg)} kg CO₂e (${c.share.toFixed(0)}%)`}
            style={{
              width: `${c.share * grown}%`,
              background: SHARE_COLORS[String(c.category).toLowerCase()] || "#409461",
              transition: "width 1s ease",
            }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6, marginTop: 8, fontSize: 12 }}>
        {sorted.map((c) => (
          <span key={c.category}>
            <b style={{ color: SHARE_COLORS[String(c.category).toLowerCase()] || "#409461" }}>{pretty(c.category)}</b>
            {" · "}{formatNumber(c.totalEmissionsKg)} kg · {c.share.toFixed(0)}%
          </span>
        ))}
      </div>
    </section>
  );
}

function RotatingTipBanner({ recommendations }) {
  const tips = useMemo(() => {
    const all = [];
    (recommendations || []).forEach((item) => {
      (item.recommendations || []).forEach((tip) => all.push({ tip, type: item.activityType }));
    });
    return all;
  }, [recommendations]);

  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (tips.length <= 1) return undefined;
    let swap;
    const id = setInterval(() => {
      setVisible(false);
      swap = setTimeout(() => {
        setIdx((i) => (i + 1) % tips.length);
        setVisible(true);
      }, 350);
    }, 3400);
    return () => { clearInterval(id); clearTimeout(swap); };
  }, [tips.length]);

  if (tips.length === 0) return null;
  const currentIdx = Math.min(idx, tips.length - 1);
  const current = tips[currentIdx];

  return (
    <section style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "13px 18px", borderRadius: 14, marginBottom: 24,
      background: "#f0fdf4", border: "1px solid #bbf7d0",
    }}>
      <Sprout size={22} style={{ color: "#21613e", flexShrink: 0 }} />
      <p style={{ margin: 0, fontSize: 13, opacity: visible ? 1 : 0, transition: "opacity 0.35s ease" }}>
        <b>Tip for {pretty(current.type)}:</b> {current.tip}
      </p>
      {tips.length > 1 && (
        <span style={{ marginLeft: "auto", display: "flex", gap: 5, flexShrink: 0 }}>
          {tips.map((_, i) => (
            <span key={i} style={{
              width: 7, height: 7, borderRadius: "50%",
              background: i === currentIdx ? "#21613e" : "#cfdccf",
            }} />
          ))}
        </span>
      )}
    </section>
  );
}

function renderRich(text) {
  return String(text).split("\n").map((line, li) => (
    <span key={li} style={{ display: "block" }}>
      {line.split("**").map((part, pi) => (
        pi % 2 === 1 ? <b key={pi}>{part}</b> : <span key={pi}>{part}</span>
      ))}
    </span>
  ));
}

const ASSISTANT_LANGS = [
  { id: "en", label: "English" },
  { id: "hi", label: "हिन्दी" },
  { id: "hinglish", label: "Hinglish" },
];

function AssistantChat({ data }) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("en");
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: `Hello ${data.username || "there"}! I'm your CarbonTrack assistant. Ask me about your footprint, your goal, your streak, or tips to cut emissions — I answer from your live dashboard data. You can also switch my language from the menu above.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [badges, setBadges] = useState(null);
  const tipIndexRef = useRef(0);
  const timerRef = useRef(null);
  const scrollRef = useRef(null);

  const L = (en, hi, hinglish) => (lang === "hi" ? hi : lang === "hinglish" ? hinglish : en);

  const [chipOffset, setChipOffset] = useState(0);

  const CHIP_POOLS = {
    en: ["Today's footprint?", "Biggest source?", "How is my goal?", "Give me a tip", "This week vs last?", "What's my streak?", "Month-end projection?", "My badges?", "Car emissions?", "Electricity emissions?", "Food emissions?", "Shopping emissions?", "How many activities?", "My highest day?", "Daily average?"],
    hi: ["आज का फुटप्रिंट?", "सबसे बड़ा स्रोत?", "मेरा लक्ष्य कैसा है?", "एक सुझाव दो", "इस सप्ताह vs पिछला?", "मेरी स्ट्रीक कितनी है?", "महीने के अंत का अनुमान?", "मेरे बैज?", "कार का उत्सर्जन?", "बिजली का उत्सर्जन?", "भोजन का उत्सर्जन?", "खरीदारी का उत्सर्जन?", "कितनी गतिविधियाँ लॉग हैं?", "सबसे ज़्यादा वाला दिन?", "रोज़ का औसत?"],
    hinglish: ["Aaj ka footprint?", "Sabse bada source?", "Goal ka haal?", "Ek tip do", "Is hafte vs pichhla?", "Mera streak kitna hai?", "Mahine ke end ka projection?", "Mere badges?", "Car ka emission?", "Bijli ka emission?", "Khana ka emission?", "Shopping ka emission?", "Kitni activities log hain?", "Sabse zyada wala din?", "Roz ka average?"],
  };
  const chipPool = CHIP_POOLS[lang] || CHIP_POOLS.en;
  const chipStart = ((chipOffset % chipPool.length) + chipPool.length) % chipPool.length;
  const visibleChips = [...chipPool.slice(chipStart), ...chipPool.slice(0, chipStart)].slice(0, 5);

  function switchLang(next) {
    setLang(next);
    const note = next === "hi"
      ? "भाषा हिन्दी हो गई है। अपने फुटप्रिंट, लक्ष्य या सुझावों के बारे में पूछिए।"
      : next === "hinglish"
        ? "Bhasha Hinglish ho gayi hai. Footprint, goal ya tips ke baare me kuch bhi pucho."
        : "Language set to English. Ask me about your footprint, goal or tips.";
    setMessages((m) => [...m, { from: "bot", text: note }]);
  }

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing, open]);

  useEffect(() => {
    if (open && badges === null) {
      getMyBadges()
        .then((res) => setBadges(listOf(res, ["badges", "content"])))
        .catch(() => setBadges([]));
    }
  }, [open, badges]);

  useEffect(() => { setChipOffset(0); }, [lang]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function allTips() {
    const all = [];
    (data.recommendations || []).forEach((item) => {
      (item.recommendations || []).forEach((tip) => all.push({ tip, type: item.activityType }));
    });
    return all;
  }

  function topCategory() {
    const cats = (data.categories || []).filter((c) => number(c.totalEmissionsKg) > 0);
    if (!cats.length) return null;
    return [...cats].sort((a, b) => number(b.totalEmissionsKg) - number(a.totalEmissionsKg))[0];
  }

  function categoryByKey(key) {
    return (data.categories || []).find((c) => {
      const k = String(c.category || "").toLowerCase();
      return k === key || (key === "electricity" && k === "energy");
    });
  }

  function goalAnswer() {
    const p = data.goalProgress;
    const active = (data.goals || []).find((g) => g.status === "ACTIVE") || (data.goals || [])[0];
    if (!active) {
      return L(
        "You don't have a goal set yet. Create a reduction goal from the Goals page — then I can track your target and your daily reduction for you.",
        "आपने अभी कोई लक्ष्य नहीं बनाया है। Goals पेज से कार्बन कमी का लक्ष्य बनाइए — फिर मैं आपका लक्ष्य और रोज़ की कटौती दोनों बता पाऊँगा।",
        "Abhi tumhara koi goal set nahi hai. Goals page se ek reduction goal banao — phir main tumhe target aur daily reduction bhi batata rahunga."
      );
    }
    if (!p) {
      return L(
        "Your goal is set, but its progress data hasn't loaded yet. Refresh the dashboard once and ask me again.",
        "आपका लक्ष्य बना हुआ है, लेकिन उसकी प्रगति का डेटा अभी लोड नहीं हुआ है। डैशबोर्ड को एक बार रीफ़्रेश करके फिर पूछिए।",
        "Tumhara goal set hai, lekin uska progress data abhi load nahi hua. Dashboard ko ek baar refresh karke phir pucho."
      );
    }
    if (p.status === "BASELINE_PENDING") {
      const parse = (v) => {
        if (!v) return null;
        const parts = String(v).slice(0, 10).split("-").map(Number);
        return parts.length === 3 && parts.every((n) => Number.isFinite(n))
          ? new Date(parts[0], parts[1] - 1, parts[2])
          : null;
      };
      const s = parse(p.baselineStartDate || active.startDate);
      const e = parse(p.baselineEndDate);
      const t = parse(todayLocal());
      let day = null;
      let totalDays = null;
      if (s && e && t) {
        totalDays = Math.max(1, Math.round((e - s) / 86400000) + 1);
        day = Math.min(totalDays, Math.max(1, Math.floor((t - s) / 86400000) + 1));
      }
      const dayText = day == null ? "" : L(
        ` You are on **Day ${day} of ${totalDays}** of the baseline.`,
        ` अभी बेसलाइन का **दिन ${day} / ${totalDays}** चल रहा है।`,
        ` Abhi baseline ka **Day ${day} of ${totalDays}** chal raha hai.`
      );
      return L(
        `Your goal is in the **baseline phase** (${p.baselineStartDate || active.startDate} – ${p.baselineEndDate || "7 days"}).${dayText} After the baseline, a ${active.targetReductionPct}% reduction target will be set — then I can also tell you your daily reduction. Keep logging your daily activities until then; a complete week makes the baseline accurate.`,
        `आपका लक्ष्य अभी **बेसलाइन चरण** में है (${p.baselineStartDate || active.startDate} – ${p.baselineEndDate || "7 दिन"})।${dayText} बेसलाइन के बाद ${active.targetReductionPct}% कमी का लक्ष्य तय होगा — तब मैं आपकी रोज़ की कटौती भी बता पाऊँगा। तब तक रोज़ की गतिविधियाँ लॉग करते रहिए; पूरा सप्ताह बेसलाइन को सटीक बनाता है।`,
        `Tumhara goal abhi **baseline phase** me hai (${p.baselineStartDate || active.startDate} – ${p.baselineEndDate || "7 din"}).${dayText} Baseline ke baad ${active.targetReductionPct}% reduction ka target set hoga — tab main tumhe daily reduction bhi bata paunga. Tab tak roz ki activities log karte raho, baseline utna hi sahi banega.`
      );
    }
    const current = p.currentFootprintKg == null ? null : number(p.currentFootprintKg);
    const target = p.targetFootprintKg == null ? null : number(p.targetFootprintKg);
    const projected = p.projectedFootprintKg == null ? null : number(p.projectedFootprintKg);
    const daysLeft = Math.max(0, number(p.daysRemaining));
    const daily = projected != null && target != null && daysLeft > 0
      ? Math.max(0, projected - target) / daysLeft
      : null;
    const curText = current == null ? "—" : formatNumber(current);
    const tarText = target == null ? "—" : formatNumber(target);
    let text = L(
      `Your goal so far: **${curText} kg** emitted, target ceiling **${tarText} kg**, and **${daysLeft} days** left.`,
      `आपके लक्ष्य की स्थिति: अब तक **${curText} kg** उत्सर्जन हो चुका है, लक्ष्य सीमा **${tarText} kg** है और **${daysLeft} दिन** बचे हैं।`,
      `Tumhare goal ka haal: abhi tak **${curText} kg** emit ho chuka hai, target ceiling **${tarText} kg** hai aur **${daysLeft} din** bache hain.`
    );
    if (projected != null) {
      text += L(
        ` At this pace the projection is **${formatNumber(projected)} kg**.`,
        ` इस गति से अनुमान **${formatNumber(projected)} kg** है।`,
        ` Is pace se projection **${formatNumber(projected)} kg** hai.`
      );
    }
    if (daily != null) {
      text += daily > 0
        ? L(
          ` To finish on target, cut about **${formatNumber(daily)} kg CO₂e per day**.`,
          ` लक्ष्य पर खत्म करने के लिए रोज़ लगभग **${formatNumber(daily)} kg CO₂e कम** करना होगा।`,
          ` Target par rehne ke liye roz lagbhag **${formatNumber(daily)} kg CO₂e kam** karna hoga.`
        )
        : L(
          " You are right on pace — no extra daily cut is needed.",
          " आप बिल्कुल सही गति पर हैं — कोई अतिरिक्त कटौती नहीं चाहिए।",
          " Tum bilkul pace par ho — koi extra katauti nahi chahiye."
        );
    }
    return text;
  }

  function answerFor(raw) {
    const q = ` ${raw.toLowerCase().replace(/[?.,!।]/g, " ")} `;
    const has = (...words) => words.some((w) => q.includes(w));

    if (/^(hi|hello|hey|namaste|namaskar)\b/.test(q.trim()) || q.includes("नमस्ते") || q.includes("नमस्कार")) {
      return L(
        `Hello ${data.username || "there"}! I can quote your dashboard numbers — footprint, biggest source, goal, streak, week comparison, month-end projection and tips. Just ask.`,
        `नमस्ते ${data.username || "मित्र"}! मैं आपके डैशबोर्ड के आँकड़े बता सकता हूँ — फुटप्रिंट, सबसे बड़ा स्रोत, लक्ष्य, स्ट्रीक, सप्ताह की तुलना, महीने के अंत का अनुमान और सुझाव। बस पूछिए।`,
        `Namaste ${data.username || "dost"}! Main tumhare dashboard ke number bol sakta hu — footprint, sabse bada source, goal, streak, hafte ki tulna, mahine ka projection aur tips. Bas puch lo.`
      );
    }

    const answerBadges = () => {
      if (badges === null) return L(
        "Your badge information is still loading — ask again in a moment. All your badges are also on the Badges page.",
        "आपके बैज की जानकारी अभी लोड हो रही है — एक क्षण बाद फिर पूछिए। सारे बैज Badges पेज पर भी दिखते हैं।",
        "Badges ki jaankari abhi load ho rahi hai — ek pal baad phir pucho. Badges page par saare badges ek saath dikhte hain."
      );
      if (!badges.length) return L(
        "You haven't earned any badges yet. Log activities daily and complete a goal — streak and goal badges are awarded automatically. See the full gallery on the Badges page.",
        "आपने अभी तक कोई बैज नहीं कमाया है। रोज़ गतिविधि लॉग कीजिए और लक्ष्य पूरा कीजिए — स्ट्रीक और लक्ष्य वाले बैज अपने आप मिलते हैं। पूरी गैलरी Badges पेज पर है।",
        "Abhi tak koi badge earn nahi hua hai. Roz activity log karo aur goal pura karo — streak aur goal-achieved par badges apne aap milte hain. Poori gallery Badges page par hai."
      );
      const names = badges.map((b) => b.name || b.badgeName).filter(Boolean).join(", ");
      return L(
        `You have earned **${badges.length} badge${badges.length === 1 ? "" : "s"}**: ${names}. See the full gallery on the Badges page.`,
        `आपने अब तक **${badges.length} बैज** कमाए हैं: ${names}। पूरी गैलरी Badges पेज पर दिखती है।`,
        `Tumne abhi tak **${badges.length} badge** earn kiye hain: ${names}. Badges page par poori gallery dikhti hai.`
      );
    };

    const answerStreak = () => {
      const s = data.streak || 0;
      if (s <= 0) return L(
        "Your streak is 0 right now. Log one activity today — that's where a streak starts.",
        "अभी आपकी स्ट्रीक 0 है। आज एक गतिविधि लॉग कीजिए — स्ट्रीक वहीं से शुरू होगी।",
        "Abhi tumhari streak 0 hai. Aaj ek activity log karo — streak wahi se shuru hogi."
      );
      return L(
        `Your logging streak is **${s} day${s === 1 ? "" : "s"}**. ${s >= 7 ? "A full week — congratulations! Keep it going." : "Log every day to build it up — 7 days makes a full week."}`,
        `आपकी लॉगिंग स्ट्रीक **${s} दिन** की है। ${s >= 7 ? "पूरा सप्ताह — बधाई हो! ऐसे ही जारी रखिए।" : "रोज़ लॉग करते रहिए — 7 दिन पूरे होने पर पूरा सप्ताह बन जाएगा।"}`,
        `Tumhari logging streak **${s} din** ki hai. ${s >= 7 ? "Ek hafta pura — badhai ho! Aise hi chalti rahe." : "Roz log karte raho — 7 din pure karne par streak aur majboot hogi."}`
      );
    };

    const answerTip = () => {
      const tips = allTips();
      if (!tips.length) return L(
        "I need a bit more data for good tips — log a few more activities and I'll advise you based on your biggest source.",
        "अच्छे सुझावों के लिए थोड़ा और डेटा चाहिए — कुछ और गतिविधियाँ लॉग कीजिए, फिर मैं आपके सबसे बड़े स्रोत के हिसाब से सलाह दूँगा।",
        "Abhi tips ke liye data kam hai — kuch aur activities log karo, phir main tumhare sabse bade source ke hisaab se sahi salah dunga."
      );
      const item = tips[tipIndexRef.current % tips.length];
      tipIndexRef.current += 1;
      const top = topCategory();
      return L(
        `**Tip (${pretty(item.type)}):** ${item.tip}${top ? ` Your biggest source is ${pretty(top.category)} (${formatNumber(top.totalEmissionsKg)} kg), so changing a habit there saves the most.` : ""} Type "tip" again for another one.`,
        `**सुझाव (${pretty(item.type)}):** ${item.tip}${top ? ` आपका सबसे बड़ा स्रोत ${pretty(top.category)} है (${formatNumber(top.totalEmissionsKg)} kg), इसलिए वहीं की आदत बदलना सबसे ज़्यादा बचत देगा।` : ""} एक और सुझाव के लिए फिर "सुझाव" लिखिए।`,
        `**Tip (${pretty(item.type)}):** ${item.tip}${top ? ` Tumhara sabse bada source ${pretty(top.category)} hai (${formatNumber(top.totalEmissionsKg)} kg), isiliye wahin ki aadat badalna sabse zyada fayda dega.` : ""} Aur tip chahiye to phir "tip" likho.`
      );
    };

    const answerCar = () => {
      const c = categoryByKey("transport");
      const carTips = (data.recommendations || []).find((r) => String(r.activityType || "").includes("car"));
      const tip0 = carTips?.recommendations?.[0];
      if (!c || number(c.totalEmissionsKg) <= 0) return L(
        "No transport activity is logged in this period yet. Log a car or bus trip and I'll quote the number right here.",
        "इस अवधि में अभी कोई परिवहन गतिविधि लॉग नहीं है। एक कार या बस यात्रा लॉग करके देखिए — संख्या यहीं बता दूँगा।",
        "Is period me abhi koi transport activity log nahi hai. Ek car ya bus activity log karke dekho — number yahin bol dunga."
      );
      return L(
        `Transport accounts for **${formatNumber(c.totalEmissionsKg)} kg CO₂e** this period.${tip0 ? ` Easiest way to cut it: ${tip0}` : ""}`,
        `इस अवधि में परिवहन से **${formatNumber(c.totalEmissionsKg)} kg CO₂e** बना है।${tip0 ? ` इसे कम करने का सबसे आसान तरीका: ${tip0}` : ""}`,
        `Transport se is period me **${formatNumber(c.totalEmissionsKg)} kg CO₂e** bana hai.${tip0 ? ` Kam karne ka sabse asaan tareeka: ${tip0}` : ""}`
      );
    };

    const answerElectricity = () => {
      const c = categoryByKey("electricity");
      const t = (data.recommendations || []).find((r) => String(r.activityType || "").includes("electric"));
      const tip0 = t?.recommendations?.[0];
      if (!c || number(c.totalEmissionsKg) <= 0) return L(
        "No electricity activity is logged in this period yet.",
        "इस अवधि में अभी कोई बिजली गतिविधि लॉग नहीं है।",
        "Is period me abhi koi electricity activity log nahi hai."
      );
      return L(
        `Electricity accounts for **${formatNumber(c.totalEmissionsKg)} kg CO₂e** this period.${tip0 ? ` Tip: ${tip0}` : ""}`,
        `इस अवधि में बिजली से **${formatNumber(c.totalEmissionsKg)} kg CO₂e** बना है।${tip0 ? ` सुझाव: ${tip0}` : ""}`,
        `Electricity se is period me **${formatNumber(c.totalEmissionsKg)} kg CO₂e** bana hai.${tip0 ? ` Tip: ${tip0}` : ""}`
      );
    };

    const answerFood = () => {
      const c = categoryByKey("food");
      if (!c || number(c.totalEmissionsKg) <= 0) return L(
        "No food activity is logged in this period yet. Log a meal from the Food tab in Log Activity and I'll tell you its share. In general, a plant-based meal is the lightest choice.",
        "इस अवधि में अभी कोई भोजन गतिविधि लॉग नहीं है। Log Activity के Food टैब से एक भोजन लॉग कीजिए — मैं उसका हिस्सा बता दूँगा। आम तौर पर पौध-आधारित (plant-based) भोजन सबसे हल्का पड़ता है।",
        "Is period me abhi koi food activity log nahi hai. Log Activity ke Food tab se ek meal log karo — main uska hissa bata dunga. Aam taur par plant-based meal sabse halka padta hai."
      );
      return L(
        `Food accounts for **${formatNumber(c.totalEmissionsKg)} kg CO₂e** this period.`,
        `इस अवधि में भोजन से **${formatNumber(c.totalEmissionsKg)} kg CO₂e** बना है।`,
        `Food se is period me **${formatNumber(c.totalEmissionsKg)} kg CO₂e** bana hai.`
      );
    };

    const answerShopping = () => {
      const c = categoryByKey("shopping");
      if (!c || number(c.totalEmissionsKg) <= 0) return L(
        "No shopping activity is logged in this period yet. Make your first entry from the Shopping tab in Log Activity.",
        "इस अवधि में अभी कोई खरीदारी गतिविधि लॉग नहीं है। Log Activity के Shopping टैब से पहली प्रविष्टि करके देखिए।",
        "Is period me abhi koi shopping activity log nahi hai. Log Activity ke Shopping tab se pehli entry karke dekho."
      );
      return L(
        `Shopping accounts for **${formatNumber(c.totalEmissionsKg)} kg CO₂e** this period.`,
        `इस अवधि में खरीदारी से **${formatNumber(c.totalEmissionsKg)} kg CO₂e** बना है।`,
        `Shopping se is period me **${formatNumber(c.totalEmissionsKg)} kg CO₂e** bana hai.`
      );
    };

    const answerWeek = () => {
      const cur = (data.weeklyData || []).reduce((s, d) => s + number(d["Current Week"]), 0);
      const prev = (data.weeklyData || []).reduce((s, d) => s + number(d["Previous Week"]), 0);
      if (prev === 0 && cur > 0) return L(
        `This week so far: **${formatNumber(cur)} kg**; last week was 0 — this is your first active week. From next week I can also give you the % difference.`,
        `इस सप्ताह अब तक **${formatNumber(cur)} kg** है और पिछला सप्ताह 0 था — यह आपका पहला सक्रिय सप्ताह है। अगले सप्ताह से मैं % में अंतर भी बता पाऊँगा।`,
        `Is hafte abhi tak **${formatNumber(cur)} kg** hai aur pichhla hafta 0 tha — ye tumhara pehla active hafta hai. Agle hafte se main tumhe % me farak bhi bata paunga.`
      );
      if (prev === 0 && cur === 0) return L(
        "No activities this week or last week yet. Log your first activity — the comparison starts there.",
        "इस सप्ताह और पिछले सप्ताह — दोनों में अभी कोई गतिविधि नहीं है। पहली गतिविधि लॉग कीजिए, तुलना वहीं से शुरू होगी।",
        "Is hafte aur pichhle hafte — dono me abhi koi activity nahi hai. Pehli activity log karo, tulna wahi se shuru hogi."
      );
      const pct = Math.abs(((cur - prev) / prev) * 100).toFixed(0);
      return cur <= prev
        ? L(
          `This week **${formatNumber(cur)} kg** vs last week **${formatNumber(prev)} kg** — that's **${pct}% lower** this week. Excellent — exactly the pace you want!`,
          `इस सप्ताह **${formatNumber(cur)} kg**, पिछले सप्ताह **${formatNumber(prev)} kg** — मतलब इस सप्ताह **${pct}% कम**। बहुत बढ़िया, यही गति चाहिए!`,
          `Is hafte **${formatNumber(cur)} kg**, pichhle hafte **${formatNumber(prev)} kg** — matlab is hafte **${pct}% kam**. Bahut badhiya, yahi pace chahiye!`
        )
        : L(
          `This week **${formatNumber(cur)} kg** vs last week **${formatNumber(prev)} kg** — **${pct}% higher** this week. Type "tip" and we'll start with your biggest source.`,
          `इस सप्ताह **${formatNumber(cur)} kg**, पिछले सप्ताह **${formatNumber(prev)} kg** — इस सप्ताह **${pct}% ज़्यादा** है। "सुझाव" लिखिए, सबसे बड़े स्रोत से शुरू करेंगे।`,
          `Is hafte **${formatNumber(cur)} kg**, pichhle hafte **${formatNumber(prev)} kg** — is hafte **${pct}% zyada** hai. Ek tip ke liye "tip" likho, sabse bade source se shuru karenge.`
        );
    };

    const answerProjection = () => (data.projectedMonthEnd != null
      ? L(
        `At your recent 7-day trend, your footprint could reach about **${formatNumber(data.projectedMonthEnd)} kg CO₂e** by the end of this month. You can see the same estimate as the blue dashed line in the Monthly chart.`,
        `आपके पिछले 7 दिनों के रुझान के हिसाब से इस महीने के अंत तक आपका फुटप्रिंट लगभग **${formatNumber(data.projectedMonthEnd)} kg CO₂e** तक जा सकता है। यही अनुमान Monthly चार्ट की नीली डैश वाली रेखा में भी दिखता है।`,
        `Recent 7 din ke trend ke hisaab se is mahine ke aakhir tak tumhara footprint lagbhag **${formatNumber(data.projectedMonthEnd)} kg CO₂e** tak ja sakta hai. Ye andaza Monthly chart ki neeli dashed line me bhi dikhta hai.`
      )
      : L(
        "I need a few more days of data for a projection — keep logging and I'll estimate your month-end.",
        "अनुमान के लिए अभी डेटा कम है — कुछ दिन और लॉग कीजिए, फिर महीने के अंत का अनुमान दूँगा।",
        "Projection ke liye abhi data kam hai — kuch din aur log karo, phir mahine ke aakhir ka andaza dunga."
      ));

    const answerHighestDay = () => {
      const rows = (data.weeklyData || []).filter((d) => number(d["Current Week"]) > 0);
      if (!rows.length) return L(
        "No day stands out this week yet — nothing is logged so far. Log an activity and ask me again.",
        "इस सप्ताह अभी कोई दिन अलग नहीं दिख रहा — अभी तक कुछ लॉग नहीं हुआ है। एक गतिविधि लॉग करके फिर पूछिए।",
        "Is hafte abhi koi din alag nahi dikh raha — abhi tak kuch log nahi hua hai. Ek activity log karke phir pucho."
      );
      const best = [...rows].sort((a, b) => number(b["Current Week"]) - number(a["Current Week"]))[0];
      return L(
        `Your highest day this week was **${best.day} — ${formatNumber(best["Current Week"])} kg CO₂e**.`,
        `इस सप्ताह आपका सबसे ज़्यादा उत्सर्जन वाला दिन **${best.day} — ${formatNumber(best["Current Week"])} kg CO₂e** रहा।`,
        `Is hafte tumhara sabse zyada wala din **${best.day} — ${formatNumber(best["Current Week"])} kg CO₂e** raha.`
      );
    };

    const answerActivityCount = () => {
      const n = (data.activities || []).length;
      if (!n) return L(
        "No activities are logged in this period yet. Log your first one from Log Activity.",
        "इस अवधि में अभी कोई गतिविधि लॉग नहीं है। Log Activity से पहली गतिविधि लॉग कीजिए।",
        "Is period me abhi koi activity log nahi hai. Log Activity se pehli activity log karo."
      );
      return L(
        `You have logged **${n} activit${n === 1 ? "y" : "ies"}** in this period, adding up to **${data.totalKg == null ? "—" : formatNumber(data.totalKg)} kg CO₂e**.`,
        `इस अवधि में आपने **${n} गतिविधियाँ** लॉग की हैं, जिनका कुल योग **${data.totalKg == null ? "—" : formatNumber(data.totalKg)} kg CO₂e** है।`,
        `Is period me tumne **${n} activities** log ki hain, jinka total **${data.totalKg == null ? "—" : formatNumber(data.totalKg)} kg CO₂e** hai.`
      );
    };

    const answerDailyAverage = () => {
      const days = new Set((data.activities || []).map((a) => a.logDate).filter(Boolean));
      if (!days.size || data.totalKg == null) return L(
        "Not enough data yet for a daily average — log a few activities first.",
        "रोज़ के औसत के लिए अभी डेटा कम है — पहले कुछ गतिविधियाँ लॉग कीजिए।",
        "Roz ke average ke liye abhi data kam hai — pehle kuch activities log karo."
      );
      const avg = data.totalKg / days.size;
      return L(
        `Your average is **${formatNumber(avg)} kg CO₂e per logged day** (${formatNumber(data.totalKg)} kg over ${days.size} logged day${days.size === 1 ? "" : "s"} this period).`,
        `आपका औसत **${formatNumber(avg)} kg CO₂e प्रति लॉग-दिन** है (इस अवधि में ${days.size} लॉग-दिनों में कुल ${formatNumber(data.totalKg)} kg)।`,
        `Tumhara average **${formatNumber(avg)} kg CO₂e per logged day** hai (is period me ${days.size} logged dinon me total ${formatNumber(data.totalKg)} kg).`
      );
    };

    const answerTopSource = () => {
      const top = topCategory();
      if (!top) return L(
        "No activity data yet — log your first activity and I'll name your biggest source.",
        "अभी कोई गतिविधि डेटा नहीं है — पहली गतिविधि लॉग कीजिए, फिर सबसे बड़ा स्रोत बता दूँगा।",
        "Abhi koi activity data nahi hai — pehli activity log karo, phir sabse bada source bata dunga."
      );
      const share = data.totalKg ? (number(top.totalEmissionsKg) / data.totalKg) * 100 : 0;
      return L(
        `Your biggest source is **${pretty(top.category)} — ${formatNumber(top.totalEmissionsKg)} kg** (about ${share.toFixed(0)}% of your total). That's where cutting helps the most.`,
        `सबसे बड़ा स्रोत है **${pretty(top.category)} — ${formatNumber(top.totalEmissionsKg)} kg** (कुल का लगभग ${share.toFixed(0)}%)। कटौती की शुरुआत यहीं से करनी चाहिए।`,
        `Sabse bada source hai **${pretty(top.category)} — ${formatNumber(top.totalEmissionsKg)} kg** (kul ka lagbhag ${share.toFixed(0)}%). Kam karne ki shuruaat yahi se karni chahiye.`
      );
    };

    const answerFootprint = () => {
      const top = topCategory();
      return L(
        `Today's footprint is **${formatNumber(data.todayFootprint)} kg CO₂e**. This period's total is **${data.totalKg == null ? "—" : formatNumber(data.totalKg)} kg**${top ? `, with the biggest share from ${pretty(top.category)} (${formatNumber(top.totalEmissionsKg)} kg)` : ""}.`,
        `आज का फुटप्रिंट **${formatNumber(data.todayFootprint)} kg CO₂e** है। इस अवधि का कुल **${data.totalKg == null ? "—" : formatNumber(data.totalKg)} kg** है${top ? `, जिसमें सबसे बड़ा हिस्सा ${pretty(top.category)} का है (${formatNumber(top.totalEmissionsKg)} kg)` : ""}।`,
        `Aaj ka footprint **${formatNumber(data.todayFootprint)} kg CO₂e** hai. Is period ka total **${data.totalKg == null ? "—" : formatNumber(data.totalKg)} kg** hai${top ? `, jisme sabse bada hissa ${pretty(top.category)} ka hai (${formatNumber(top.totalEmissionsKg)} kg)` : ""}.`
      );
    };

    const answerHelp = () => L(
      "I can answer questions about:\n• Today's / total footprint\n• Your biggest emission source\n• Goal and baseline status\n• Logging streak\n• This week vs last week\n• Month-end projection\n• Tips to reduce\n• Your badges\n• Activities logged, highest day, daily average",
      "मैं इन सवालों के जवाब दे सकता हूँ:\n• आज का / कुल फुटप्रिंट\n• आपका सबसे बड़ा उत्सर्जन स्रोत\n• लक्ष्य और बेसलाइन की स्थिति\n• लॉगिंग स्ट्रीक\n• इस सप्ताह बनाम पिछला सप्ताह\n• महीने के अंत का अनुमान\n• कम करने के सुझाव\n• आपके बैज\n• लॉग की गई गतिविधियाँ, सबसे ज़्यादा वाला दिन, रोज़ का औसत",
      "Main in sawalon ke jawab de sakta hu:\n• Aaj ka / total footprint\n• Sabse bada emission source\n• Goal aur baseline ka haal\n• Logging streak\n• Is hafte vs pichhla hafta\n• Mahine ke aakhir ka projection\n• Kam karne ke tips\n• Mere badges\n• Activities ki ginti, sabse zyada wala din, roz ka average"
    );

    const answerThanks = () => L(
      "You're welcome! Ask me anytime — footprint, goal or a tip.",
      "कोई बात नहीं! कभी भी पूछिए — फुटप्रिंट, लक्ष्य या सुझाव।",
      "Koi baat nahi! Kuch aur janna ho — footprint, goal ya tip — bas puch lo."
    );

    // Scoring match: the intent whose keywords match the question best wins,
    // so the user can phrase a related question in their own words.
    const INTENTS = [
      { keys: ["badge", "achievement", "बैज", "my badges", "मेरे बैज"], run: answerBadges },
      { keys: ["goal", "target", "baseline", "progress", "लक्ष्य", "बेसलाइन", "टारगेट", "goal status", "mera goal"], run: goalAnswer },
      { keys: ["streak", "स्ट्रीक", "लगातार"], run: answerStreak },
      { keys: ["tip", "suggest", "advice", "reduce", "reduce my", "how to reduce", "kaise kam", "kam kar", "बचत", "सुझाव", "सलाह", "टिप", "उपाय", "कम कैसे"], run: answerTip },
      { keys: [" car ", "transport", "driving", "drive", "vehicle", "petrol", "diesel", "bike", " bus ", "travel", " कार ", "परिवहन", "गाड़ी", "यात्रा"], run: answerCar },
      { keys: ["electricity", "bijli", "energy", "power", "बिजली", "units", "kwh"], run: answerElectricity },
      { keys: ["food", "khana", "khane", "meal", "diet", "भोजन", "खाने", "आहार", "lunch", "dinner", "breakfast", "नाश्ता"], run: answerFood },
      { keys: ["shopping", "kharidari", "clothes", "kapde", "खरीदारी", "शॉपिंग", "कपड़े", "सामान"], run: answerShopping },
      { keys: ["week", "hafta", "hafte", "सप्ताह", "हफ्ता", "last week", "previous week", "pichhla", "तुलना", "compare", "comparison", " vs "], run: answerWeek },
      { keys: ["project", "projection", "mahine ke end", "month end", "month-end", "end of month", "अनुमान", "प्रोजेक्शन", "kitna hoga", "कितना होगा", "future"], run: answerProjection },
      { keys: ["highest day", "sabse zyada wala din", "सबसे ज़्यादा वाला दिन", "worst day", "peak day", "heaviest day", "kis din sabse", "किस दिन सबसे"], run: answerHighestDay },
      { keys: ["how many activities", "number of activities", "activities logged", "total activities", "kitni activit", "कितनी गतिविधियाँ", "गतिविधियाँ कितनी", "entries", "कितनी एंट्री"], run: answerActivityCount },
      { keys: ["daily average", "average per day", "per day", "average", "औसत", "roz ka average", "रोज़ का औसत"], run: answerDailyAverage },
      { keys: ["sabse zyada", "sabse bada", "biggest", "source", "सबसे बड़ा", "सबसे ज़्यादा", "स्रोत", "which is highest", "sabse adhik", "सबसे अधिक", "main source"], run: answerTopSource },
      { keys: ["footprint", "emission", "carbon", "total", "today", "aaj", "फुटप्रिंट", "उत्सर्जन", "कार्बन", "co2", "overall", "कुल कितना"], run: answerFootprint },
      { keys: ["help", "kya kar sakte", "kya kya", "options", "मदद", "what can you do"], run: answerHelp },
      { keys: ["thank", "shukriya", "dhanyavad", "धन्यवाद", "शुक्रिया"], run: answerThanks },
    ];

    let best = null;
    let bestScore = 0;
    INTENTS.forEach((intent) => {
      const score = intent.keys.reduce((sum, k) => (q.includes(k) ? sum + (k.includes(" ") ? 2 : 1) : sum), 0);
      if (score > bestScore) {
        bestScore = score;
        best = intent;
      }
    });
    if (best) return best.run();

    return L(
      "That question is outside what I know — I answer from your dashboard data. Ask me about your footprint, biggest source, goal, streak, week comparison, projection, badges or tips. Type \"help\" for the full list.",
      "यह सवाल मेरी समझ से बाहर है — मैं आपके डैशबोर्ड के डेटा से जवाब देता हूँ। फुटप्रिंट, सबसे बड़ा स्रोत, लक्ष्य, स्ट्रीक, सप्ताह की तुलना, अनुमान, बैज या सुझावों के बारे में पूछिए। पूरी सूची के लिए \"help\" लिखिए।",
      "Ye sawal meri samajh se bahar hai — main tumhare dashboard ke data par jawab deta hu. Footprint, sabse bada source, goal, streak, hafte ki tulna, projection, badges ya tips ke baare me pucho. \"help\" likhne se poori list mil jayegi."
    );
  }

  function ask(text) {
    const question = (text || "").trim();
    if (!question || typing) return;
    setMessages((m) => [...m, { from: "user", text: question }]);
    setInput("");
    setTyping(true);
    timerRef.current = setTimeout(() => {
      setMessages((m) => [...m, { from: "bot", text: answerFor(question) }]);
      setTyping(false);
      setChipOffset((o) => o + 5);
    }, 700);
  }

  const botBubble = {
    alignSelf: "flex-start", maxWidth: "85%", background: "#ffffff",
    border: "1px solid #e2ecdf", borderRadius: 14, borderBottomLeftRadius: 4,
    padding: "9px 12px", fontSize: 13, lineHeight: 1.5,
  };
  const userBubble = {
    alignSelf: "flex-end", maxWidth: "85%", background: "#21613e", color: "#ffffff",
    borderRadius: 14, borderBottomRightRadius: 4,
    padding: "9px 12px", fontSize: 13, lineHeight: 1.5,
  };

  return (
    <>
      {open && (
        <div style={{
          position: "fixed", right: 20, bottom: 88, width: 350, maxWidth: "calc(100vw - 32px)",
          height: 500, maxHeight: "calc(100vh - 120px)", background: "#ffffff", borderRadius: 18,
          boxShadow: "0 24px 60px rgba(14, 58, 40, 0.35)", border: "1px solid #e2ecdf",
          display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 1000,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, background: "#0e3a28", padding: "12px 14px", color: "#eaf6ee" }}>
            <span style={{ width: 36, height: 36, borderRadius: "50%", background: "#1d5c3a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Sprout size={20} style={{ color: "#bfe6cc" }} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>Ask CarbonTrack</div>
              <div style={{ fontSize: 11, color: "#a9d3b6" }}>{L("Online · answers from your live data", "ऑनलाइन · आपके लाइव डेटा से जवाब देता है", "Online · tumhare data se jawab deta hai")}</div>
            </div>
            <select value={lang} onChange={(e) => switchLang(e.target.value)} aria-label="Assistant language"
              style={{ background: "#1d5c3a", color: "#eaf6ee", border: "1px solid #2f7a4e", borderRadius: 8, padding: "5px 7px", fontSize: 12, cursor: "pointer", outline: "none" }}>
              {ASSISTANT_LANGS.map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant"
              style={{ background: "transparent", border: "none", color: "#eaf6ee", cursor: "pointer", display: "flex", padding: 4 }}>
              <X size={18} />
            </button>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "14px 12px", display: "flex", flexDirection: "column", gap: 9, background: "#f4f8f3" }}>
            {messages.map((m, i) => (
              <div key={i} style={m.from === "user" ? userBubble : botBubble}>
                {renderRich(m.text)}
              </div>
            ))}
            {typing && (
              <div style={{ ...botBubble, color: "#718177" }}>{L("Assistant is typing…", "असिस्टेंट लिख रहा है…", "Assistant likh raha hai…")}</div>
            )}
          </div>

          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", padding: "9px 12px", background: "#f4f8f3" }}>
            {visibleChips.map((chip) => (
              <button key={chip} type="button" onClick={() => ask(chip)}
                style={{ border: "1.5px solid #21613e", color: "#21613e", background: "#ffffff", borderRadius: 999, padding: "5px 11px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {chip}
              </button>
            ))}
            <button type="button" onClick={() => setChipOffset((o) => o + 5)}
              style={{ border: "1.5px dashed #21613e", color: "#21613e", background: "#eef6ef", borderRadius: 999, padding: "5px 11px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              {L("↻ More", "↻ और देखें", "↻ Aur dekho")}
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); ask(input); }}
            style={{ display: "flex", gap: 8, padding: "11px 12px", background: "#ffffff", borderTop: "1px solid #e2ecdf" }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={L("Type your question…", "अपना सवाल लिखिए…", "Apna sawal likho…")}
              style={{ flex: 1, minWidth: 0, border: "1px solid #e2ecdf", borderRadius: 999, padding: "9px 13px", fontSize: 13, outline: "none" }} />
            <button type="submit" aria-label="Send question"
              style={{ background: "#21613e", color: "#ffffff", border: "none", width: 38, height: 38, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <button type="button" onClick={() => setOpen((o) => !o)} aria-label="Ask CarbonTrack assistant"
        style={{
          position: "fixed", right: 20, bottom: 20, width: 56, height: 56, borderRadius: "50%",
          background: "#21613e", color: "#ffffff", border: "none", cursor: "pointer",
          boxShadow: "0 12px 28px rgba(14, 58, 40, 0.4)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
        {open ? <X size={24} /> : <MessageCircle size={26} />}
      </button>
    </>
  );
}

// -------------------------------------------------------------
// MODULE 4: PEER BENCHMARKING
// -------------------------------------------------------------

function CommunityLeaderboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyBenchmark()
      .then((res) => setData(res))
      .catch((err) => setError(err.message || "Failed to load peer benchmark."))
      .finally(() => setLoading(false));
  }, []);

  const categories = data?.categories || [];

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <div className="dashboard-topline">
          <div>
            <span className="eyebrow">ANONYMOUS PEER BENCHMARKING</span>
            <h1>Your footprint <span>against peers</span></h1>
            <p>Compare category emissions with platform averages over the past 30 days.</p>
          </div>
        </div>

        {/* Privacy Assurance Banner */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 20px",
          borderRadius: 14,
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          color: "#166534",
          fontSize: 13,
          marginBottom: 20,
        }}>
          <ShieldCheck size={20} />
          <div>
            <b>Privacy first:</b> This view uses aggregate category averages and does not display other members or their personal data.
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Loading peer benchmarks…</div>
        ) : error ? (
          <div className="dashboard-error">
            <CircleHelp size={18} />
            <div><b>Failed to load peer benchmark</b><p>{error}</p></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon"><Users size={24} /></span>
            <b>No category benchmark is available yet</b>
            <p>Once platform activity is available, anonymous category averages will appear here.</p>
          </div>
        ) : (
          <div className="leaderboard-table-wrap">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Your emissions (30d)</th>
                  <th>Platform average</th>
                  <th>Percentile</th>
                  <th>Standing</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((entry) => (
                  <tr className="leaderboard-row" key={entry.category}>
                    <td><b>{pretty(entry.category)}</b></td>
                    <td>
                      {formatNumber(entry.yourEmissionsKg)} <small>kg CO₂e</small>
                    </td>
                    <td>
                      {formatNumber(entry.platformAverageKg)} <small>kg CO₂e</small>
                    </td>
                    <td>
                      {formatNumber(entry.percentile)}%
                    </td>
                    <td>
                      <span className="pill-tag">{entry.standing}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

// -------------------------------------------------------------
// MODULE 5: ORGANISATION DASHBOARD & CSR REPORT EXPORT
// -------------------------------------------------------------

function OrganisationDashboard({ user }) {
  const [summary, setSummary] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  async function loadOrgData() {
    setLoading(true);
    setError("");

    try {
      const [sumRes, empRes] = await Promise.all([
        getOrganisationSummary(),
        getOrganisationEmployees(),
      ]);
      setSummary(sumRes);
      setEmployees(empRes);
    } catch (err) {
      setError(err.message || "Could not retrieve organisation dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrgData();
  }, []);

  async function handleExportCsv() {
    setExporting(true);
    try {
      await downloadCsrReport();
    } catch (err) {
      alert("Error exporting CSR Report: " + (err.message || "Download failed"));
    } finally {
      setExporting(false);
    }
  }

  const categoryTotals = summary?.categoryTotals || [];
  const monthlyTrends = summary?.monthlyTrends || [];

  const pieData = useMemo(() => {
    return categoryTotals.map((c) => ({
      name: pretty(c.category),
      value: number(c.totalEmissionsKg),
      categoryKey: c.category.toLowerCase(),
    }));
  }, [categoryTotals]);

  const trendData = useMemo(() => {
    return monthlyTrends.map((t) => ({
      month: t.periodStart,
      "Team Footprint": number(t.totalEmissionsKg),
    }));
  }, [monthlyTrends]);

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <div className="dashboard-topline">
          <div>
            <span className="eyebrow">ENTERPRISE SUSTAINABILITY INTELLIGENCE</span>
            <h1>
              Organisation: <span>{summary?.organisationName || "Team Overview"}</span>
            </h1>
            <p>Organisation-level footprint analytics, team trends, and CSR reporting.</p>
          </div>
          {summary && (
            <button
              className="button button-primary"
              onClick={handleExportCsv}
              disabled={exporting}
            >
              <Download size={16} /> {exporting ? "Generating CSV…" : "Download CSR Report (.csv)"}
            </button>
          )}
        </div>

        {error && (
          <div className="dashboard-error">
            <Building2 size={24} />
            <div>
              <b>Organisation Access Status</b>
              <p>{error}</p>
              <p className="muted-text">Organisation membership and administrator access must be provisioned by an authorised organisation administrator.</p>
            </div>
          </div>
        )}

        {summary && (
          <>
            {/* CSR Banner */}
            <div className="csr-banner">
              <div>
                <h3>Corporate Sustainability Reporting (CSR) Ready</h3>
                <p>
                  Export verified audit-ready CSV reports containing category emissions,
                  per-employee averages, and monthly trajectories.
                </p>
              </div>
              <button
                className="button"
                style={{ background: "white", color: "#174631", fontWeight: 700 }}
                onClick={handleExportCsv}
                disabled={exporting}
              >
                <Download size={16} /> {exporting ? "Preparing…" : "Export CSR CSV"}
              </button>
            </div>

            {/* Org Metrics */}
            <div className="metrics-grid">
              <MetricCard
                icon={Building2}
                label="Total Organisation Emissions"
                value={formatNumber(summary.totalEmissionsKg)}
                unit="kg CO₂e"
                note={`Scope: ${summary.startDate} to ${summary.endDate}`}
                tone="mint"
              />
              <MetricCard
                icon={Users}
                label="Active Team Members"
                value={summary.totalEmployees}
                note="Members in your organisation"
              />
              <MetricCard
                icon={BarChart3}
                label="Average Footprint / Member"
                value={formatNumber(summary.averagePerEmployeeKg)}
                unit="kg CO₂e"
                note="Per-employee benchmark"
                tone="gold"
              />
            </div>

            {/* Org Charts */}
            <Suspense fallback={<div className="charts-grid-2">
              <div className="chart-card empty-state">Loading organization charts…</div>
              <div className="chart-card" aria-hidden="true" />
            </div>}>
              <OrganisationCharts pieData={pieData} trendData={trendData} />
            </Suspense>

            {/* Per-Employee Comparison Table */}
            <div className="chart-card">
              <div className="chart-card-header">
                <div>
                  <h3>Per-Employee Comparison Table</h3>
                  <p>Privacy-safeguarded member metrics (identifiers anonymized)</p>
                </div>
                <ShieldCheck size={18} className="text-green-700" />
              </div>
              <div className="leaderboard-table-wrap">
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>#</th>
                      <th>Employee Identifier</th>
                      <th>Activities Logged</th>
                      <th>Total Footprint</th>
                      <th>Primary Domain</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp.rank} className="leaderboard-row">
                        <td>{emp.rank}</td>
                        <td>
                          <b>{emp.employeeIdentifier}</b>
                        </td>
                        <td>{emp.activityCount} activities</td>
                        <td>
                          <b>{formatNumber(emp.totalEmissionsKg)}</b> <small>kg CO₂e</small>
                        </td>
                        <td>
                          <span className="pill-tag">{emp.primaryCategory}</span>
                        </td>
                        <td>
                          <span
                            className="pill-tag"
                            style={{
                              background:
                                emp.status === "Efficient"
                                  ? "#e4f2e7"
                                  : emp.status === "Moderate"
                                  ? "#fef9c3"
                                  : "#ffe4e6",
                              color:
                                emp.status === "Efficient"
                                  ? "#21613e"
                                  : emp.status === "Moderate"
                                  ? "#854d0e"
                                  : "#be123c",
                            }}
                          >
                            {emp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

// -------------------------------------------------------------
// GOALS PAGE, BADGES PAGE, PROFILE PAGE
// -------------------------------------------------------------

function PageHeading({ eyebrow, title, description, icon: Icon }) {
  return (
    <div className="dashboard-topline">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {Icon && <span className="panel-icon"><Icon size={22} /></span>}
    </div>
  );
}

function GoalForm({ initial, onSave, onCancel, busy }) {
  const [targetReductionPct, setTargetReductionPct] = useState(
    initial ? String(initial.targetReductionPct) : "20"
  );
  const [periodDays, setPeriodDays] = useState(
    initial ? String(initial.periodDays) : "30"
  );
  const [startDate, setStartDate] = useState(
    initial ? initial.startDate : todayLocal()
  );
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    const pct = Number(targetReductionPct);
    const days = Number(periodDays);
    if (!Number.isFinite(pct) || pct < 0.01 || pct > 100) {
      setError("Target reduction must be between 0.01% and 100%.");
      return;
    }
    if (!Number.isInteger(days) || days < 7 || days > 365) {
      setError("Period must be a whole number of days (7 to 365).");
      return;
    }
    setError("");
    onSave({ targetReductionPct: pct, periodDays: days, startDate });
  }

  return (
    <form className="activity-form goal-form" onSubmit={submit}>
      <div className="activity-form-grid">
        <label className="field-label">Target reduction (%)
          <input type="number" min="0.01" max="100" step="0.01" value={targetReductionPct}
            onChange={(e) => setTargetReductionPct(e.target.value)} required />
        </label>
        <label className="field-label">Period (days)
          <input type="number" min="7" max="365" step="1" value={periodDays}
            onChange={(e) => setPeriodDays(e.target.value)} required />
        </label>
        <label className="field-label">Start date
          <input type="date" value={startDate}
            onChange={(e) => setStartDate(e.target.value)} required />
        </label>
      </div>
      {error && <div className="form-message form-error">{error}</div>}
      <div className="goal-form-actions">
        <button className="button button-primary" disabled={busy}>
          {busy ? "Saving…" : initial ? "Update goal" : "Create goal"}
        </button>
        <button className="button button-outline" type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingGoal, setEditingGoal] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  async function loadGoals() {
    setLoading(true);
    setError("");
    try {
      const result = await getGoals();
      const items = listOf(result, ["goals", "content"]);
      setGoals(items);

      const entries = await Promise.all(items.map(async (goal) => {
        try {
          const p = await getGoalProgress(goal.id);
          return [goal.id, p];
        } catch (err) {
          return [goal.id, { error: err.message || "Could not load progress for this goal." }];
        }
      }));
      setProgress(Object.fromEntries(entries));
    } catch (err) {
      setError(err.message || "Failed to load goals.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadGoals(); }, []);

  async function saveGoal(payload) {
    setBusy(true);
    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id, payload);
      } else {
        await createGoal(payload);
      }
      setShowForm(false);
      setEditingGoal(null);
      await loadGoals();
    } catch (err) {
      alert("Could not save goal: " + (err.message || ""));
    } finally {
      setBusy(false);
    }
  }

  async function removeGoal(id) {
    if (!confirm("Are you sure you want to delete this goal?")) return;
    try {
      await deleteGoal(id);
      await loadGoals();
    } catch (err) {
      alert("Could not delete goal: " + (err.message || ""));
    }
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <PageHeading eyebrow="TARGETS & ACCOUNTABILITY" title="Sustainability Goals"
          description="Commit to carbon reduction targets and track your performance over time."
          icon={Target} />

        <div className="page-toolbar">
          <span>{goals.length} {goals.length === 1 ? "goal" : "goals"} configured</span>
          <button className="button button-primary"
            onClick={() => { setEditingGoal(null); setShowForm(true); }}>
            <Plus size={16} /> New goal
          </button>
        </div>

        {showForm && (
          <section className="dashboard-panel">
            <h3>{editingGoal ? "Edit goal" : "Create a new goal"}</h3>
            <GoalForm initial={editingGoal} onSave={saveGoal}
              onCancel={() => { setShowForm(false); setEditingGoal(null); }} busy={busy} />
          </section>
        )}

        {loading ? <div className="empty-state">Loading your goals…</div> :
          error ? <div className="dashboard-error"><CircleHelp size={18} /><div><b>Failed to load goals</b><p>{error}</p></div></div> :
            goals.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon"><Target size={24} /></span>
                <b>No goals set yet</b>
                <p>Set a target reduction percentage to stay motivated.</p>
              </div>
            ) : (
              <FadeContent className="dashboard-reveal" duration={0.45} stagger={0.05} once>
              <div className="goal-grid">
                {goals.map((goal) => {
                  const p = progress[goal.id];
                  const currentRed = p?.currentReductionPct;
                  const baselinePending = p?.status === "BASELINE_PENDING";
                  const completionPct = goalCompletionPercentage(p);
                  const completionWidth = completionPct == null
                    ? 0
                    : Math.min(100, Math.max(0, completionPct));
                  const status = p?.status || goal.status;
                  const statusLabel = goalStatusLabel(p);
                  return (
                    <article className={`dashboard-panel goal-card goal-card-status-${String(status).toLowerCase()}`} key={goal.id}>
                      <div className="goal-card-top">
                        <span className={`goal-status goal-status-${String(status).toLowerCase()}`}>
                          {statusLabel}
                        </span>
                        {status === "ACTIVE" && p?.onTrack != null && (
                          <span className={`pill-tag ${p.onTrack ? "pill-ontrack" : "pill-atrisk"}`}>
                            {p.onTrack ? "On track" : "At risk"}
                          </span>
                        )}
                      </div>
                      <h3>{goal.targetReductionPct}% reduction</h3>
                      <p>Over {goal.periodDays} days · Started {goal.startDate}</p>

                      {p?.error ? (
                        <div className="form-message form-error">{p.error}</div>
                      ) : p ? (
                        <div className="goal-progress-grid">
                          <div>
                            <small>Baseline emissions</small>
                            <b>{baselinePending ? "Collecting" : p.baselineFootprintKg == null ? "—" : formatNumber(p.baselineFootprintKg)} {!baselinePending && p.baselineFootprintKg != null && <small>kg CO₂e</small>}</b>
                          </div>
                          <div>
                            <small>Target ceiling</small>
                            <b>{baselinePending ? "Available after baseline" : p.targetFootprintKg == null ? "—" : formatNumber(p.targetFootprintKg)} {!baselinePending && p.targetFootprintKg != null && <small>kg CO₂e</small>}</b>
                          </div>
                          <div>
                            <small>Current emissions</small>
                            <b>{baselinePending || p.currentFootprintKg == null ? "—" : formatNumber(p.currentFootprintKg)} {!baselinePending && p.currentFootprintKg != null && <small>kg CO₂e</small>}</b>
                          </div>
                          <div>
                            <small>Actual reduction</small>
                            <b>{currentRed == null ? "—" : `${formatNumber(currentRed)}%`}</b>
                          </div>
                          <div>
                            <small>Goal completion</small>
                            <b>{completionPct == null ? "—" : `${formatNumber(completionPct)}%`}</b>
                          </div>
                          <div>
                            <small>Days remaining</small>
                            <b>{baselinePending || p.daysRemaining == null ? "—" : p.daysRemaining}</b>
                          </div>
                        </div>
                      ) : null}
                      {p && !p.error && (
                        <div className="goal-card-progress">
                          <div className="goal-progress-caption">
                            <span>Goal completion</span>
                            <b>{completionPct == null ? "Awaiting baseline or activity data" : `${formatNumber(completionPct)}% of target`}</b>
                          </div>
                          <div className="goal-progress-track" role="progressbar"
                            aria-label="Goal completion" aria-valuemin={0} aria-valuemax={100}
                            aria-valuenow={completionWidth}>
                            <span className={p.onTrack === false ? "goal-progress-at-risk" : ""}
                              style={{ width: `${completionWidth}%` }} />
                          </div>
                        </div>
                      )}
                      {baselinePending && (
                        <p className="goal-baseline-note">
                          Baseline collection runs {p.baselineStartDate || goal.startDate} through {p.baselineEndDate || "the end of the seven-day window"}.
                          Progress will appear once measurable activity is available.
                        </p>
                      )}

                      <div className="goal-card-actions">
                        {status === "ACTIVE" && (
                          <button className="button button-outline"
                            onClick={() => { setEditingGoal(goal); setShowForm(true); }}>
                            <Pencil size={15} /> Edit
                          </button>
                        )}
                        <button className="button button-outline danger-button"
                          onClick={() => removeGoal(goal.id)}>
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
              </FadeContent>
            )}
      </div>
    </main>
  );
}

function badgeIcon(badge) {
  const description = `${badge.name || badge.badgeName || ""} ${badge.description || ""}`.toLowerCase();
  if (description.includes("goal") || description.includes("target")) return Target;
  if (description.includes("streak") || description.includes("daily")) return CalendarDays;
  if (description.includes("reduction") || description.includes("footprint") || description.includes("carbon")) return Leaf;
  if (description.includes("activity") || description.includes("log")) return Activity;
  return Award;
}

function BadgesPage() {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [catalogueResult, earnedResult] = await Promise.all([getAllBadges(), getMyBadges()]);
      const catalogue = listOf(catalogueResult, ["badges", "content"]);
      const earned = listOf(earnedResult, ["badges", "content"]);
      const earnedIds = new Set(earned.map((b) => String(b.id ?? b.badgeId ?? b.name ?? b.badgeName)));
      setBadges(catalogue.map((b) => ({
        ...b,
        earned: earnedIds.has(String(b.id ?? b.badgeId ?? b.name ?? b.badgeName)),
        awardedAt: earned.find((e) => String(e.id ?? e.badgeId ?? e.name ?? e.badgeName) === String(b.id ?? b.badgeId ?? b.name ?? b.badgeName))?.awardedAt,
      })));
    } catch (err) {
      setError(err.message || "Failed to load badges.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <PageHeading eyebrow="RECOGNITION & REWARDS" title="Sustainability Badges"
          description="Earn recognition as you build consistent eco-friendly habits and meet your targets."
          icon={Award} />

        {loading ? <div className="empty-state">Loading badge catalogue…</div> :
          error ? <div className="dashboard-error"><CircleHelp size={18} /><div><b>Failed to load badges</b><p>{error}</p></div></div> :
            badges.length === 0 ? (
              <div className="empty-state">No badge catalogue is configured yet.</div>
            ) : (
              <FadeContent className="dashboard-reveal" duration={0.45} stagger={0.05} once>
              <div className="badge-grid">
                {badges.map((b) => (
                  <article className={`dashboard-panel badge-card ${b.earned ? "" : "badge-locked"}`} key={b.id || b.badgeId || b.name}>
                    <div className={`badge-art ${b.earned ? "badge-art-earned" : "badge-art-locked"}`}>
                      {(() => {
                        const Icon = badgeIcon(b);
                        return <Icon size={31} strokeWidth={1.8} />;
                      })()}
                      <span className="badge-art-state" aria-hidden="true">
                        {b.earned ? <CheckCircle2 size={16} /> : <LockKeyhole size={15} />}
                      </span>
                    </div>
                    <h3>{b.name || b.badgeName || "Badge"}</h3>
                    <p>{b.description || "Earn this badge through sustainable action."}</p>
                    {b.earned ? <small>Earned {b.awardedAt ? String(b.awardedAt).slice(0, 10) : ""}</small> : <small>Not earned yet</small>}
                  </article>
                ))}
              </div>
              </FadeContent>
            )}
      </div>
    </main>
  );
}

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    preferredTransport: "",
    dietPreference: "",
    sustainabilityGoal: "",
    preferredUnits: "metric",
    goalVisibility: false,
  });

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await getMyProfile();
      setProfile(data);
      setForm({
        preferredTransport: data.preferredTransport || "",
        dietPreference: data.dietPreference || "",
        sustainabilityGoal: data.sustainabilityGoal || "",
        preferredUnits: data.preferredUnits || "metric",
        goalVisibility: Boolean(data.goalVisibility),
      });
    } catch (err) {
      setError(err.message || "Could not load your profile.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function change(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setNotice("");
    setError("");
    try {
      const updated = await updateMyProfile(form);
      setProfile(updated);
      setNotice("Your preferences have been saved.");
    } catch (err) {
      setError(err.message || "Failed to save your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <PageHeading eyebrow="SETTINGS & PREFERENCES" title="Your Profile"
          description="Manage your profile, preferred transport modes, and dashboard units."
          icon={Settings} />

        {loading ? <div className="empty-state">Loading your profile…</div> : error && !profile ? (
          <div className="dashboard-error"><CircleHelp size={18} /><div>{error}</div></div>
        ) : (
          <div className="profile-layout">
            <aside className="dashboard-panel profile-summary">
              <div className="profile-avatar"><UserRound size={36} /></div>
              <h2>{profile?.username}</h2>
              <p>{profile?.email}</p>
              <small>Role: <b>{profile?.role || "USER"}</b></small>
            </aside>

            <form className="dashboard-panel profile-form" onSubmit={save}>
              <h3>Preferences</h3>
              {error && <div className="form-message form-error">{error}</div>}
              {notice && <div className="form-message form-success">{notice}</div>}
              <label className="field-label">Preferred transport
                <input value={form.preferredTransport}
                  onChange={(e) => change("preferredTransport", e.target.value)}
                  placeholder="e.g. Electric Vehicle, Bicycle" />
              </label>
              <label className="field-label">Dietary preference
                <input value={form.dietPreference}
                  onChange={(e) => change("dietPreference", e.target.value)}
                  placeholder="e.g. Plant-based, Vegetarian, Omnivore" />
              </label>
              <label className="field-label">Personal sustainability mission
                <input value={form.sustainabilityGoal}
                  onChange={(e) => change("sustainabilityGoal", e.target.value)}
                  placeholder="e.g. Net zero travel by 2027" />
              </label>
              <label className="field-label">Preferred units
                <select value={form.preferredUnits} onChange={(e) => change("preferredUnits", e.target.value)}>
                  <option value="metric">Metric (km, kg)</option>
                  <option value="imperial">Imperial (mi, lb)</option>
                </select>
              </label>
              <label className="profile-visibility">
                <input type="checkbox" checked={form.goalVisibility}
                  onChange={(e) => change("goalVisibility", e.target.checked)} />
                Allow goal benchmarks in anonymous community metrics
              </label>
              <button className="button button-primary" disabled={saving}>
                {saving ? "Saving…" : "Save preferences"}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

// -------------------------------------------------------------
// MAIN APPLICATION ROOT
// -------------------------------------------------------------

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [resetEntry, setResetEntry] = useState(() => {
    if (typeof window === "undefined") return { isReset: false, token: "" };
    const match = window.location.hash.match(/^#\/reset-password(?:\?(.*))?$/);
    return {
      isReset: Boolean(match),
      token: match ? new URLSearchParams(match[1] || "").get("token") || "" : "",
    };
  });
  const [authNotice, setAuthNotice] = useState("");
  const [authMode, setAuthMode] = useState(resetEntry.isReset ? "reset" : null);
  const [sessionLoading, setSessionLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    clearResetPasswordUrl();
  }, []);

  function clearResetPasswordUrl() {
    if (window.location.hash.startsWith("#/reset-password")) {
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${window.location.search}`
      );
    }
  }

  function closeRecovery() {
    clearResetPasswordUrl();
    setResetEntry({ isReset: false, token: "" });
    setAuthNotice("");
    setAuthMode("login");
  }

  function handlePasswordResetComplete() {
    clearResetPasswordUrl();
    setResetEntry({ isReset: false, token: "" });
    setAuthNotice("Your password was reset successfully. Please sign in with your new password.");
    setAuthMode("login");
  }

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setPage("dashboard");
    };
    window.addEventListener("carbontrack:unauthorized", handleUnauthorized);
    let cancelled = false;
    if (!getToken()) {
      setSessionLoading(false);
      return () => {
        cancelled = true;
        window.removeEventListener("carbontrack:unauthorized", handleUnauthorized);
      };
    }
    getMyProfile()
      .then((profile) => {
        if (!cancelled && profile?.username) setUser(profile);
        else if (!cancelled) logout();
      })
      .catch(() => {
        if (!cancelled) {
          logout();
          setUser(null);
        }
      })
      .finally(() => { if (!cancelled) setSessionLoading(false); });
    return () => {
      cancelled = true;
      window.removeEventListener("carbontrack:unauthorized", handleUnauthorized);
    };
  }, []);

  function handleAuthenticated(nextUser) {
    setUser(nextUser);
    setAuthMode(null);
    setAuthNotice("");
    setPage("dashboard");
  }

  function handleLogout() {
    logout();
    setUser(null);
    setPage("dashboard");
  }

  return (
    <div className="app-shell">
      {sessionLoading ? (
        <main className="dashboard-page"><div className="dashboard-shell"><div className="empty-state">Restoring your secure session…</div></div></main>
      ) : !user ? (
        <>
          <Header
            user={null}
            page={page}
            setPage={setPage}
            onLogin={() => {
              setAuthNotice("");
              setAuthMode("login");
            }}
            onRegister={() => {
              setAuthNotice("");
              setAuthMode("register");
            }}
            onLogout={handleLogout}
          />
          <Landing
            onRegister={() => setAuthMode("register")}
            onLogin={() => setAuthMode("login")}
          />
          <Footer />
        </>
      ) : (
        <AppLayout
          currentPage={page === "dashboard" ? "overview" : page === "leaderboard" ? "community" : page}
          onNavigate={(next) => setPage(next === "overview" ? "dashboard" : next === "community" ? "leaderboard" : next === "settings" ? "profile" : next)}
          user={user}
          onLogout={handleLogout}
        >
          {page === "dashboard" ? <Dashboard user={user} setPage={setPage} /> :
            page === "activity" ? <ActivityManagementPage /> :
            page === "footprint" ? (
              <Suspense fallback={<main className="dashboard-page"><div className="dashboard-shell"><div className="empty-state">Loading footprint analytics…</div></div></main>}>
                <MyFootprintPage />
              </Suspense>
            ) :
            page === "goals" ? <GoalsPage /> :
            page === "leaderboard" ? <CommunityLeaderboard /> :
            page === "badges" ? <BadgesPage /> :
            page === "profile" ? <ProfilePage /> :
            <Dashboard user={user} setPage={setPage} />}
        </AppLayout>
      )}

      {authMode && (
        <AuthModal
          mode={authMode}
          setMode={setAuthMode}
          onClose={() => {
            setAuthMode(null);
            if (resetEntry.isReset) {
              setResetEntry({ isReset: false, token: "" });
            }
          }}
          onAuthenticated={handleAuthenticated}
          onPasswordResetComplete={handlePasswordResetComplete}
          successMessage={authNotice}
          clearSuccessMessage={() => setAuthNotice("")}
          onCloseRecovery={closeRecovery}
          resetToken={resetEntry.token}
        />
      )}
    </div>
  );
}
