"use client";
import { useDispatch } from "react-redux";
import { openReportModal } from "@/app/features/reportsSlice";
import { setError } from "@/app/features/modalSlice"; // ✅ import setError
import { appSocialLinks } from "@/app/localDB/pageInfoData";
import SocialLinks from "@/app/components/materials/SocialLinks";
import Paragraph from "@/app/components/ui/Paragraph";
import FlexBox from "@/app/components/containers/FlexBox";
import Logo from "@/app/components/ui/Logo";

const Footer = ({ user }) => {
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
      <div className="w-full grid grid-cols-1 md:grid-cols-2 bg-black p-5">
        <div className="flex">
          <Logo size="md" />
        </div>
        <div className="flex flex-col items-end *:w-fit *:text-2xl *:text-gold *:hover:text-cream *:duration-300 *:cursor-pointer font-bold uppercase">
          <h1>contact us</h1>
          <h1 onClick={() => handleOpen("feedback")}>feedback</h1>
          <h1 onClick={() => handleOpen("bug")}>report</h1>
        </div>
      </div>
      <FlexBox type="row-between" className="w-full items-center px-4 mt-2">
        <div>hello</div>
        <div className="flex flex-col items-end">
          <Paragraph text="Soundfolio socials, follow us on" />
          <SocialLinks social_links={appSocialLinks} />
        </div>
      </FlexBox>
    </div>
  );
};

export default Footer;
