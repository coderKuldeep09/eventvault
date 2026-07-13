import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Shared styled input for auth forms (login/signup on both
 * the guest and organiser pages).
 *
 * - icon: lucide-react icon component shown on the left
 * - isPassword: adds a built-in show/hide toggle on the right
 * - all other props are forwarded straight to the <input>
 */
export function AuthInput({ icon: Icon, isPassword = false, type = "text", className = "", ...props }) {
  const [show, setShow] = useState(false);
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div className={`relative mb-3.5 group ${className}`}>
      {Icon && (
        <Icon
          size={17}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-500 transition-colors pointer-events-none"
        />
      )}

      <input
        type={inputType}
        {...props}
        className={`w-full bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10
          focus:border-pink-500/50 focus:bg-white dark:focus:bg-white/10
          ${Icon ? "pl-11" : "pl-4"} ${isPassword ? "pr-11" : "pr-4"} py-3.5
          rounded-2xl text-sm outline-none transition-all
          text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500`}
      />

      {isPassword && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-500 transition-colors"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      )}
    </div>
  );
}
