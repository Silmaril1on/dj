"use client";
import { MdEdit } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import { setError } from "@/app/features/modalSlice";
import { useRouter } from "next/navigation";

const EditProduct = ({ className, data, type = "artist", desc }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const router = useRouter();

  const canEdit =
    type === "artist"
      ? user && user.submitted_artist_id === data?.id
      : type === "event"
      ? user &&
        Array.isArray(user.submitted_event_id) &&
        user.submitted_event_id.includes(data?.id)
      : type === "club"
      ? user &&
        (user.submitted_club_id === data?.id ||
          (Array.isArray(user.submitted_club_id) && user.submitted_club_id.includes(data?.id)))
      : false;

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      dispatch(
        setError({
          message: `Please login to edit this ${type}`,
          type: "error",
        })
      );
      return;
    }
    if (!canEdit) {
      dispatch(
        setError({
          message: `You can only edit your own submitted ${type}`,
          type: "error",
        })
      );
      return;
    }
    if (type === "artist") {
      router.push(`/add-product/add-artist?edit=true&artistId=${data.id}`);
    } else if (type === "event") {
      router.push(`/add-product/add-event?edit=true&eventId=${data.id}`);
    } else if (type === "club") {
      router.push(`/add-product/add-club?edit=true&clubId=${data.id}`);
    }
  };

  if (!canEdit) {
    return null;
  }

  return (
    <div
      onClick={handleEdit}
      className={`bg-gold/30 hover:bg-gold/40 text-gold w-fit secondary center gap-1 cursor-pointer duration-300 p-1 rounded-xs text-sm font-bold ${className}`}
    >
      <MdEdit size={20} />
      {desc && <h1>{desc}</h1>}
    </div>
  );
};

export default EditProduct;
