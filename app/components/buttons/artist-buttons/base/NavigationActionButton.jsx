/**
 * NavigationActionButton - Handles navigation with auth/permission checks
 * Used for Edit buttons, View Profile, etc.
 */
"use client";
import { useRouter } from "next/navigation";
import ActionButtonBase from "./ActionButtonBase";

const NavigationActionButton = ({
  href,
  icon,
  label,
  authMessage = "Please login to perform this action",
  ...props
}) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(href);
  };

  return (
    <ActionButtonBase
      onClick={handleClick}
      authMessage={authMessage}
      {...props}
    >
      {icon}
      {label && <h1>{label}</h1>}
    </ActionButtonBase>
  );
};

export default NavigationActionButton;
