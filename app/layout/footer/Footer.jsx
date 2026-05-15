"use client";
import { useDispatch, useSelector } from "react-redux";
import { openReportModal } from "@/app/features/reportsSlice";
import { setError } from "@/app/features/modalSlice";
import { appSocialLinks } from "@/app/lib/localDB/pageInfoData";
import { footerData } from "@/app/lib/localDB/LinksData";
import SocialLinks from "@/app/components/materials/SocialLinks";
import Paragraph from "@/app/components/ui/Paragraph";
import Logo from "@/app/components/ui/Logo";
import { selectUser } from "@/app/features/userSlice";
import UserRegion from "@/app/components/materials/UserRegion";
import Link from "next/link";

const Footer = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  const handleOpen = (type) => {
    if (type !== "contact" && !user) {
      dispatch(
        setError({
          message: "Please login to send feedback or report",
          type: "basic",
          action: "login",
        }),
      );
      return;
    }
    dispatch(openReportModal(type));
  };

  return (
    <div
      className={`center flex-col gap-2 bg-stone-950 border-t border-gold/30 pb-5 ${user ? "mb-10 lg:mb-0" : " "}`}
    >
      <section className="w-full grid grid-cols-2 bg-black p-3 lg:p-5">
        <div className="relative w-fit">
          <Logo size="md" />
          <h1 className="absolute bottom-[12%] hidden lg:block font-bold -right-34 uppercase text-4xl tracking-tight">
            SoundFolio
          </h1>
        </div>
        <div className="flex flex-col justify-center gap-1 items-end lg:items-end mb-4 lg:mb-0">
          <SocialLinks social_links={appSocialLinks} />
          <Paragraph text="Follow Soundfolio on" />
        </div>
      </section>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-12 py-6 w-full px-6 max-w-3xl mx-auto mb-5">
        {footerData.map((group) => (
          <div key={group.title} className="flex flex-col items-center gap-1">
            <h3 className="text-gold text-2xl uppercase font-bold  pb-1">
              {group.title}
            </h3>
            {group.items.map((item) =>
              item.href ? (
                <Link
                  key={item.text}
                  href={item.href}
                  className="text-chino hover:text-cream secondary text-xs duration-300"
                >
                  {item.text}
                </Link>
              ) : (
                <button
                  key={item.text}
                  onClick={() => handleOpen(item.action)}
                  className="text-chino hover:text-cream secondary text-xs duration-300 cursor-pointer"
                >
                  {item.text}
                </button>
              ),
            )}
          </div>
        ))}
      </section>
      <UserRegion />
      <p className="secondary text-[9px] text-chino">
        © {new Date().getFullYear()} Soundfolio. All rights reserved.
      </p>
    </div>
  );
};

export default Footer;
