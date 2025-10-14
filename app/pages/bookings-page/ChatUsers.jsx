"use client";
import { useState, useEffect } from "react";
import { formatTime } from "@/app/helpers/utils";
import SpanText from "@/app/components/ui/SpanText";
import ProfilePicture from "@/app/components/materials/ProfilePicture";
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

  useEffect(() => {
    setChatUsers(initialChatUsers);
  }, [initialChatUsers]);

  if (initialError) {
    return (
      <div className="w-[30%] flex">
        <SectionContainer title="Error" className="bg-stone-900">
          <SpanText text={initialError} color="red" />
        </SectionContainer>
      </div>
    );
  }

  if (!chatUsers.length) {
    return (
      <div className="w-[30%] flex">
        <SectionContainer title="No Booking Requests" className="bg-stone-900">
          <SpanText text="You don't have any booking requests yet" />
        </SectionContainer>
      </div>
    );
  }

  return (
    <div className="w-[30%] flex" >
      <SectionContainer
        title="Booking Requests"
        className="bg-stone-900"
        description={`${chatUsers.length} request${
          chatUsers.length !== 1 ? "s" : ""
        }`}
      >
        <div className="overflow-y-auto h-full w-full space-y-2">
          {chatUsers.map((chatUser) => {
            // Check booking status
            const isConfirmed = chatUser.response === "confirmed";
            const isDeclined = chatUser.response === "declined";
            const isSelected = selectedId === chatUser.id;
            
            // Determine styling based on status
            let containerClass = "";
            if (isConfirmed) {
              containerClass = "bg-green-500/20 border border-green-500/30";
            } else if (isDeclined) {
              containerClass = "bg-red-500/20 border border-red-500/30";
            } else if (isSelected) {
              containerClass = "bg-stone-800 hover:bg-stone-900";
            } else {
              containerClass = "bg-stone-950 hover:bg-stone-800";
            }
            
            return (
              <div
                key={chatUser.id}
                className={`p-2 relative flex gap-2 cursor-pointer items-center duration-300 ${containerClass}`}
                onClick={() => {
                  setSelectedId(chatUser.id);
                  if (onSelectBooking) {
                    onSelectBooking(chatUser.id);
                  }
                }}
              >
                {/* Status indicators */}
                {isConfirmed && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-green-500 animate-pulse rounded-full"></div>
                  </div>
                )}
                {isDeclined && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-red-500 animate-pulse rounded-full"></div>
                  </div>
                )}

                <ProfilePicture
                  avatar_url={chatUser.display_user?.avatar}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Title
                      text={
                        chatUser.display_user?.userName ||
                        chatUser.display_user?.full_name
                      }
                      size="xs"
                    />
                    {isConfirmed && (
                      <SpanText
                        text="Confirmed"
                        size="xs"
                        className="text-green-400 font-medium"
                      />
                    )}
                    {isDeclined && (
                      <SpanText
                        text="Declined"
                        size="xs"
                        className="text-red-400 font-medium"
                      />
                    )}
                  </div>

                  <SpanText
                    size="xs"
                    color="cream"
                    text={
                      chatUser.user_role === "requester"
                        ? `Booking ${
                            chatUser.display_user?.userName ||
                            chatUser.display_user?.full_name
                          }`
                        : `Request from ${
                            chatUser.display_user?.full_name || "User"
                          }`
                    }
                  />
                  {chatUser.display_user?.email && (
                    <EmailTag email={chatUser.display_user.email} />
                  )}
                  <div className="flex justify-between items-center w-full">
                    <SpanText
                      text={chatUser.event_name}
                      size="xs"
                      className="text-stone-300 mb-1"
                    />
                    <SpanText
                      size="xs"
                      color="cream"
                      text={formatTime(chatUser.created_at)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SectionContainer>
    </div>
  );
};

export default ChatUsers;
