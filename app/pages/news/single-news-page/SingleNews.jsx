"use client"
import Title from "@/app/components/ui/Title";
import Paragraph from "@/app/components/ui/Paragraph";
import ProfilePicture from "@/app/components/materials/ProfilePicture";
import MyLink from "@/app/components/ui/MyLink";
import EmailTag from '@/app/components/ui/EmailTag';
import SpanText from "@/app/components/ui/SpanText";
import { formatTime } from "@/app/helpers/utils";
import { FaLink } from "react-icons/fa";
import useRecentlyViewed from "@/app/lib/hooks/useRecentlViewed";

const SingleNews = ({ news }) => {
  if (!news) return <div>News not found.</div>;
  
    useRecentlyViewed("news", news.id);

  return (
    <div className=" py-4 px-[10%] bg-stone-900 rounded">
      <div className="mb-4 pb-2 border-b border-gold/30">
        <div className="flex items-center gap-2">
          <ProfilePicture avatar_url={news.submitter.user_avatar} />
          <div>
            <div className="font-bold">{news.submitter.userName}</div>
            <SpanText
              color="cream"
              size="xs"
              text={formatTime(news.created_at)}
            />
          </div>
        </div>
        <EmailTag email={news.submitter.email} />
      </div>
      <Title text={news.title} size="xl" />
      <Paragraph text={news.description} className="mt-2" />
          <div className=" px-[20%]">
        <img
          src={news.news_image}
          alt={news.title}
          className="w-full h-full rounded my-4"
        />
      </div>
      <Paragraph text={news.content} className="mb-4" />
      <MyLink icon={<FaLink />} href={news.link} text="External Link" />
    </div>
  );
};

export default SingleNews;