import ActivityHeader from "@/app/pages/my-profile-page/activities/ActivityHeader";
import SideContent from "@/app/pages/my-profile-page/activities/side-content/SideContent";

const ActivitiesLayout = ({ children }) => {
  return (
    <div>
      <ActivityHeader />
      <div className="flex">
        <div className="w-[60%]">{children}</div>
        <SideContent />
      </div>
    </div>
  );
};

export default ActivitiesLayout;
