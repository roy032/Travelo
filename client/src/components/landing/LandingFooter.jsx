import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { SUPPORT_EMAIL } from "../../utils/site";

const footerLinks = [
  {
    heading: "Plan",
    links: [
      { label: "Destinations", to: "/destinations" },
      { label: "Public trips", to: "/explore" },
      { label: "Create an account", to: "/register" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms of Service", to: "/terms" },
    ],
  },
];

const LandingFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='bg-gray-900 text-gray-300'>
      <div className='max-w-screen-xl mx-auto px-6 py-16'>
        <div className='grid grid-cols-1 gap-12 mb-12 md:grid-cols-4'>
          <div className='md:col-span-2'>
            <h2 className='text-2xl font-bold text-white mb-3'>Travelo</h2>
            <p className='text-gray-400 leading-relaxed max-w-md'>
              Plan group trips together: itinerary, map, shared expenses, chat
              and checklists in one place.
            </p>
            {SUPPORT_EMAIL && (
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className='mt-6 inline-flex items-center gap-2 text-gray-300 hover:text-white'
              >
                <Mail size={18} aria-hidden='true' />
                {SUPPORT_EMAIL}
              </a>
            )}
          </div>

          {footerLinks.map((group) => (
            <nav key={group.heading} aria-label={group.heading}>
              <h2 className='text-white font-semibold text-lg mb-4'>
                {group.heading}
              </h2>
              <ul className='space-y-3'>
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className='text-gray-400 hover:text-white transition-colors'
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className='border-t border-gray-800 pt-8'>
          <p className='text-gray-400 text-sm'>
            © {currentYear} Travelo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
