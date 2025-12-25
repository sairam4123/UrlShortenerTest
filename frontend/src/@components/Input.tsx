import React, { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  rightIcon?: ReactNode;
  label?: string;
  errorText?: string;
  isLoading?: boolean;
  successText?: string;
  loadingText?: string;
  state?: "error" | "success" | "loading";
  hidden?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      rightIcon,
      label,
      errorText,
      isLoading,
      successText,
      state,
      loadingText,
      className = "",
      disabled,
      hidden,
      ...props
    },
    ref
  ) => {
    return (
      <div className={`flex flex-col ${hidden ? "hidden" : ""}`}>
        {label && (
          <label className="mb-2 text-sm font-medium text-neutral-400">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <input
            ref={ref}
            disabled={disabled}
            className={`w-full px-4 py-2 border bg-neutral-900 rounded-md focus:outline-none focus:ring-2 ${
              state === "error"
                ? "border-red-500 focus:ring-red-500"
                : state === "success"
                ? "border-gray-300 focus:border-green-500 focus:ring-green-500"
                : "border-neutral-600 focus:ring-blue-500"
            } ${rightIcon || isLoading ? "pr-10" : ""} ${className}`}
            {...props}
          />
          {isLoading && (
            <div className="absolute right-3 flex items-center text-gray-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
            </div>
          )}
          {!isLoading && rightIcon && (
            <div className="absolute right-3 flex items-center text-gray-500">
              {rightIcon}
            </div>
          )}
        </div>
        {state === "loading" && (
          <p className="mt-1 text-sm text-neutral-400">{loadingText}</p>
        )}
        {state === "success" && (
          <p className="mt-1 text-sm text-green-500">{successText}</p>
        )}
        {state === "error" && (
          <p className="mt-1 text-sm text-red-500">{errorText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default React.memo(Input);
