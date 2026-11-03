import React from "react";

const InputField = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  name,
  required = false,
  disabled = false,
  className = "",
}) => {
  return (
    <div className="flex flex-col w-full mb-3">
      {label && (
        <label className="mb-1.5 text-sm font-medium text-ink-700">
          {label}
        </label>
      )}

      <input
        type={type}
        name={name}
        value={value}
        required={required}
        disabled={disabled}
        onChange={onChange}
        placeholder={placeholder}
        className={`
          w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900
          placeholder:text-ink-400 transition-colors
          focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-400/40
          disabled:bg-ink-100 disabled:text-ink-500 disabled:cursor-not-allowed
          ${className}
        `}
      />
    </div>
  );
};

export default InputField;
