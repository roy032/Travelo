import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

const LandingFooter = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { label: "About Us", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Press", href: "#" },
      { label: "Gift Cards", href: "#" },
    ],
    support: [
      { label: "Help Center", href: "#" },
      { label: "Safety", href: "#" },
      { label: "Cancellation", href: "#" },
      { label: "Contact Us", href: "#" },
      { label: "Feedback", href: "#" },
    ],
    resources: [
      { label: "Travel Guides", href: "#" },
      { label: "Destinations", href: "#" },
      { label: "Travel Tips", href: "#" },
      { label: "Partners", href: "#" },
      { label: "Affiliates", href: "#" },
    ],
  };

  return (
    <footer className='bg-gray-900 text-gray-300'>
      <div className='max-w-screen-xl mx-auto px-6 py-16'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12'>
          {/* Brand Section */}
          <div className='lg:col-span-2'>
            <div className='mb-6'>
              <h3 className='text-2xl font-bold text-white mb-3'>Travelo</h3>
              <p className='text-gray-400 leading-relaxed mb-6'>
                Your trusted companion for unforgettable travel experiences.
                Discover the world with confidence and create memories that last
                a lifetime.
              </p>
            </div>

            {/* Social Links */}
            <div className='flex gap-4'>
              <a
                href='#'
                className='w-10 h-10 rounded-full bg-gray-800 hover:bg-blue-600 flex items-center justify-center transition-colors'
                aria-label='Facebook'
              >
                <Facebook size={18} />
              </a>
              <a
                href='#'
                className='w-10 h-10 rounded-full bg-gray-800 hover:bg-blue-400 flex items-center justify-center transition-colors'
                aria-label='Twitter'
              >
                <Twitter size={18} />
              </a>
              <a
                href='#'
                className='w-10 h-10 rounded-full bg-gray-800 hover:bg-pink-600 flex items-center justify-center transition-colors'
                aria-label='Instagram'
              >
                <Instagram size={18} />
              </a>
              <a
                href='#'
                className='w-10 h-10 rounded-full bg-gray-800 hover:bg-red-600 flex items-center justify-center transition-colors'
                aria-label='YouTube'
              >
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className='text-white font-semibold text-lg mb-4'>Company</h4>
            <ul className='space-y-3'>
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className='text-gray-400 hover:text-white transition-colors'
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className='text-white font-semibold text-lg mb-4'>Support</h4>
            <ul className='space-y-3'>
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className='text-gray-400 hover:text-white transition-colors'
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className='text-white font-semibold text-lg mb-4'>Resources</h4>
            <ul className='space-y-3'>
              {footerLinks.resources.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className='text-gray-400 hover:text-white transition-colors'
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className='border-t border-gray-800 pt-8 mb-8'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0'>
                <Mail size={20} />
              </div>
              <div>
                <p className='text-sm text-gray-500'>Email Us</p>
                <p className='text-white'>support@travelo.com</p>
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0'>
                <Phone size={20} />
              </div>
              <div>
                <p className='text-sm text-gray-500'>Call Us</p>
                <p className='text-white'>+1 (555) 123-4567</p>
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0'>
                <MapPin size={20} />
              </div>
              <div>
                <p className='text-sm text-gray-500'>Visit Us</p>
                <p className='text-white'>123 Travel St, NY 10001</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className='border-t border-gray-800 pt-8'>
          <div className='flex flex-col md:flex-row justify-between items-center gap-4'>
            <p className='text-gray-500 text-sm'>
              © {currentYear} Travelo. All rights reserved.
            </p>
            <div className='flex gap-6 text-sm'>
              <a
                href='#'
                className='text-gray-400 hover:text-white transition-colors'
              >
                Privacy Policy
              </a>
              <a
                href='#'
                className='text-gray-400 hover:text-white transition-colors'
              >
                Terms of Service
              </a>
              <a
                href='#'
                className='text-gray-400 hover:text-white transition-colors'
              >
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
