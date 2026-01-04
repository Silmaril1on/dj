import ShareButton from "@/app/components/buttons/artist-buttons/ShareButton";
import EditProduct from "@/app/components/buttons/EditProduct.";
import Motion from "@/app/components/containers/Motion";
import { motion } from "framer-motion";
import Image from "next/image";

const Avatar = ({ data }) => {
  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="relative overflow-hidden shadow-2xl ">
        <Motion
          className="absolute top-5 left-5 text-2xl z-20"
          animation="fade"
          delay={1.5}
        >
          <ShareButton artistName={data.name} />
        </Motion>
        <Motion
          className="absolute top-18 left-5 text-2xl z-10"
          animation="fade"
          delay={1.7}
        >
          <EditProduct data={data} type="artist" className="rounded-full" />
        </Motion>
        <motion.div
          className="relative w-full h-[450px] lg:h-[700px]"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <Image
            src={data.artist_image}
            alt={data.name}
            width={900}
            height={900}
            className="object-cover w-full h-full transition-transform duration-700"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Avatar;
