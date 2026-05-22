import Title from "@/app/components/ui/Title";
import Paragraph from "../ui/Paragraph";
import Logo from "../ui/Logo";
import Link from "next/link";

const FormContainer = ({
  title,
  children,
  footerText,
  footerLinkText,
  footerHref,
  description,
  className,
}) => {
  return (
    <div className="min-h-screen flex flex-1 items-center justify-center bg-black py-5 px-3">
      <div
        className={` ${className} center flex-col p-8 bg-stone-900 border border-gold/30 shadow-xl dark:shadow-gold/15`}
      >
        <Logo />
        <Title text={title} />
        <Paragraph text={description} />
        {children}
        {footerText && footerLinkText && footerHref && (
          <p className="text-xs text-stone-200 secondary mt-3">
            {footerText}
            <Link
              href={footerHref}
              className="font-bold  text-gold/70 hover:text-gold ml-1 duration-300"
            >
              {footerLinkText}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default FormContainer;
