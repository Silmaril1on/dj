import Security from "@/app/(routes)/my-profile/security/Security";
import React from "react";

export const metadata = {
  title: "Soundfolio | Security",
  description:
    "Manage your Soundfolio account security — update your password and connected accounts.",
};

const SecurityPage = () => {
  return (
    <div className="text-center py-4">
      <Security />
    </div>
  );
};

export default SecurityPage;
