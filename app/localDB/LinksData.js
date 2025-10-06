import {
  MdPerson,
  MdSecurity,
  MdPayment,
  MdAnalytics,
  MdOutlineTrackChanges,
  MdReviews,
  MdStar,
  MdEvent,
  MdEventAvailable,
} from "react-icons/md";
import { FiActivity } from "react-icons/fi";

export const userProfileLinks = [
  {
    href: "/my-profile/personal-information",
    text: "My Profile",
    icon: <MdPerson />,
  },
  {
    href: "/my-profile/security",
    text: "Security",
    icon: <MdSecurity />,
  },
  // {
  //   href: "/my-profile/billing",
  //   text: "Billing & Payment",
  //   icon: <MdPayment />,
  // },
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
        icon: <MdReviews />,
      },
      {
        href: "/my-profile/activities/ratings",
        text: "Ratings",
        icon: <MdStar />,
      },
      {
        href: "/my-profile/activities/my-events",
        text: "Events",
        icon: <MdEventAvailable />,
      },
    ],
  },
];

export const addProductLinks = [
  {
    href: "/add-product/add-artist",
    text: "Add Artist",
    icon: <MdPerson />,
  },
  {
    href: "/add-product/add-club",
    text: "Register Club",
    icon: <MdPerson />,
  },
  {
    href: "/add-product/add-event",
    text: "Add Event",
    icon: <MdEvent />,
  },
  {
    href: "/add-product/add-news",
    text: "Add News",
    icon: <MdEvent />,
    access: "admin",
  },

];

export const administrationLinks = [
  {
    href: "/administration/submitted-artists",
    text: "Artists",
    icon: <MdOutlineTrackChanges />,
  },
  {
    href: "/administration/submitted-clubs",
    text: "Clubs",
    icon: <MdOutlineTrackChanges />,
  },
  {
    href: "/administration/submitted-events",
    text: "Events",
    icon: <MdOutlineTrackChanges />,
  },
  {
    href: "/administration/reports",
    text: "Bugs and Feedbacks",
    icon: <MdEvent />,
  },
];
