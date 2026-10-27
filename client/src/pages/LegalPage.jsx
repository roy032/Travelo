import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { OPERATOR_NAME, SUPPORT_EMAIL } from "../utils/site";

// Plain-language policies that describe what this codebase actually does.
// Have them reviewed for your jurisdiction before launch (see DEPLOY.md).
export const LEGAL_UPDATED = "22 October 2026";

const contact = SUPPORT_EMAIL ? (
  <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
) : (
  "the contact address shown on this site"
);

const privacySections = [
  {
    heading: "Who we are",
    body: (
      <p>
        Travelo is run by {OPERATOR_NAME}. For anything about your data,
        contact {contact}.
      </p>
    ),
  },
  {
    heading: "What we collect",
    body: (
      <ul>
        <li>
          <strong>Account:</strong> your name, email address and a hashed
          password. We never see or store your password itself.
        </li>
        <li>
          <strong>Trip content:</strong> what you and your group add to trips:
          itinerary items and places, expenses and receipts, chat messages,
          notes, checklists, photos, reviews and favorites.
        </li>
        <li>
          <strong>Identity documents:</strong> if you choose to verify, the
          NID or passport scan you upload. Only admins can view it, to approve
          or reject your verification.
        </li>
        <li>
          <strong>Technical data:</strong> your IP address is used briefly for
          rate limiting and security. Errors may be reported to our error
          tracker with the page and browser involved.
        </li>
      </ul>
    ),
  },
  {
    heading: "How we use it",
    body: (
      <ul>
        <li>To run the service: show your trips to the members you share them with, split expenses and send the emails you ask for (sign-up confirmation, password reset, trip updates you can turn off on your profile).</li>
        <li>To keep it safe: prevent abuse, review reports and verify identities for trips that require it.</li>
        <li>We do not sell your data and we do not show ads.</li>
      </ul>
    ),
  },
  {
    heading: "Cookies and local storage",
    body: (
      <p>
        We use one essential cookie that keeps you signed in. Your theme and
        language choices and trips saved for offline use are kept in your
        browser&apos;s storage and are cleared when you sign out. We do not
        use advertising or tracking cookies.
      </p>
    ),
  },
  {
    heading: "Services that process data for us",
    body: (
      <ul>
        <li>Our database and hosting providers store the data above.</li>
        <li>File storage (UploadThing) holds photos, receipts and identity documents.</li>
        <li>Our email provider delivers account and trip emails.</li>
        <li>Our error tracker (Sentry) receives technical details when something breaks.</li>
        <li>When you use the AI trip planner, the trip&apos;s destination, dates and your request are sent to Anthropic to generate suggestions.</li>
        <li>Maps load tiles from OpenStreetMap and place images from Wikimedia Commons directly in your browser, which shares your IP address with them.</li>
        <li>Weather and exchange rates are fetched by our server and contain no personal data.</li>
      </ul>
    ),
  },
  {
    heading: "Who can see your content",
    body: (
      <p>
        Trip content is visible to that trip&apos;s members. Trips marked
        public appear on the Explore page, and a share link you create shows
        the plan and map (not names or emails) to anyone who has the link
        until you turn it off. Reviews are public.
      </p>
    ),
  },
  {
    heading: "Your choices and rights",
    body: (
      <ul>
        <li><strong>Access and portability:</strong> download all of your data as a JSON file from your <Link to='/profile'>profile</Link>.</li>
        <li><strong>Correction:</strong> change your name, email and password on your profile.</li>
        <li><strong>Deletion:</strong> delete your account from your profile. Trips only you are in are deleted. Trips you own with others pass to another member. Your messages, photos, private notes, reviews, favorites and documents are deleted. Shared expenses, itinerary items and shared notes stay with the group, credited to &ldquo;Deleted user&rdquo;, so other members&apos; balances stay correct.</li>
        <li>For anything else, or to complain about how we handle your data, contact {contact}. You may also contact your local data protection authority.</li>
      </ul>
    ),
  },
  {
    heading: "How long we keep data",
    body: (
      <p>
        We keep your data while your account exists. Deleted content and
        accounts are removed from our live database right away, except trips,
        which are kept for 30 days so a mistaken deletion can be undone and
        then removed for good. Backups are deleted when they expire. Password reset and email confirmation links expire after 60
        minutes and 24 hours.
      </p>
    ),
  },
  {
    heading: "Children",
    body: <p>Travelo is not meant for children under 13, and they may not create an account.</p>,
  },
  {
    heading: "Changes",
    body: (
      <p>
        If we change this policy in a way that matters, we will say so on the
        site or by email before the change applies.
      </p>
    ),
  },
];

