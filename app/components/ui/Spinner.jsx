import Image from "next/image";

const Spinner = ({ className = "", size, type }) => {
  let sizeClass = "w-5 h-5";
  if (size === "sm") sizeClass = "w-3 h-3";
  if (size === "lg") sizeClass = "w-7 h-7";

  if (type === "logo") {
    return (
      <div
        className={`flex w-20 h-20 bg-stone-900 p-2 animate-spin relative items-center justify-center rounded-full ${sizeClass} ${className}`}
        >
        <div className="absolute inset-0 bg-black rounded-full scale-15 z-[2]"></div>
        <Image
          width={80}
          height={80}
          alt="Elivagar Logo"
          src="/assets/elivagar-logo.png"
          className="w-full h-full object-cover relative"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full ${sizeClass} ${className}`}
    >
      <div className="animate-spin rounded-full w-full h-full border-t-3 border-gold"></div>
    </div>
  );
};

export default Spinner;
