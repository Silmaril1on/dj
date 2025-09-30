import ActivityHeader from "@/app/pages/my-profile-page/activities/ActivityHeader";

const ActivitiesLayout = ({ children, sideSection }) => {
  return (
    <div>
      <ActivityHeader />
      <div className="flex p-4 gap-4 min-h-screen">
        <div className="w-[60%]">{children}</div>
        <div className="w-[40%] h-fit sticky top-0 overflow-hidden">{sideSection}</div>
      </div>
    </div>
  );
};

export default ActivitiesLayout;
