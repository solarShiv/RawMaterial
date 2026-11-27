import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import Api from "../../auth/Api";
import { useUser } from "../../Context/UserContext";

const FIELDS = [
  { name: "currentPassword", label: "Current password", autoComplete: "current-password" },
  { name: "newPassword", label: "New password", autoComplete: "new-password" },
  { name: "confirmPassword", label: "Confirm new password", autoComplete: "new-password" },
];

// Keys Login saves that UserContext.logout does not clear
const EXTRA_SESSION_KEYS = ["token", "userData", "warehouseId"];

const ChangePassword = () => {
  const { logout } = useUser();
  // Each field has its own view / hide toggle
  const [visible, setVisible] = useState({});
  const toggleVisible = (name) => setVisible((prev) => ({ ...prev, [name]: !prev[name] }));
  const [message, setMessage] = useState({ text: "", type: "" });

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onBlur",
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const rules = {
    currentPassword: { required: "Current password is required" },
    newPassword: {
      required: "New password is required",
      minLength: { value: 6, message: "Use at least 6 characters" },
      validate: (v) => v !== getValues("currentPassword") || "New password must be different",
    },
    confirmPassword: {
      required: "Please confirm your new password",
      validate: (v) => v === getValues("newPassword") || "Passwords do not match",
    },
  };

  const signOut = () => {
    EXTRA_SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
    delete Api.defaults.headers.common["Authorization"];
    logout(); // clears the session and redirects to /login
  };

  const onSubmit = async (data) => {
    setMessage({ text: "", type: "" });
    try {
      const res = await Api.put("/user/password", data);
      if (!res?.data?.success) {
        throw new Error(res?.data?.message || "Could not change password");
      }
      setMessage({
        text: `${res.data.message || "Password changed"}. Please sign in with your new password.`,
        type: "success",
      });
      // Short pause so the message is seen before the redirect
      await new Promise((resolve) => setTimeout(resolve, 1500));
      signOut();
    } catch (e) {
      const text =
        e?.response?.data?.message || e?.response?.data?.error || e?.message || "Something went wrong";
      setMessage({ text: `Password not changed: ${text}`, type: "error" });
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="card mx-auto max-w-md">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-950 text-brand-400">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h2 className="card-title">Change password</h2>
              <p className="text-xs text-ink-500">
                After changing your password you will be signed out on this device.
              </p>
            </div>
          </div>
        </div>

        <div className="card-body space-y-4">
          {FIELDS.map((field) => {
            const error = errors[field.name]?.message;
            return (
              <div key={field.name}>
                <label htmlFor={field.name} className="label">
                  {field.label} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <input
                    id={field.name}
                    type={visible[field.name] ? "text" : "password"}
                    autoComplete={field.autoComplete}
                    autoCapitalize="none"
                    disabled={isSubmitting}
                    aria-invalid={!!error}
                    className={`input pl-9 pr-10 ${error ? "border-red-400 focus:border-red-500" : ""}`}
                    {...register(field.name, rules[field.name])}
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisible(field.name)}
                    aria-label={visible[field.name] ? `Hide ${field.label}` : `View ${field.label}`}
                    title={visible[field.name] ? "Hide" : "View"}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-950"
                  >
                    {visible[field.name] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
              </div>
            );
          })}

          {message.text && (
            <div
              className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              {message.text}
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
            )}
            {isSubmitting ? "Updating…" : "Update password"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;
