"use client";
import { motion } from "framer-motion";
import ArtistCountry from "@/app/components/materials/ArtistCountry";
import Actions from "./Actions";
import LinkActions from "./LinkActions";
import ArtistGenres from "@/app/components/materials/ArtistGenres";
import SocialLinks from "@/app/components/materials/SocialLinks";

const BasicInfo = ({ data }) => {
  const { name, stage_name, desc, label, country, city, social_links, genres } =
    data;
  const userRating = data.userRating || null;

  return (
    <div className="py-10 h-full overflow-hidden space-y-5 flex flex-col">
      <Actions data={data} userRating={userRating} />
      <div className="*:leading-none">
        <Title name={name} stage_name={stage_name} />
        <Genres genres={genres} />
      </div>
      <Country country={country} city={city} />
      <Description desc={desc} />
      <Label label={label} />
      <SocialLinks
        social_links={social_links}
        className="space-y-4"
        animation={true}
        animationDelay={1.2}
      />
      <LinkActions data={data} />
    </div>
  );
};

const Title = ({ name, stage_name }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="text-gold"
    >
      {stage_name && (
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg secondary capitalize text-gold"
        >
          {name}
        </motion.h1>
      )}
      <motion.h1
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="font-bold text-5xl md:text-6xl lg:text-7xl uppercase"
      >
        {stage_name || name}
      </motion.h1>
    </motion.div>
  );
};

const Genres = ({ genres }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    >
      <ArtistGenres genres={genres} />
    </motion.div>
  );
};

const Country = ({ country, city }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
    >
      <ArtistCountry artistCountry={{ country, city }} />
    </motion.div>
  );
};

const Description = ({ desc }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className="secondary text-chino text-xs lg:text-sm"
    >
      <p>{desc}</p>
    </motion.div>
  );
};

const Label = ({ label }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 1.0 }}
      className={
        label?.length > 6 ? "grid grid-cols-4 gap-2" : "flex space-x-2"
      }
    >
      {label?.map((item, idx) => (
        <h1
          key={idx}
          className={`px-4 py-1 cursor-pointer duration-300 hover:bg-emperor/40 bg-cream/20 border border-cream/30 rounded-sm uppercase text-cream font-bold ${
            label.length > 3 ? "text-xs" : "text-sm"
          }`}
        >
          {item}
        </h1>
      ))}
    </motion.div>
  );
};

export default BasicInfo;