const termsSections = [
  {
    heading: "The service",
    body: (
      <p>
        Travelo, run by {OPERATOR_NAME}, is a free tool for planning trips
        with other people. We do not sell travel, take bookings or handle
        payments between members; balances shown in a trip are a record kept
        by its members.
      </p>
    ),
  },
  {
    heading: "Your account",
    body: (
      <ul>
        <li>You must be at least 13 and give a real email address.</li>
        <li>Keep your password private. You are responsible for what happens under your account; use &ldquo;Sign out everywhere&rdquo; on your profile if you think someone else has access.</li>
        <li>You can delete your account at any time from your profile.</li>
      </ul>
    ),
  },
  {
    heading: "Your content",
    body: (
      <p>
        You own what you add. You give us permission to store it and show it
        to the people you share it with, only so we can run the service.
        Only upload photos, documents and text you have the right to share.
      </p>
    ),
  },
  {
    heading: "Acceptable use",
    body: (
      <ul>
        <li>No harassment, hate, illegal content, spam or impersonation.</li>
        <li>No uploading someone else&apos;s identity documents.</li>
        <li>No attempts to break, overload or scrape the service, or to access other people&apos;s trips.</li>
        <li>Report trips that break these rules. We may remove content and block accounts that do.</li>
      </ul>
    ),
  },
  {
    heading: "Information on Travelo",
    body: (
      <p>
        Weather, exchange rates, AI suggestions, maps and destination details
        come from third parties or automated systems and may be wrong or out
        of date. Check anything important, such as opening hours, visa rules
        and safety advice, with an official source before you travel.
      </p>
    ),
  },
  {
    heading: "Availability and liability",
    body: (
      <p>
        We work to keep Travelo running and your data safe, but provide it
        &ldquo;as is&rdquo; without guarantees. To the extent the law allows,
        we are not liable for indirect losses, or for losses caused by
        travel arrangements, other members or third-party services. Nothing
        here limits rights you have under consumer law.
      </p>
    ),
  },
  {
    heading: "Changes and contact",
    body: (
      <p>
        We may update these terms and will give notice of important changes.
        Questions: {contact}. See also our{" "}
        <Link to='/privacy'>Privacy Policy</Link>.
      </p>
    ),
  },
];

const PAGES = {
  privacy: { title: "Privacy Policy", sections: privacySections },
  terms: { title: "Terms of Service", sections: termsSections },
};

/**
 * Privacy policy and terms of service
 * @param {{page: "privacy" | "terms"}} props
 */
const LegalPage = ({ page }) => {
  const { title, sections } = PAGES[page];
  usePageTitle(title);

  return (
    <div className='min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-950'>
      <article className='legal-content mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm sm:p-10 dark:bg-gray-900'>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>
          {title}
        </h1>
        <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
          Last updated {LEGAL_UPDATED}
        </p>
        {sections.map((section) => (
          <section key={section.heading} className='mt-8'>
            <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
              {section.heading}
            </h2>
            <div className='mt-3 space-y-2 leading-relaxed text-gray-700 dark:text-gray-300'>
              {section.body}
            </div>
          </section>
        ))}
      </article>
    </div>
  );
};

export default LegalPage;
