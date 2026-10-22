import { appLink } from "./email.service.js";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Wrap paragraphs and an optional button in a minimal, inline-styled layout
 * that renders in every mail client. `paragraphs` are plain text.
 */
const layout = ({ heading, paragraphs, action, footer }) => {
  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827">
<div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:8px;padding:32px">
<h1 style="margin:0 0 16px;font-size:20px">${escapeHtml(heading)}</h1>
${paragraphs.map((p) => `<p style="margin:0 0 16px;line-height:1.5">${escapeHtml(p)}</p>`).join("\n")}
${
  action
    ? `<p style="margin:24px 0"><a href="${escapeHtml(action.url)}" style="background:#2563eb;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">${escapeHtml(action.label)}</a></p>
<p style="margin:0 0 16px;font-size:13px;color:#6b7280">Or open this link: ${escapeHtml(action.url)}</p>`
    : ""
}
${footer ? `<p style="margin:24px 0 0;font-size:12px;color:#6b7280">${escapeHtml(footer)}</p>` : ""}
</div></body></html>`;

  const text = [
    heading,
    "",
    ...paragraphs.flatMap((p) => [p, ""]),
    ...(action ? [`${action.label}: ${action.url}`, ""] : []),
    ...(footer ? [footer] : []),
  ]
    .join("\n")
    .trim();

  return { html, text };
};

const NOTIFICATION_FOOTER =
  "You get these emails because email notifications are on in your Travelo profile. Turn them off any time from your profile page.";

export const verifyEmailTemplate = ({ name, url, expiresInHours }) => ({
  subject: "Confirm your Travelo email address",
  ...layout({
    heading: `Welcome to Travelo, ${name}!`,
    paragraphs: [
      "Please confirm this is your email address so we can send you trip updates and help you get back into your account if you forget your password.",
      `This link expires in ${expiresInHours} hours.`,
    ],
    action: { label: "Confirm email", url },
    footer: "If you didn't create a Travelo account, you can ignore this email.",
  }),
});

export const passwordResetTemplate = ({ name, url, expiresInMinutes }) => ({
  subject: "Reset your Travelo password",
  ...layout({
    heading: "Reset your password",
    paragraphs: [
      `Hi ${name}, we got a request to reset the password for your Travelo account.`,
      `This link expires in ${expiresInMinutes} minutes and can only be used once.`,
    ],
    action: { label: "Choose a new password", url },
    footer:
      "If you didn't ask to reset your password, you can ignore this email. Your password won't change.",
  }),
});

export const passwordChangedTemplate = ({ name }) => ({
  subject: "Your Travelo password was changed",
  ...layout({
    heading: "Your password was changed",
    paragraphs: [
      `Hi ${name}, the password for your Travelo account was just reset.`,
      "If this wasn't you, reset your password again right away and contact support.",
    ],
    action: { label: "Sign in", url: appLink("/login") },
  }),
});

export const joinRequestReceivedTemplate = ({ name, requesterName, tripTitle }) => ({
  subject: `${requesterName} wants to join "${tripTitle}"`,
  ...layout({
    heading: "New join request",
    paragraphs: [
      `Hi ${name}, ${requesterName} has asked to join your trip "${tripTitle}".`,
    ],
    action: {
      label: "Review requests",
      url: appLink("/join-requests"),
    },
    footer: NOTIFICATION_FOOTER,
  }),
});

export const joinRequestAcceptedTemplate = ({ name, tripTitle, tripId }) => ({
  subject: `You're in! Your request to join "${tripTitle}" was accepted`,
  ...layout({
    heading: "Join request accepted",
    paragraphs: [
      `Good news, ${name}! You are now a member of "${tripTitle}".`,
      "Open the trip to meet the group, check the itinerary and start planning together.",
    ],
    action: { label: "Open trip", url: appLink(`/trips/${tripId}`) },
    footer: NOTIFICATION_FOOTER,
  }),
});

export const joinRequestRejectedTemplate = ({ name, tripTitle }) => ({
  subject: `Your request to join "${tripTitle}" was declined`,
  ...layout({
    heading: "Join request declined",
    paragraphs: [
      `Hi ${name}, the organiser of "${tripTitle}" has declined your request to join.`,
      "There are plenty of other trips looking for travel buddies.",
    ],
    action: { label: "Explore trips", url: appLink("/explore") },
    footer: NOTIFICATION_FOOTER,
  }),
});

export const tripInvitationTemplate = ({ name, inviterName, tripTitle, invitationId }) => ({
  subject: `${inviterName} invited you to "${tripTitle}"`,
  ...layout({
    heading: "You're invited",
    paragraphs: [
      `Hi ${name}, ${inviterName} has invited you to join the trip "${tripTitle}" on Travelo.`,
    ],
    action: {
      label: "View invitation",
      url: appLink(`/invitations/${invitationId}`),
    },
    footer: NOTIFICATION_FOOTER,
  }),
});
