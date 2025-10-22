"use client";
import { useDispatch, useSelector } from "react-redux";
import { openReportModal } from "@/app/features/reportsSlice";
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
    <div className="center flex-col gap-2 py-5 bg-stone-950 border-t border-gold/30">
      <section className="w-full grid grid-cols-2 bg-black p-3 lg:p-5">
        <div className=" relative w-fit">
          <Logo size="md" />
          <h1 className="absolute bottom-[20%] -right-27 text-4xl font-bold tracking-tight">SoundFolio</h1>
        </div>
        <div className="flex flex-col items-end *:w-fit *:text-2xl *:text-gold *:hover:text-cream *:duration-300 *:cursor-pointer font-bold uppercase">
          <h1>contact us</h1>
          <h1 onClick={() => handleOpen("feedback")}>feedback</h1>
          <h1 onClick={() => handleOpen("bug")}>report</h1>
        </div>
      </section>
      <section className="w-full items-center flex flex-col-reverse lg:flex-row lg:justify-between lg:items-end px-4 mt-2">
        <UserRegion />
        <div className="flex flex-col justify-center items-center lg:items-end mb-4 lg:mb-0">
          <SocialLinks social_links={appSocialLinks} />
          <Paragraph text="Soundfolio socials, follow us on" />
        </div>
      </section>
    </div>
  );
};

export default Footer;
