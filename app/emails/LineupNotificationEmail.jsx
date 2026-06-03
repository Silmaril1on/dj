import { buildEmailBase } from "./EmailTemplate";

export const LineupNotificationEmail = ({
  userName,
  festivalName,
  phaseName,
  festivalUrl,
}) => {
  return buildEmailBase({
    title: `${festivalName} just dropped their ${phaseName} lineup!`,
    badge: "Lineup Alert",
    heading: festivalName,
    subheading: `${phaseName} is here`,
    bodyHtml: `
      <p style="color:#cccccc;font-size:15px;line-height:1.7;margin:0 0 16px;">
        Hey <strong style="color:#fff;">${userName}</strong>,
      </p>
      <p style="color:#cccccc;font-size:15px;line-height:1.7;margin:0 0 32px;">
        Goood news &#8212; <strong style="color:#fff;">${festivalName}</strong> has just
        published their <strong style="color:#fcb913;">${phaseName}</strong> lineup.
        Head over to their page to see who's playing.
      </p>
    `,
    ctaText: "View Lineup \u2192",
    ctaUrl: festivalUrl,
    footerNote:
      "You're receiving this because you set up a lineup alert for this festival on SoundFolio. You can cancel your alert at any time from the festival page.",
  });
};
