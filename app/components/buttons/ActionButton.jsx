"use client";
import { useSelector, useDispatch } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import { setError } from "@/app/features/modalSlice";
import Spinner from "@/app/components/ui/Spinner";

const ActionButton = ({
  onClick,
  icon,
  text,
  className = "",
  requireAuth = true,
  requirePermission,
  permissionMessage = "You don't have permission for this action",
  authMessage = "Please login to perform this action",
  disabled = false,
  loading = false,
  active = false,
  children,
  ...props
}) => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (requireAuth && !user) {
      dispatch(setError({ message: authMessage, type: "error" }));
      return;
    }

    if (requirePermission && !requirePermission(user)) {
      dispatch(setError({ message: permissionMessage, type: "error" }));
      return;
    }

    onClick?.(e);
  };

  const isIconOnly = icon && !text && !children;
  const isDisabled = disabled || loading;

  const baseStyles =
    "cursor-pointer duration-300 text-sm font-bold text-gold secondary center gap-1";
  const labeledStyles = "bg-gold/20 hover:bg-gold/40 p-1 px-2 rounded-xs";
  const iconOnlyStyles = "bg-gold/20 hover:bg-gold/40 rounded-full p-2";
  const disabledStyles = isDisabled ? "opacity-50 cursor-not-allowed" : "";

  const variantStyles = isIconOnly ? iconOnlyStyles : labeledStyles;

  return (
    <div
      onClick={isDisabled ? undefined : handleClick}
      className={`${baseStyles} ${variantStyles} ${disabledStyles} ${className}`}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      {...props}
    >
      {loading ? (
        <Spinner size="sm" />
      ) : (
        <>
          {icon}
          {text && <span>{text}</span>}
          {children}
        </>
      )}
    </div>
  );
};

export default ActionButton;
