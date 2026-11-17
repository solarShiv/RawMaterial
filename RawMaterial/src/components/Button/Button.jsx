import React from "react";

// Shared button. `title` is the label (kept for backward compatibility);
// `children` also works. Variants map to the design-system .btn-* classes.
const VARIANTS = {
  default: "btn-primary",
  primary: "btn-primary",
  dark: "btn-dark",
  outline: "btn-outline",
  ghost: "btn-ghost",
  danger: "btn-danger",
  success: "btn-success",
  // icon-only button: no padding / bg
  icon: "icon-btn",
};

const SIZES = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
};

const Button = ({
  title = "",
  children,
  onClick,
  type = "button",
  disabled = false,
  loading = false,
  className = "",
  variant = "default",
  size = "md",
  icon: Icon,
  ...rest
}) => {
  const base = VARIANTS[variant] ?? VARIANTS.icon;
  const sizeClass = variant === "icon" ? "" : SIZES[size] ?? "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${base} ${sizeClass} ${className}`.trim()}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        Icon && <Icon className="h-4 w-4 shrink-0" />
      )}
      {children ?? title}
    </button>
  );
};

export default Button;
