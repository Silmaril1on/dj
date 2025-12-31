import Title from "@/app/components/ui/Title";
import ParaLink from "@/app/components/ui/ParaLink";
import Paragraph from "../ui/Paragraph";

const FormContainer = ({
  title,
  children,
  footerText,
  footerLinkText,
  footerHref,
  description,
  maxWidth = "",
}) => {
  return (
    <div className="min-h-screen flex flex-1 items-center justify-center bg-black py-5 px-3">
      <div
        className={`${maxWidth} center flex-col p-8 bg-stone-900 border border-gold/30 shadow-xl dark:shadow-gold/15`}
      >
        <Title text={title} />
        <Paragraph text={description} />
        {children}
        {footerText && footerLinkText && footerHref && (
          <ParaLink
            text={footerText}
            href={footerHref}
            linkText={footerLinkText}
          />
        )}
      </div>
    </div>
  );
};

export default FormContainer;
