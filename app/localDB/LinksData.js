import {
  MdPerson,
  MdSecurity,
  MdPayment,
  MdAnalytics,
  MdOutlineTrackChanges,
  MdReviews,
  MdStar,
  MdOutlineLocalActivity,
  MdEvent,
} from "react-icons/md";

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
  {
    href: "/my-profile/billing",
    text: "Billing & Payment",
    icon: <MdPayment />,
  },
  {
    href: "/my-profile/statistics",
    text: "Statistics",
    icon: <MdAnalytics />,
  },
  {
    text: "Activities",
    icon: <MdOutlineLocalActivity />,
    hasDropdown: true,
    dropdownItems: [
      {
        href: "/my-profile/activities/reviews",
        text: "My Reviews",
        icon: <MdReviews />,
      },
      {
        href: "/my-profile/activities/ratings",
        text: "My Ratings",
        icon: <MdStar />,
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
];
