"use client";
import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import Paragraph from "@/app/components/ui/Paragraph";
import Title from "@/app/components/ui/Title";
import ErrorCode from "@/app/components/ui/ErrorCode";
import { motion } from "framer-motion";
import FlexBox from "@/app/components/containers/FlexBox";
import MyLink from "@/app/components/ui/MyLink";
import { truncateString } from "@/app/helpers/utils";
import { FaLink } from "react-icons/fa";

const News = () => {
  const [newsData, setNewsData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchNews = async () => {
      const res = await fetch("/api/news?limit=15&offset=0");
      const data = await res.json();
      setNewsData(data.data || []);
    };
    fetchNews();
  }, []);

  useEffect(() => {
    if (newsData.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === newsData.length - 1 ? 0 : prevIndex + 1,
      );
    }, 7000);
    return () => clearInterval(interval);
  }, [newsData]);

  const currentNews = newsData[currentIndex];

  if (!currentNews) return null;

  const handleDotClick = (index) => {
    setCurrentIndex(index);
  };

  if (newsData?.length === 0) {
    return (
      <div className="w-full flex flex-col items-center">
        <ErrorCode
          title="No News Available"
          description="There are currently no news items to display. Please check back later."
        />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center  mt-20 lg:mt-0">
      <div className="leading-none center flex-col mb-5">
        <Title text="Latest News" />
        <Paragraph text="Catch the latest stories, trends, and highlights" />
      </div>
      <div className="w-full relative h-[200px] lg:h-[400px] overflow-hidden">
        <AnimatePresence>
          <ImageSide
            key={`image-${currentIndex}`}
            currentIndex={currentIndex}
            currentNews={currentNews}
          />
          <ContentSide
            key={`content-${currentIndex}`}
            currentNews={currentNews}
          />
        </AnimatePresence>
      </div>
      <FooterSlide
        currentIndex={currentIndex}
        handleDotClick={handleDotClick}
        newsData={newsData}
      />
    </div>
  );
};

const ContentSide = ({ currentNews }) => {
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
  return (
    <motion.article
      className="left-clip bg-stone-900 absolute right-3 lg:right-30 top-0 w-[55%] lg:w-2/4 h-full"
      variants={contentVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="pl-15 lg:pl-30 h-full flex flex-col items-end justify-between p-5">
        <FlexBox type="column-end" className="w-full lg:max-w-[70%]">
          <Title
            text={currentNews.title}
            color="gold"
            className="text-end text-xs leading-none lg:leading-6"
          />
        </FlexBox>
        <div className="flex items-end flex-col">
          <p className="text-[9px] lg:text-sm text-cream secondary text-end">
            {truncateString(currentNews.description, 300)}
          </p>
          <MyLink
            href={`/news/${currentNews.id}`}
            text="Read more"
            icon={<FaLink size={12} />}
          />
        </div>
      </div>
    </motion.article>
  );
};

const ImageSide = ({ currentNews }) => {
  const imageVariants = {
    initial: {
      x: "-100%",
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
      x: "-100%",
      opacity: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };
  return (
    <motion.div
      className="right-clip h-full w-[55%] lg:w-2/4 left-3 lg:left-30 top-0 absolute"
      variants={imageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <img loading="lazy"
        src={currentNews.news_image}
        alt="news"
        className="w-full h-full object-cover"
      />
    </motion.div>
  );
};

const FooterSlide = ({ currentIndex, handleDotClick, newsData }) => {
  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      {newsData.map((_, index) => (
        <button
          key={index}
          onClick={() => handleDotClick(index)}
          className={` h-2 lg:h-3 duration-300 cursor-pointer ${
            index === currentIndex
              ? "bg-yellow-500 scale-110 w-4 lg:w-8"
              : "bg-chino hover:bg-cream w-2 lg:w-3"
          }`}
          aria-label={`Go to news item ${index + 1}`}
        />
      ))}
    </div>
  );
};

export default News;
