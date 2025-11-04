"use client";
import { useDispatch, useSelector } from "react-redux";
import { openReportModal } from "@/app/features/reportsSlice";
import { openPrivacyTermsModal } from "@/app/features/privacyTermsSlice";
import { setError } from "@/app/features/modalSlice"; // ✅ import setError
import { appSocialLinks } from "@/app/localDB/pageInfoData";
import SocialLinks from "@/app/components/materials/SocialLinks";
import Paragraph from "@/app/components/ui/Paragraph";
import Logo from "@/app/components/ui/Logo";
import { selectUser } from "@/app/features/userSlice";
import UserRegion from "@/app/components/materials/UserRegion";

const Footer = () => {
 const user = useSelector(selectUser) 
  const dispatch = useDispatch();

  const handleOpen = (type) => {
    if (!user) {
      dispatch(
        setError({
          message: "Please login to send feedback or report",
          type: "error",
        })
      );
      return;
    }
    dispatch(openReportModal(type));
  };

  return (
    <div className={`center flex-col gap-2 bg-stone-950 border-t border-gold/30 pb-5 ${user ? "mb-10 lg:mb-0" : " " }`}>
      <section className="w-full grid grid-cols-2 bg-black p-3 lg:p-5">
        <div className="relative w-fit">
          <Logo size="md" />
          <h1 className="absolute bottom-[12%] hidden lg:block -right-27 text-4xl font-thin tracking-tight">SoundFolio</h1>
        </div>
        <div className="flex flex-col justify-center gap-1 items-end lg:items-end mb-4 lg:mb-0">
          <SocialLinks social_links={appSocialLinks} />
          <Paragraph text="Follow Soundfolio on" />
        </div>
      </section>
        <section className="flex flex-col lg:flex-row justify-center gap-2 lg:gap-5 items-center *:w-fit *:text-2xl *:text-gold *:hover:text-cream *:duration-300 *:cursor-pointer font-bold uppercase py-3 w-full">
          <h1>contact us</h1>
          <h1 onClick={() => handleOpen("feedback")}>feedback</h1>
          <h1 onClick={() => handleOpen("bug")}>report</h1>
          <h1 onClick={() => dispatch(openPrivacyTermsModal("general"))}>Terms & Conditions</h1>
          <h1 onClick={() => dispatch(openPrivacyTermsModal("privacy"))}>Privacy Policy</h1>
        </section>
        <UserRegion />
        <p className="secondary text-[9px] text-chino">© {new Date().getFullYear()} Soundfolio. All rights reserved.</p>
    </div>
  );
};

export default Footer;
