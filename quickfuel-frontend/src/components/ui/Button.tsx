import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost";

export function Button({
  variant = "primary", className = "", type = "button", ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const styles = variant === "primary" ? "app-button-primary" : "app-button-ghost";
  return <button type={type} className={`app-button w-full ${styles} ${className}`} {...props} />;
}
