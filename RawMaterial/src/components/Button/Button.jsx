 import React from "react";

const Button = ({
  title = "",
  onClick,
  type = "button",
  disabled = false,
  className = "",
  variant = "default", // NEW
}) => {
  const baseStyles =
    variant === "default"
      ? "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-ink-950 bg-brand-400 hover:bg-brand-500 shadow-sm"
      : // icon button → no padding, no bg, no color
        "p-1 rounded-md text-ink-500 hover:text-ink-950 hover:bg-ink-100 bg-transparent";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {title}
    </button>
  );
};

export default Button;