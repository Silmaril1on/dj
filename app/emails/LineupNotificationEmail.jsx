import { buildEmailBase } from "./EmailTemplate";

/**
 * Email sent to subscribers when a festival drops a new lineup phase.
 *
 * Props:
 *  - userName      : subscriber's display name
 *  - festivalName  : name of the festival
 *  - phaseName     : e.g. "Phase 1", "Phase 2", "Full Lineup"
 *  - festivalUrl   : absolute URL to the festival profile page
 */
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
        Great news &#8212; <strong style="color:#fff;">${festivalName}</strong> has just
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
