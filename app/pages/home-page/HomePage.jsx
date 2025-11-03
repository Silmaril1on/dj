import MotionLogo from "@/app/components/ui/MotionLogo";
import AppDataStats from "./app-data-stats/AppDataStats";
import ArtistsSection from "./artists-section/ArtistsSection";
import BornToday from "./bord-today-section/BornToday";
import Events from "./events-section/Events";
import News from "./news-section/News";
import MyRecentlyViews from "./recently-viewd-section/MyRecentlyViews";
import SubmitSection from "./submit-section/SubmitSection";




const HomePage = ({ events = [] }) => {
    return (
      <div className="flex-1 center flex-col space-y-10 ">
        <Events events={events} />
        <News />
        <ArtistsSection />
        <SubmitSection />
        {/* <BornToday /> */}
        <AppDataStats />
        <MyRecentlyViews />
      </div>
    );
}

export default HomePage