"use client";
import { setError } from "@/app/features/modalSlice";
import { selectUser } from "@/app/features/userSlice";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";

const SubmitLink = ({ href, label }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const handleClick = (e) => {
    e.preventDefault();

    if (!user) {
      dispatch(
        setError({
          message: "Please login to continue",
          type: "basic",
          action: "login",
        }),
      );
      return;
    }

    if (!user.email_verified || !user.profile_verified) {
      dispatch(
        setError({
          message:
            "Your account must be fully verified to submit content. Please complete your profile and verify your email address to access this feature.",
          type: "basic",
        }),
      );
      return;
    }

    router.push(href);
  };

  return (
    <button
      onClick={handleClick}
      className="text-blue hover:text-blue-600 transition-colors duration-200"
    >
      {label}
    </button>
  );
};

export default SubmitLink;
