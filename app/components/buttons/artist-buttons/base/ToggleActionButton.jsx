/**
 * ToggleActionButton - Handles toggle states with API calls (Like button)
 * Manages loading, optimistic updates, and error handling
 */
"use client";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setError } from "@/app/features/modalSlice";
import ActionButtonBase from "./ActionButtonBase";
import Spinner from "@/app/components/ui/Spinner";

const ToggleActionButton = ({
  initialState = false,
  endpoint,
  payload,
  onSuccess,
  icons, // { active: <Icon />, inactive: <Icon /> }
  label,
  successMessage = { on: "Action completed", off: "Action undone" },
  errorMessage = "Action failed",
  ...props
}) => {
  const [isActive, setIsActive] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    setIsActive(initialState);
  }, [initialState]);

  const handleToggle = async () => {
    if (isLoading) return;

    const newState = !isActive;
    setIsActive(newState); // Optimistic update
    setIsLoading(true);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        setIsActive(data.isLiked ?? data.isActive ?? newState);
        onSuccess?.(data);
        dispatch(
          setError({
            message: newState ? successMessage.on : successMessage.off,
            type: "success",
          }),
        );
      } else {
        // Revert on error
        setIsActive(!newState);
        dispatch(setError({ message: errorMessage, type: "error" }));
      }
    } catch (error) {
      // Revert on error
      setIsActive(!newState);
      dispatch(setError({ message: errorMessage, type: "error" }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ActionButtonBase onClick={handleToggle} loading={isLoading} {...props}>
      {isLoading ? <Spinner /> : isActive ? icons.active : icons.inactive}
      {label && <h1 className="pl-1">{label}</h1>}
    </ActionButtonBase>
  );
};

export default ToggleActionButton;
