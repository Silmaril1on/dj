"use client";
import FlexBox from "@/app/components/containers/FlexBox";
import MyLink from "@/app/components/ui/MyLink";
import Paragraph from "@/app/components/ui/Paragraph";
import Title from "@/app/components/ui/Title";
import { truncateString } from "@/app/helpers/utils";
import { motion } from "framer-motion";
import { FaLink } from "react-icons/fa";

 const contentVariants = {
         initial: {
           x: "100%",
           opacity: 0,
         },
         animate: {
           x: 0,
           opacity: 1,
           transition: {
             duration: 0.6,
             ease: [0.25, 0.1, 0.25, 1],
           },
         },
         exit: {
           x: "100%",
           opacity: 0,
           transition: {
             duration: 0.4,
             ease: [0.25, 0.1, 0.25, 1],
           },
         },
       };


const ContentSide = ({  currentNews }) => {

  return (
    <motion.article
      className="left-clip bg-stone-900 absolute right-[7.5%] lg:right-30 top-0 w-2/4 h-full"
      variants={contentVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="pl-15 lg:pl-30 h-full flex flex-col items-end justify-between p-5">
        <FlexBox type="column-end" className="w-full lg:max-w-[70%]">
          <Title text={currentNews.title} color="gold" className="text-end text-xs" />
        </FlexBox>
        <div className="flex items-end flex-col">
          <p className="text-[9px] lg:text-sm text-cream secondary text-end">
            {truncateString(currentNews.content, 150)}
          </p>
          <MyLink
            href={`/news/${currentNews.id}`}
            text="Read more..."
            icon={<FaLink />}
          />
        </div>
      </div>
    </motion.article>
  );
}

export default ContentSide