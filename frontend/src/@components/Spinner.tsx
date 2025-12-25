import React from "react";
import { motion } from "framer-motion";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  color = "blue",
}) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  const colorClass = `border-${color}-500`;

  return (
    <motion.div
      className={`${sizeClasses[size]} rounded-full border-4 border-transparent ${colorClass} border-t-current border-r-current shadow-lg`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
};
