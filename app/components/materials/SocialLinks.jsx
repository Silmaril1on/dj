"use client"
import { FaFacebook, FaGlobe, FaInstagram, FaSoundcloud, FaSpotify, FaTwitter, FaYoutube } from 'react-icons/fa'
import { motion } from 'framer-motion'
import Icon from '@/app/components/ui/Icon'

const SocialLinks = ({
  social_links,
  className = "",
  iconSize = "w-5 h-5",
  showTitle = false,
  title = "Social Links",
  animation = true,
  animationDelay = 0
}) => {
  if (!social_links || social_links.length === 0) {
    return null
  }

  const getSocialIcon = (url) => {
    if (url.includes('facebook')) return <FaFacebook className={iconSize} />;
    if (url.includes('instagram')) return <FaInstagram className={iconSize} />;
    if (url.includes('youtube')) return <FaYoutube className={iconSize} />;
    if (url.includes('spotify')) return <FaSpotify className={iconSize} />;
    if (url.includes('soundcloud')) return <FaSoundcloud className={iconSize} />;
    if (url.includes('twitter') || url.includes('x.com')) return <FaTwitter className={iconSize} />;
    return <FaGlobe className={iconSize} />;
  };

  const SocialLink = ({ link, index }) => {
    const linkElement = (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="group"
      >
        <Icon icon={getSocialIcon(link)} />
      </a>
    )

    if (animation) {
      return (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: animationDelay + index * 0.1 }}
        >
          {linkElement}
        </motion.div>
      )
    }

    return linkElement
  }

  return (
    <div className={className}>
      {showTitle && (
        <h4 className="text-md font-semibold text-gold mb-2">{title}</h4>
      )}
      <div className="flex flex-wrap gap-4">
        {social_links.map((link, index) => (
          <SocialLink key={index} link={link} index={index} />
        ))}
      </div>
    </div>
  )
}

export default SocialLinks