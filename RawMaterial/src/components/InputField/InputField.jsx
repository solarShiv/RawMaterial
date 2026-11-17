import React from "react";

// Shared labelled input built on the design-system .label / .input classes.
const InputField = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  name,
  required = false,
  disabled = false,
  error,
  hint,
  className = "",
  wrapperClassName = "",
  ...rest
}) => {
  return (
    <div className={`flex w-full flex-col ${wrapperClassName || "mb-3"}`}>
      {label && (
        <label htmlFor={name} className={`label ${required ? "label-required" : ""}`}>
          {label}
        </label>
      )}

      <input
        id={name}
        type={type}
        name={name}
        value={value}
        required={required}
        disabled={disabled}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        className={`input ${error ? "input-error" : ""} ${className}`.trim()}
        {...rest}
      />

      {error ? (
        <p className="error-text">{error}</p>
      ) : hint ? (
        <p className="help-text">{hint}</p>
      ) : null}
    </div>
  );
};

export default InputField;
