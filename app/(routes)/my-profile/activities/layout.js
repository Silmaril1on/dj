import ActivityHeader from "@/app/pages/my-profile-page/activities/ActivityHeader";

const ActivitiesLayout = ({ children, sideSection }) => {
  return (
    <div>
      <ActivityHeader />
      <div className="flex flex-col lg:flex-row p-3 lg:p-4 gap-4 min-h-screen">
        <div className="w-full lg:w-[60%]">{children}</div>
        <div className="w-full lg:w-[40%] hidden lg:block h-fit sticky top-0 overflow-hidden">{sideSection}</div>
      </div>
    </div>
  );
};

export default ActivitiesLayout;
