// Create a reusable component
import * as icons from "simple-icons";

interface SimpleIconProps {
  name: keyof typeof icons;
  className?: string;
  onClick?: () => void;
}

export function SimpleIcon({
  name,
  className = "w-6 h-6",
  onClick,
}: SimpleIconProps) {
  const icon = icons[name];

  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      onClick={onClick}
      className={className}
      fill="currentColor"
      aria-label={icon.title}
    >
      <path d={icon.path} />
    </svg>
  );
}
