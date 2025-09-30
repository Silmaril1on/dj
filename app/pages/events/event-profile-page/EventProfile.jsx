import Actions from "./hero-components/Actions";
import BasicInfo from "./hero-components/BasicInfo";
import LineUp from "./hero-components/LineUp";
import PosterSide from "./hero-components/PosterSide";

const EventProfile = ({ event }) => {
  if (!event) return null;

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-between items-center pr-4">
       <LineUp data={event.artists} />
       <Actions event={event} />
      </div>
      <div className="flex">
        <article className="flex flex-1 justify-between items-start flex-col bg-stone-900  p-4">
          <BasicInfo event={event} />
        </article>
    <PosterSide src={event.event_image} />
      </div>
    </div>
  );
};

export default EventProfile;