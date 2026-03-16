"use client";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import { useRouter } from "next/navigation";
import { openAddClubDateModal } from "@/app/features/modalSlice";
import { MdEdit } from "react-icons/md";
import ActionButton from "@/app/components/buttons/ActionButton";
import FlexBox from "@/app/components/containers/FlexBox";

const ProfileOwnerControls = ({ data, type, currentUserId }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const isOwner = currentUserId && data.user_id === currentUserId;
  const isAdmin = user?.is_admin;
  const canManage = isOwner || isAdmin;

  if (!canManage) return null;
  if (type !== "clubs" && type !== "festivals") return null;

  return (
    <div className="p-4 flex justify-between items-center">
      <FlexBox type="row=start" className="gap-2">
        {type === "clubs" && (
          <>
            <ActionButton
              icon={<MdEdit size={20} />}
              text="Edit Club Info"
              onClick={() =>
                router.push(`/add-product/club?edit=true&clubId=${data.id}`)
              }
            />
            <ActionButton
              text="Add Event"
              onClick={() => dispatch(openAddClubDateModal({ club: data }))}
            />
          </>
        )}

        {type === "festivals" && (
          <>
            <ActionButton
              icon={<MdEdit size={20} />}
              text="Edit Festival Info"
              onClick={() =>
                router.push(
                  `/add-product/festival?edit=true&festivalId=${data.id}`,
                )
              }
            />
            <ActionButton
              text="Add Lineup"
              onClick={() => router.push(`/festivals/${data.id}/add-lineup`)}
            />
          </>
        )}
      </FlexBox>
    </div>
  );
};

export default ProfileOwnerControls;
