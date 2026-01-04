"use client";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  MdEvent,
  MdAccessTime,
  MdCalendarToday,
  MdEdit,
  MdDelete,
} from "react-icons/md";
import { selectUser } from "@/app/features/userSlice";
import { openAddEventModal } from "@/app/features/modalSlice";
import ArtistCountry from "@/app/components/materials/ArtistCountry";
import SectionContainer from "@/app/components/containers/SectionContainer";
import Title from "@/app/components/ui/Title";
import MyLink from "@/app/components/ui/MyLink";
import FlexBox from "@/app/components/containers/FlexBox";
import { formatBirthdate } from "@/app/helpers/utils";
import Spinner from "@/app/components/ui/Spinner";

const ArtistSchedule = ({
  artistId,
  clubId,
  data: passedData,
  title = "Upcoming Dates",
  description = "Stay updated with upcoming dates",
  artistData = null, // Artist data for permission check
  clubData = null, // Club data for permission check
}) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (passedData) {
      setData(passedData);
      setLoading(false);
      return;
    }

    const fetchSchedule = async () => {
      try {
        setLoading(true);
        let response;
        // Determine which API endpoint to use
        if (artistId) {
          response = await fetch(`/api/artists/${artistId}/schedule`);
        } else if (clubId) {
          response = await fetch(`/api/club/${clubId}/events`);
        } else {
          setError("No ID provided");
          setLoading(false);
          return;
        }
        const result = await response.json();
        if (result.success) {
          setData(result.data || []);
        } else {
          setError(result.error);
        }
      } catch (err) {
        console.error("Error fetching schedule:", err);
        setError("Failed to load schedule");
      } finally {
        setLoading(false);
      }
    };

    if (artistId || clubId) {
      fetchSchedule();
    }
  }, [artistId, clubId, passedData]);

  // Check if user can edit (admin or owner)
  const canEdit = () => {
    if (!user) return false;

    // Admin can always edit
    if (user.is_admin) return true;

    // Check if user is the artist owner
    if (artistData && artistId) {
      return user.submitted_artist_id === parseInt(artistId);
    }

    // Check if user is the club owner
    if (clubData && clubId) {
      if (typeof user.submitted_club_id === "number") {
        return user.submitted_club_id === parseInt(clubId);
      }
      if (Array.isArray(user.submitted_club_id)) {
        return user.submitted_club_id.includes(parseInt(clubId));
      }
    }

    return false;
  };

  const handleEditEvent = (schedule) => {
    dispatch(
      openAddEventModal({
        artist: artistData || { id: artistId },
        eventData: schedule,
      })
    );
  };

  const handleDeleteEvent = async (scheduleId) => {
    if (!confirm("Are you sure you want to delete this schedule?")) {
      return;
    }

    try {
      const response = await fetch(`/api/artists/schedule/${scheduleId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Remove the deleted schedule from local state
        setData((prevData) => prevData.filter((s) => s.id !== scheduleId));
      } else {
        alert(result.error || "Failed to delete schedule");
      }
    } catch (err) {
      console.error("Error deleting schedule:", err);
      alert("Failed to delete schedule");
    }
  };

  if (loading) {
    return (
      <div className="w-auto center py-20 bg-stone-900 mt-4 mx-3 min-h-[400px]">
        <Spinner type="logo" />
      </div>
    );
  }

  if (error || !data || data.length === 0) {
    return null;
  }

  console.log(data, "dattttttttt");

  return (
    <SectionContainer title={title} description={description} className="mt-10">
      <div className="w-full lg:w-[70%] space-y-2 lg:space-y-4 my-5">
        {data.map((schedule, index) => (
          <motion.div
            key={schedule.id}
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-stone-900 py-1 lg:py-2 px-2 lg:px-4 bordered lg:hover:scale-105 relative"
          >
            <div className="grid grid-cols-2 lg:grid-cols-[4fr_2fr] items-center">
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-1 lg:gap-0">
                {/* Date */}
                <div className="flex items-center gap-2 text-gold">
                  {/* Edit & Delete Buttons - Only visible to admin or owner */}
                  {canEdit() && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditEvent(schedule);
                        }}
                        className="p-1 bg-gold/20 hover:bg-gold/40 cursor-pointer duration-200 z-10 relative"
                        title="Edit event"
                      >
                        <MdEdit className="text-gold text-xs lg:text-sm" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEvent(schedule.id);
                        }}
                        className="p-1 bg-red-500/20 hover:bg-red-500/40 cursor-pointer duration-200 z-10 relative"
                        title="Delete event"
                      >
                        <MdDelete className="text-red-500 text-xs lg:text-sm" />
                      </button>
                    </>
                  )}
                  <MdCalendarToday size={18} />
                  <span className="font-semibold text-xs lg:text-lg  pointer-events-none">
                    {formatBirthdate(schedule.date)}
                  </span>
                </div>
                {/* Time */}
                <div className="flex justify-start lg:justify-center items-center gap-2 text-xs lg:text-base text-chino font-bold pointer-events-none">
                  <MdAccessTime />
                  <span>{schedule.time}</span>
                </div>
                {/* Location */}
                <div className="flex justify-start lg:justify-center items-center gap-2 text-chino pointer-events-none">
                  <ArtistCountry
                    artistCountry={{
                      country: schedule.country,
                      city: schedule.city,
                    }}
                  />
                </div>
              </section>

              {/* Club/Venue Name or Event Name */}
              <div className="flex flex-col items-end justify-evenly">
                <Title
                  text={
                    clubId
                      ? schedule.event_name
                      : (schedule.event_title || schedule.club_name)?.length >
                          40
                        ? (schedule.event_title || schedule.club_name).slice(
                            0,
                            30
                          ) + "..."
                        : schedule.event_title || schedule.club_name
                  }
                  className="pointer-events-none text-end"
                />
                <FlexBox type="row-center" className="gap-4">
                  {schedule.event_link && (
                    <MyLink
                      color="chino"
                      icon={<MdEvent />}
                      href={schedule.event_link}
                      text="View Event"
                      target="_blank"
                    />
                  )}
                  {schedule.event_id && (
                    <MyLink
                      color="chino"
                      icon={<MdEvent />}
                      href={`/events/${schedule.event_id}`}
                      text="View Event Page"
                    />
                  )}
                </FlexBox>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionContainer>
  );
};

export default ArtistSchedule;
