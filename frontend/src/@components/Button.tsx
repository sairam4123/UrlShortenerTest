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
        "px-4 py-2 text-lg bg-blue-500 text-white rounded",
        isLoading || disabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer opacity-100",
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {isLoading ? "Loading..." : text}
    </motion.button>
  );
};
