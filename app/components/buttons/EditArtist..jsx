'use client'
import { MdEdit } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import { setError } from "@/app/features/modalSlice";
import { useRouter } from "next/navigation";

const EditArtist = ({ className, artist, desc }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const router = useRouter();

  // Check if current user submitted this artist
  const canEdit = user && user.submitted_artist_id === artist?.id;

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      dispatch(setError({ message: 'Please login to edit this artist', type: 'error' }));
      return;
    }
    if (!canEdit) {
      dispatch(setError({ message: 'You can only edit your own submitted artist', type: 'error' }));
      return;
    }
    router.push(`/add-product/add-artist?edit=true&artistId=${artist.id}`);
  }

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
  )
}

export default EditArtist