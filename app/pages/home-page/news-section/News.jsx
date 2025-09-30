"use client";
import { newsData } from "@/app/localDB/fakeBornData";
import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import ImageSide from "./ImageSide";
import ContentSide from "./ContentSide";
import FooterSide from "./FooterSide";
import Paragraph from "@/app/components/ui/Paragraph";
import Title from "@/app/components/ui/Title";

const News = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === newsData.length - 1 ? 0 : prevIndex + 1
      );
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const currentNews = newsData[currentIndex];

  const handleDotClick = (index) => {
    setCurrentIndex(index);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className=" leading-none center flex-col mb-5">
        <Title text="Latest News" />
        <Paragraph text="Catch the latest stories, trends, and highlights—all in one place." />
      </div>
      <div className="w-full relative h-[400px] overflow-hidden">
        <AnimatePresence>
          <ImageSide
            key={`image-${currentIndex}`}
            currentIndex={currentIndex}
            currentNews={currentNews}
          />
          <ContentSide
            key={`content-${currentIndex}`}
            currentIndex={currentIndex}
            currentNews={currentNews}
          />
        </AnimatePresence>
      </div>
      <FooterSide
        currentIndex={currentIndex}
        handleDotClick={handleDotClick}
        newsData={newsData}
      />
    </div>
  );
};

export default News;
