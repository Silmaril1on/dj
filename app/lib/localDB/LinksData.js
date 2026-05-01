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
    href: "/administration/task-manager",
    text: "Task Manager",
  },
  {
    href: "/administration/apify",
    text: "Apify",
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
    text: "Reports and Feedbacks",
  },
  {
    href: "/administration/audit",
    text: "Audit",
  },
];
