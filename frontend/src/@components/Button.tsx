import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils";

interface ButtonProps {
  text: string;
  isLoading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  text,
  isLoading = false,
  disabled = false,
  onPress,
  className,
}) => {
  return (
    <motion.button
      onClick={onPress}
      disabled={isLoading || disabled}
      className={cn(
        "px-5 py-3 text-base font-semibold rounded-md text-black",
        "bg-gradient-to-r from-blue-600 to-blue-400",
        "hover:from-blue-500 hover:to-blue-300 transition-all",
        "shadow-md shadow-blue-900/40",
        isLoading || disabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer opacity-100",
        className
      )}
      whileHover={{
        scale: disabled ? 1 : 1.03,
      }}
      whileTap={{
        scale: disabled ? 1 : 0.95,
      }}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          Processing…
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }}
            className="h-4 w-4 border-2 border-black/40 border-t-white rounded-full"
          />
        </span>
      ) : (
        text
      )}
    </motion.button>
  );
};

export default Button;
