import React from "react";

export const metadata = {
  title: "DJDB | Reports",
  description: "reports",
};

const ReportsLayout = ({ children, bugs, feedbacks, messages }) => {
  return (
    <div className="flex *:w-full px-4 mt-4 gap-4">
      {messages}
      {feedbacks}
      {bugs}
    </div>
  );
};

export default ReportsLayout;
