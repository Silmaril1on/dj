import React from "react";
import CacheComponent from "./CacheComponent";
import { getCacheRows } from "./actions";

const CachingPage = async () => {
  console.log("[PAGE] CachingPage rendering on server");

  const rows = await getCacheRows();

  console.log("[PAGE] Data received from action");

  return <CacheComponent rows={rows} />;
};

export default CachingPage;
