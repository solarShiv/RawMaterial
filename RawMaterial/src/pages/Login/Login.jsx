import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Api from "../../auth/Api";
import { useUser } from "../../Context/UserContext";
import GaloEnergy from "../../assets/GaloEnergy.jpg";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaShieldAlt,
  FaExclamationCircle,
  FaBoxes,
  FaFileInvoice,
  FaIndustry,
} from "react-icons/fa";

axios.defaults.withCredentials = true;

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { login } = useUser();

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await Api.post("/auth/login", {
        email,
        password,
      });

      if (!response.data.success) {
        throw new Error("Login failed");
      }

      const userData = response.data.data;

      // 🔹 Create user object
      const user = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        warehouseId: userData.warehouseId,
        accessToken: userData.accessToken,
        refreshToken: userData.refreshToken,
      };

      console.log("User Data ", user)

      // 🔹 Save to localStorage
      localStorage.setItem("accessToken", userData.accessToken);
      localStorage.setItem("refreshToken", userData.refreshToken);
      localStorage.setItem("userId", userData.id);
      localStorage.setItem("userName", userData.name);
      localStorage.setItem("userEmail", userData.email);
      localStorage.setItem("roleName", userData.role);
      localStorage.setItem("warehouseId", userData.warehouseId);

      // 🔹 Set axios auth header
      axios.defaults.headers.common["Authorization"] =
        `Bearer ${userData.accessToken}`;

      // 🔹 Save in context
      login(user, userData.accessToken);

      // 🔹 Role-based navigation
      switch (userData.role) {
        case "Admin":
        case "SuperAdmin":
        case "Superadmin":
          navigate("/admin-dashboard");
          break;

        case "Purchase":
          navigate("/purchase-dashboard");
          break;

        case "Store":
          navigate("/store-keeper");
          break;

        case "Testing":
          navigate("/pending-process");
          break;

        case "PrePurchase":
          navigate("/pre-po");
          break;

        case "SFG Work":
        case "Assemble":
        case "Disassemble":
        case "Stamping":
        case "Winding":
        case "Winding Connection":
          navigate("/Item-Request");
          break;

        default:
          navigate("/");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || err ||  "Login failed. please check Your network and credential both.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    handleLogin();
  };

  const features = [
    { icon: FaBoxes, title: "Raw Material Control", text: "Live stock across every warehouse" },
    { icon: FaFileInvoice, title: "Purchase & Invoices", text: "From Pre-PO to payment approval" },
    { icon: FaIndustry, title: "Production Flow", text: "Track requests, issues and returns" },
  ];

  const texture = {
    backgroundImage:
      "repeating-linear-gradient(135deg, rgba(11,11,10,0.035) 0 1px, transparent 1px 14px)",
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-[1.05fr_1fr] bg-white">
      {/* Brand panel (desktop) */}
      <aside
        className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-300 via-brand-400 to-brand-500 p-12 xl:p-16 text-ink-950"
      >
        <div className="pointer-events-none absolute inset-0" style={texture} />
        {/* Thin concentric rings, echoing the logo */}
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[560px] w-[560px] rounded-full border-2 border-white/40" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-[400px] w-[400px] rounded-full border-2 border-white/30" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[240px] w-[240px] rounded-full border-2 border-white/25" />
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/30 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="rounded-xl bg-ink-950 p-1.5 shadow-pop">
            <img src={GaloEnergy} alt="Galo Energy" className="h-11 w-auto rounded-lg object-contain" />
          </div>
        </div>

        <div className="relative max-w-lg">
          <span className="inline-flex items-center gap-2 rounded-full bg-ink-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-400">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400" /> Raw Material System
          </span>
          <h1 className="mt-6 text-4xl xl:text-[44px] font-extrabold leading-[1.15] tracking-tight">
            Powering Tomorrow With{" "}
            <span className="rounded-lg bg-ink-950 px-2 text-brand-400 [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
              Smart Energy
            </span>{" "}
            Solutions
          </h1>
          <p className="mt-5 max-w-md text-base text-ink-800">
            One place to manage inventory, purchasing and production for Galo Energy.
          </p>

          <ul className="mt-10 divide-y divide-ink-950/10 rounded-2xl border border-white/50 bg-white/35 backdrop-blur-sm">
            {features.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-center gap-4 px-5 py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink-950 text-brand-400">
                  <Icon />
                </span>
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold">{title}</div>
                  <div className="text-sm text-ink-700">{text}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs font-medium text-ink-800">
          © {new Date().getFullYear()} Galo Energy • All Rights Reserved
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex min-h-screen flex-col bg-brand-50 lg:bg-white">
        {/* Mobile brand bar */}
        <div
          className="relative overflow-hidden lg:hidden bg-gradient-to-br from-brand-300 via-brand-400 to-brand-500 px-6 pt-10 pb-20 text-center"
        >
          <div className="pointer-events-none absolute inset-0" style={texture} />
          <div className="relative mx-auto inline-block rounded-xl bg-ink-950 p-1.5 shadow-pop">
            <img src={GaloEnergy} alt="Galo Energy" className="h-10 rounded-lg object-contain" />
          </div>
          <p className="relative mt-4 text-sm font-semibold text-ink-900">
            Powering Tomorrow With Smart Energy Solutions
          </p>
        </div>

        <div className="flex flex-1 items-start lg:items-center justify-center px-4 sm:px-6 -mt-12 lg:mt-0 pb-10 lg:py-12">
          <div className="w-full max-w-[400px] rounded-2xl bg-white p-6 sm:p-8 shadow-pop lg:shadow-none lg:p-0">
            <div className="mb-8">
              <span className="block h-1 w-10 rounded-full bg-brand-400" />
              <h2 className="mt-5 text-[28px] font-bold leading-tight tracking-tight text-ink-950">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-ink-500">Sign in to your account to continue.</p>
            </div>

            {error && (
              <div role="alert" className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <FaExclamationCircle className="mt-0.5 shrink-0" />
                <span>{String(error)}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="email" className="label">Email address</label>
                <div className="relative">
                  <FaEnvelope className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-ink-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    disabled={loading}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="input h-12 pl-11"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="label">Password</label>
                <div className="relative">
                  <FaLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-ink-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    disabled={loading}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="input h-12 pl-11 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-md text-ink-400 hover:bg-ink-100 hover:text-ink-900"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary group h-12 w-full text-[15px] shadow-[0_8px_20px_-8px_rgba(234,179,8,0.7)]"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <FaArrowRight className="text-sm transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 flex items-center justify-center gap-2 border-t border-ink-100 pt-6 text-xs text-ink-500">
              <FaShieldAlt className="text-ink-400" />
              Secure access for authorised Galo staff only
            </div>

            <p className="mt-4 text-center text-xs text-ink-400 lg:hidden">
              © {new Date().getFullYear()} Galo Energy • All Rights Reserved
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
