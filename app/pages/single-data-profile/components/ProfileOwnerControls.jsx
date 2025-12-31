"use client";
import { useSelector } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import EditProduct from "@/app/components/buttons/EditProduct..jsx";
import FlexBox from "@/app/components/containers/FlexBox";
import { useRouter } from "next/navigation";
import { FaUpload, FaMusic } from "react-icons/fa";
import { getAddEventParams } from "../profileConfigs";

const ProfileOwnerControls = ({ data, type, currentUserId }) => {
  const router = useRouter();
  const user = useSelector(selectUser);

  // Check if user is the owner OR admin
  const isOwner = currentUserId && data.user_id === currentUserId;
  const isAdmin = user?.is_admin;
  const canManage = isOwner || isAdmin;

  if (!canManage) return null;
  if (type !== "clubs" && type !== "festivals") return null;

  const handleAddEvent = () => {
    const params = getAddEventParams(data);
    router.push(`/add-product/add-event?${params}`);
  };

  const handleAddLineup = () => {
    router.push(`/festivals/${data.id}/add-lineup`);
  };

  // Convert 'clubs' to 'club' for EditProduct component
  const editType =
    type === "clubs"
      ? "club"
      : type === "events"
        ? "event"
        : type === "festivals"
          ? "festival"
          : type;

  return (
    <div className="p-4 flex justify-between items-center">
      <FlexBox type="row=start" className="gap-2">
        {type === "clubs" && (
          <>
            <EditProduct desc="Edit Club Info" data={data} type={editType} />
            <button
              onClick={handleAddEvent}
              className="bg-gold/30 flex hover:bg-gold/40 cursor-pointer duration-300 items-center gap-1 text-sm px-2 py-1 font-bold"
            >
              <FaUpload />
              <span>Add Event</span>
            </button>
          </>
        )}

        {type === "festivals" && (
          <>
            <EditProduct
              desc="Edit Festival Info"
              data={data}
              type={editType}
            />
            <button
              onClick={handleAddLineup}
              className="bg-gold/30 flex hover:bg-gold/40 cursor-pointer duration-300 items-center uppercase gap-1 text-sm px-2 py-1 font-bold"
            >
              <span>Add Lineup</span>
            </button>
          </>
        )}
      </FlexBox>
    </div>
  );
};

export default ProfileOwnerControls;
