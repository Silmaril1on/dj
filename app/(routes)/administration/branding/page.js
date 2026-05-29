import React from "react";
import Branding from "./Branding";
import { getBranding } from "@/app/lib/services/admin/branding";

const BrandingPage = async () => {
  let branding = null;
  try {
    branding = await getBranding();
  } catch {
    // Table may not exist yet; component will handle null gracefully
  }

  return (
    <div className="center bg-black relative">
      <Branding branding={branding} />
    </div>
  );
};

export default BrandingPage;
