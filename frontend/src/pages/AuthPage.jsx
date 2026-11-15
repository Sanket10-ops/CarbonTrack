import React, { useState, useMemo } from "react";
import {
  Leaf,
  Mail,
  User,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Globe2,
  Sparkles,
} from "lucide-react";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import { login, register } from "../api.js";

function passwordChecks(password) {
  return [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "One uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "One lowercase letter", valid: /[a-z]/.test(password) },
    { label: "One number", valid: /\d/.test(password) },
    { label: "One symbol", valid: /[^A-Za-z0-9]/.test(password) },
  ];
}

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login"); // login, register, forgot
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";
  const isForgot = mode === "forgot";

  const checks = useMemo(() => passwordChecks(password), [password]);
  const isPasswordValid = checks.every((c) => c.valid);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (isForgot) {
      setError("Password reset requires an email delivery service. Please sign in with your password or register a new account.");
      return;
    }

    if (isRegister) {
      if (!isPasswordValid) {
        setError("Please ensure your password meets all complexity requirements.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);
    try {
      if (isRegister) {
        const user = await register({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
        });
        setSuccess("Account created successfully!");
        onAuthenticated(user);
      } else {
        const user = await login({
          username: username.trim(),
          password,
        });
        onAuthenticated(user);
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ct-auth-container">
      {/* Left Hero / Value Proposition Column */}
      <div className="ct-auth-hero hidden lg:flex">
        <div className="ct-auth-hero-content">
          <div className="ct-auth-brand">
            <span className="ct-brand-icon">
              <Leaf size={24} strokeWidth={2.5} />
            </span>
            <span className="ct-brand-name">
              carbon<span>track</span>
            </span>
          </div>

          <div className="ct-hero-tagline">
            <h1>Precision Carbon Intelligence & Sustainability Management</h1>
            <p>
              Join thousands of conscious individuals and forward-looking organisations tracking,
              reducing, and benchmarking their environmental impact in real-time.
            </p>
          </div>

          <div className="ct-hero-features">
            <div className="ct-hero-feature-item">
              <div className="ct-feature-icon">
                <Globe2 size={18} />
              </div>
              <div>
                <b>Automated Scope 3 Tracking</b>
                <p>Dynamic emission factors across transit, energy, food, and shopping.</p>
              </div>
            </div>

            <div className="ct-hero-feature-item">
              <div className="ct-feature-icon">
                <ShieldCheck size={18} />
              </div>
              <div>
                <b>Zero-Knowledge Privacy</b>
                <p>Fully anonymized benchmarking without leaking employee or personal identifiers.</p>
              </div>
            </div>

            <div className="ct-hero-feature-item">
              <div className="ct-feature-icon">
                <Sparkles size={18} />
              </div>
              <div>
                <b>Audit-Ready CSR Reporting</b>
                <p>One-click verified corporate sustainability exports for compliance.</p>
              </div>
            </div>
          </div>

          <div className="ct-hero-footer">
            <small>© {new Date().getFullYear()} CarbonTrack SaaS Platform. All rights reserved.</small>
          </div>
        </div>
      </div>

      {/* Right Form Column */}
      <div className="ct-auth-form-column">
        <div className="ct-auth-form-box">
          <div className="ct-mobile-brand lg:hidden">
            <span className="ct-brand-icon">
              <Leaf size={20} strokeWidth={2.5} />
            </span>
            <span className="ct-brand-name">
              carbon<span>track</span>
            </span>
          </div>

          <div className="ct-auth-header">
            <h2>
              {isForgot
                ? "Reset your password"
                : isRegister
                ? "Create your account"
                : "Sign in to CarbonTrack"}
            </h2>
            <p>
              {isForgot
                ? "Enter your account email to receive recovery instructions"
                : isRegister
                ? "Start measuring and reducing your carbon footprint today"
                : "Enter your username and password to access your dashboard"}
            </p>
          </div>

          {error && (
            <div className="ct-form-alert is-error">
              <AlertCircle size={17} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="ct-form-alert is-success">
              <CheckCircle2 size={17} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="ct-auth-form">
            {isForgot ? (
              <Input
                label="Email Address"
                type="email"
                icon={Mail}
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            ) : (
              <>
                <Input
                  label={isRegister ? "Username" : "Username or Email"}
                  type="text"
                  icon={User}
                  placeholder={isRegister ? "Choose a username" : "Enter your username"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  minLength={isRegister ? 3 : undefined}
                  maxLength={100}
                  required
                />

                {isRegister && (
                  <Input
                    label="Email Address"
                    type="email"
                    icon={Mail}
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                )}

                <Input
                  label="Password"
                  type="password"
                  icon={Lock}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                {isRegister && (
                  <>
                    <div className="ct-pw-checklist">
                      <span className="ct-pw-checklist-title">Password must include:</span>
                      <div className="ct-pw-grid">
                        {checks.map((item, idx) => (
                          <div
                            key={idx}
                            className={`ct-pw-item ${item.valid ? "is-valid" : ""}`}
                          >
                            <span className="ct-pw-dot" />
                            <span>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Input
                      label="Confirm Password"
                      type="password"
                      icon={Lock}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </>
                )}

                {!isRegister && (
                  <div className="ct-auth-meta">
                    <button
                      type="button"
                      className="ct-text-link"
                      onClick={() => {
                        setMode("forgot");
                        setError("");
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              loading={loading}
              icon={ArrowRight}
            >
              {isForgot
                ? "Send Instructions"
                : isRegister
                ? "Create Account"
                : "Sign In"}
            </Button>
          </form>

          <div className="ct-auth-switcher">
            {isForgot ? (
              <p>
                Remember your credentials?{" "}
                <button
                  type="button"
                  className="ct-text-link"
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                >
                  Back to Sign in
                </button>
              </p>
            ) : isRegister ? (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  className="ct-text-link"
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                >
                  Sign in
                </button>
              </p>
            ) : (
              <p>
                Don't have an account yet?{" "}
                <button
                  type="button"
                  className="ct-text-link"
                  onClick={() => {
                    setMode("register");
                    setError("");
                  }}
                >
                  Create an account
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
