import AppDataStats from "./app-data-stats/AppDataStats";
import ArtistsSection from "./artists-section/ArtistsSection";
import BornToday from "./bord-today-section/BornToday";
import Events from "./events-section/Events";
import NearYou from "./nearYouEvents-section/NearYou";
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
      <NearYou />
      <AppDataStats />
      <MyRecentlyViews />
      {/* <div className="h-screen center w-full gap-10">
        <div className="w-64 h-64 rounded-full overflow-hidden">
          <img src="/assets/menu-icon-1.webp" className="scale-125" />
        </div>
        <div className="w-64 h-64 rounded-full overflow-hidden">
          <img
            src="/assets/menu-icon-2.jpg"
            className="scale-125 h-full w-full object-cover"
          />
        </div>
        <div className="w-30 h-30 rounded-full"></div>
      </div> */}
    </div>
  );
};

export default HomePage;
