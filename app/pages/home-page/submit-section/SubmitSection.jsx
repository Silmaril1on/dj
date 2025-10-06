"use client";
import { setError } from "@/app/features/modalSlice";
import { selectUser } from "@/app/features/userSlice";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { SiYoutubemusic, SiNeteasecloudmusic } from "react-icons/si";
import { MdEvent } from "react-icons/md";
import Motion from "@/app/components/containers/Motion";
import Title from "@/app/components/ui/Title";
import Paragraph from "@/app/components/ui/Paragraph";
import Image from "next/image";

const SubmitSection = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

const handleSubmit = (type) => {
  switch (type) {
    case "artist":
      if (!user) {
        dispatch(
          setError({ message: "Please login to add artists", type: "error" })
        );
      } else if (user?.submitted_artist_id) {
        dispatch(
          setError({
            message: "You have already submitted an artist",
            type: "error",
          })
        );
      } else {
        router.push("/add-product/add-artist");
      }
      break;

    case "club":
      if (!user) {
        dispatch(
          setError({ message: "Please login to add clubs", type: "error" })
        );
      } else if (user?.submitted_club_id) {
        dispatch(
          setError({
            message: "You have already submitted a club",
            type: "error",
          })
        );
      } else {
        router.push("/add-product/add-club");
      }
      break;

    case "event":
      if (!user) {
        dispatch(
          setError({ message: "Please login to add events", type: "error" })
        );
      } else {
        router.push("/add-product/add-event");
      }
      break;

    default:
      break;
  }
};


  const cards = [
    {
      type: "artist",
      title: "Add Artist",
      description:
        "Submit a new DJ or electronic music artist to our database. Help expand our community's music collection.",
      icon: <SiYoutubemusic />,
    },
    {
      type: "club",
      title: "Add Club",
      description:
        "Add a new venue or club to our directory. Share the best spots for electronic music events.",
      icon: <SiNeteasecloudmusic/>,
    },
    {
      type: "event",
      title: "Add Event",
      description:
        "Create and manage your upcoming events. Connect with fans and promote your shows.",
      icon: <MdEvent />,
    },
  ];

  return (
    <div className="py-20 overflow-hidden relative">
      <Motion animation="fade" delay={1} className="absolute w-98 h-98 -right-10 sepia -bottom-22 rotate-[65deg] -z-[1] brightness-20 blur-[2px]">
        <Image src="/assets/elivagar-logo.png" alt="Elivagar Logo" width={300} height={300} className="w-full h-full"/>
      </Motion>
      <div className="w-full center flex-col mb-10">
        <Title text="Submit New Content" />
        <Paragraph  text="Contribute to our community by adding new artists, clubs, or events. Your submissions help keep our platform vibrant and up-to-date." />
      </div>
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 px-[10%] overflow-hidden">
        {cards.map(({ type, title, description, icon: Icon }, index) => (
          <Motion
            animation="top"
            delay={index * 0.05}
            key={type}
            onClick={() => handleSubmit(type)}
            className="group relative bg-gradient-to-br from-gold/20 to-gold/10 border border-gold/30 rounded-lg p-6 cursor-pointer hover:border-gold/60 hover:bg-gradient-to-br hover:from-gold/30 hover:to-gold/20 transition-all duration-300"
          >
            <div className="text-center space-y-4">
              <div className="mx-auto text-2xl w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center group-hover:bg-gold/30 transition-colors duration-300">
                <span>{Icon}</span>
              </div>
              <h3 className="text-xl font-bold text-gold group-hover:text-gold/90 transition-colors duration-300">
                {title}
              </h3>
              <p className="text-sm text-chino/80 leading-relaxed">
                {description}
              </p>
            </div>
          </Motion>
        ))}
      </div>
    </div>
  );
};

export default SubmitSection;
