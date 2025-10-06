"use client";
import { useState } from "react";
import { formatTime } from "@/app/helpers/utils";
import SpanText from "@/app/components/ui/SpanText";
import ProfilePicture from "@/app/components/materials/ProfilePicture";
import FlexBox from "@/app/components/containers/FlexBox";
import SectionContainer from "@/app/components/containers/SectionContainer";
import Title from "@/app/components/ui/Title";
import EmailTag from "@/app/components/ui/EmailTag";

const ChatUsers = ({
  initialChatUsers = [],
  onSelectBooking,
  initialError,
}) => {
  const [chatUsers, setChatUsers] = useState(initialChatUsers);
  const [selectedId, setSelectedId] = useState(null);

  return (
    <div className="w-[30%] flex ">
      <SectionContainer
        title="Booking Requests"
        className=" bg-stone-900"
        description={`${chatUsers.length} request${
          chatUsers.length !== 1 ? "s" : ""
        }`}
      >
        <div className="overflow-y-auto h-full w-full">
          {chatUsers.map((chatUser) => (
            <div
              key={chatUser.id}
              className={`p-2 cursor-pointer duration-300 hover:bg-stone-800 ${
                selectedId === chatUser.id ? "bg-stone-900" : "bg-stone-950"
              }`}
              onClick={() => {
                setSelectedId(chatUser.id);
                if (onSelectBooking) {
                  onSelectBooking(chatUser.id);
                }
              }}
            >
              <FlexBox className="gap-2">
                <ProfilePicture
                  avatar_url={chatUser.requester?.user_avatar}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <FlexBox type="column-start">
                    <Title
                      text={
                        chatUser.requester?.full_name ||
                        chatUser.requester?.userName ||
                        "Unknown User"
                      }
                      size="xs"
                    />
                    <div className="flex flex-col lg:flex-row justify-between items-center w-full">
                      <EmailTag email={chatUser.requester?.email} />
                      <SpanText
                        size="xs"
                        color="cream"
                        text={formatTime(chatUser.created_at)}
                      />
                    </div>
                  </FlexBox>
                </div>
              </FlexBox>
            </div>
          ))}
        </div>
      </SectionContainer>
    </div>
  );
};

export default ChatUsers;
