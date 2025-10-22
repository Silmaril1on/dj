import Image from "next/image";
import Link from "next/link";

const Logo = ({ size = "sm", className }) => {
  const sizeClasses = {
    xs: "w-10 h-10",
    sm: "w-14 h-14",
    md: "w-22 h-22",
    lg: "w-26 h-26",
  };

  return (
    <Link href="/">
      <div className={`${className} ${sizeClasses[size]}`}>
        <Image
          className="sepia w-full h-full"
          src="/assets/elivagar-logo.png"
          alt="DJDB Logo"
          width={150}
          height={150}
        />
      </div>
    </Link>
  );
};

export default Logo;
