import React, { InputHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";

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
      <div className={`flex flex-col gap-1 ${hidden ? "hidden" : ""}`}>
        {label && (
          <label className="text-sm font-medium text-neutral-300">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          <input
            ref={ref}
            disabled={disabled}
            className={`w-full px-4 py-2 rounded-md bg-neutral-900 border transition-all 
              placeholder-neutral-500 text-white
              focus:outline-none focus:ring-2 focus:ring-blue-500
              ${
                state === "error"
                  ? "border-red-500 focus:ring-red-500"
                  : state === "success"
                  ? "border-blue-400 focus:ring-blue-400"
                  : "border-neutral-600"
              }
              ${rightIcon || isLoading ? "pr-10" : ""} 
              ${className}`}
            {...props}
          />

          {/* Loading Spinner */}
          {isLoading && (
            <motion.div
              className="absolute right-3 flex items-center"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }}
            >
              <div className="h-4 w-4 rounded-full border-2 border-neutral-500 border-t-blue-400" />
            </motion.div>
          )}

          {/* Success / Error Icon */}
          {!isLoading && rightIcon && (
            <motion.div
              className="absolute right-3"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              {rightIcon}
            </motion.div>
          )}
        </div>

        {state === "loading" && (
          <p className="text-sm text-neutral-400">{loadingText}</p>
        )}
        {state === "success" && (
          <p className="text-sm text-blue-400">{successText}</p>
        )}
        {state === "error" && (
          <p className="text-sm text-red-500">{errorText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default React.memo(Input);
