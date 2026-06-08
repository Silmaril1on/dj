"use client";
import AuthButtons from "@/app/components/buttons/AuthButtons";
import { selectIsAuthenticated, selectUser } from "@/app/features/userSlice";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DisplayName from "./DisplayName";
import Link from "next/link";
import Motion from "@/app/components/containers/Motion";

const UserPanel = () => {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get("redirect");
      if (redirect && redirect !== "/sign-in" && redirect !== "/sign-up") {
        router.push(redirect);
      }
    }
  }, [isAuthenticated, router]);

  return (
    <div className="hidden lg:flex space-x-2">
      <Motion
        animation="fade"
        delay={2}
        className="px-5 center mb-0.5 rounded-full bg-gold/20 cursor-pointer hover:bg-gold/30 duration-300 font-bold pt-0.5"
      >
        <Link href="/event-searcher">Event Searcher</Link>
      </Motion>
      {isAuthenticated ? <DisplayName user={user} /> : <AuthButtons />}
    </div>
  );
};

export default UserPanel;
