import { MdPerson, MdSecurity, MdAnalytics } from "react-icons/md";
import { FiActivity } from "react-icons/fi";

export const userProfileLinks = [
  {
    href: "/my-profile/personal-information",
    text: "Profile",
    icon: <MdPerson />,
  },
  {
    href: "/my-profile/security",
    text: "Security",
    icon: <MdSecurity />,
  },
  {
    href: "/my-profile/statistics",
    text: "Statistics",
    icon: <MdAnalytics />,
  },
  {
    text: "Activities",
    icon: <FiActivity />,
    hasDropdown: true,
    dropdownItems: [
      {
        href: "/my-profile/activities/reviews",
        text: "Reviews",
      },
      {
        href: "/my-profile/activities/ratings",
        text: "Ratings",
      },
      {
        href: "/my-profile/activities/my-events",
        text: "Events",
      },
      {
        href: "/my-profile/activities/reminders",
        text: "Reminders",
      },
    ],
  },
];

export const administrationLinks = [
  {
    text: "Tools",
    hasDropdown: true,
    dropdownItems: [
      { href: "/administration/task-manager", text: "Task Manager" },
      { href: "/administration/apify", text: "APIFY" },
      { href: "/administration/artist-data-fill", text: "Artist Data Fill" },
      { href: "/administration/generate-assets", text: "Seedream" },
    ],
  },
  {
    text: "Submitted Items",
    hasDropdown: true,
    dropdownItems: [
      { href: "/administration/submitted/artist", text: "Artists" },
      { href: "/administration/submitted/club", text: "Clubs" },
      { href: "/administration/submitted/event", text: "Events" },
      { href: "/administration/submitted/festival", text: "Festivals" },
    ],
  },
  {
    href: "/administration/reports",
    text: "Reports",
  },
  {
    href: "/administration/audit",
    text: "Audit",
  },
];

export const footerData = [
  {
    title: "Support",
    items: [
      { text: "Contact Us", action: "contact" },
      { text: "Feedback", action: "feedback" },
      { text: "Report a Problem", action: "report" },
      { text: "FAQ", href: "/support/faq" },
      { text: "Help Center", href: "/support/help-center" },
    ],
  },
  {
    title: "Legal",
    items: [
      { text: "Terms & Conditions", href: "/support/terms-and-conditions" },
      { text: "Privacy Policy", href: "/support/privacy-policy" },
      { text: "Cookies", href: "/support/cookies" },
    ],
  },
  {
    title: "Discover",
    items: [
      { text: "Soundfolio", href: "/showcase" },
      { text: "Artists", href: "/artists" },
      { text: "Events", href: "/events" },
      { text: "Clubs", href: "/clubs" },
      { text: "Festivals", href: "/festivals" },
    ],
  },
  {
    title: "Company",
    items: [{ text: "About Us", href: "/support/about" }],
  },
];
