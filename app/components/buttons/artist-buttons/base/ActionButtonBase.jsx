/**
 * ActionButtonBase - Foundation button with common styling and auth logic
 * Use this as the base for all action buttons
 */
"use client";
import { useSelector, useDispatch } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import { setError } from "@/app/features/modalSlice";

const ActionButtonBase = ({
  onClick,
  children,
  className = "",
  variant = "default", // "default" | "rounded" | "outline"
  requireAuth = true,
  requirePermission = null, // Function that returns boolean
  permissionMessage = "You don't have permission for this action",
  authMessage = "Please login to perform this action",
  disabled = false,
  loading = false,
  ...props
}) => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Auth check
    if (requireAuth && !user) {
      dispatch(setError({ message: authMessage, type: "error" }));
      return;
    }

    // Permission check
    if (requirePermission && !requirePermission(user)) {
      dispatch(setError({ message: permissionMessage, type: "error" }));
      return;
    }

    // Execute callback
    onClick?.(e);
  };

  // Variant styles
  const variantStyles = {
    default: "bg-gold/30 hover:bg-gold/40 text-gold p-1 rounded-xs",
    rounded: "bg-gold/20 hover:bg-gold/30 text-gold rounded-full p-2",
    outline: "border-2 border-gold/30 hover:border-gold/50 text-gold p-1 rounded-xs",
  };

  const baseStyles = "w-fit secondary center gap-1 cursor-pointer duration-300 text-sm font-bold";
  const disabledStyles = disabled || loading ? "opacity-50 cursor-not-allowed" : "";

  return (
    <div
      onClick={disabled || loading ? undefined : handleClick}
      className={`${baseStyles} ${variantStyles[variant]} ${disabledStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default ActionButtonBase;
