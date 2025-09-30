import Security from "@/app/pages/my-profile-page/security/Security";
import React from "react";

export const metadata = {
  title: "My Profile | Security",
  description: "Security",
};

const SecurityPage = () => {
  return (
    <div className="text-center py-4">
     <Security />
    </div>
  );
};

export default SecurityPage;
