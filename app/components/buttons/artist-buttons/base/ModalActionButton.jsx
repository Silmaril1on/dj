/**
 * ModalActionButton - Opens modals (Review, Rating, Add Album, Add Dates)
 * Handles common modal-opening logic
 */
"use client";
import { useDispatch } from "react-redux";
import { openGlobalModal } from "@/app/features/modalSlice";
import ActionButtonBase from "./ActionButtonBase";

const ModalActionButton = ({
  modalType, // "review" | "rating" | "addAlbum" | "addEvent"
  modalAction, // Redux action to dispatch (openReviewModal, openRatingModal, etc.)
  modalData, // Data to pass to modal
  icon,
  label,
  authMessage = "Please login to perform this action",
  ...props
}) => {
  const dispatch = useDispatch();

  const handleClick = () => {
    // Dispatch the specific modal action
    dispatch(modalAction(modalData));
    // Open the global modal only for modals that use it
    // AddEvent/AddAlbum manage their own full-screen modals separately
    if (modalType === "rating" || modalType === "review") {
      dispatch(openGlobalModal(modalType));
    }
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

export default ModalActionButton;
