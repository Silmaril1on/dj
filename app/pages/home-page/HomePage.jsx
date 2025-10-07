import AlbumLogo from "../AlbumLogo";
import AppDataStats from "./app-data-stats/AppDataStats";
import ArtistsSection from "./artists-section/ArtistsSection";
import BornToday from "./bord-today-section/BornToday";
import Events from "./events-section/Events";
import News from "./news-section/News";
import SubmitSection from "./submit-section/SubmitSection";

const HomePage = ({ events = [] }) => {
    return (
      <div className="flex-1 center flex-col space-y-10 ">
        <Events events={events} />
        <News />
        <ArtistsSection />
        <SubmitSection />
        <BornToday />
        <AppDataStats />
        {/* <AlbumLogo /> */}
      </div>
    );
}

export default HomePage