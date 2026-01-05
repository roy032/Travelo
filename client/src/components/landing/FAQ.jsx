import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "How do I book a trip?",
      answer:
        "Booking a trip is easy! Simply search for your desired destination, select your dates, choose your accommodation, and proceed to checkout. Our secure payment system ensures your information is safe.",
    },
    {
      question: "What is Travelo and how does it work?",
      answer:
        "Travelo is a comprehensive travel planning platform that helps you discover, plan, and book amazing trips. We offer curated destinations, expert recommendations, and seamless booking experiences all in one place.",
    },
    {
      question: "How can I get ahead about?",
      answer:
        "Stay informed by subscribing to our newsletter, following us on social media, and checking our blog for the latest travel tips, destination guides, and exclusive deals. You can also enable notifications in your account settings.",
    },
    {
      question:
        "What do I need to cancel my trip or get a refund after booking my hotel?",
      answer:
        "Cancellation policies vary by hotel and booking type. Most bookings can be canceled through your account dashboard. Refunds are processed according to the specific terms of your reservation. Free cancellation options are clearly marked during booking.",
    },
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className='bg-gradient-to-b from-gray-50 to-white py-20'>
      <div className='max-w-4xl mx-auto px-6'>
        {/* Section Header */}
        <div className='text-center mb-12'>
          <h2 className='text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4'>
            Frequently Asked Question
          </h2>
          <p className='text-lg text-gray-600'>
            Find answers to common questions about our services
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className='space-y-4'>
          {faqs.map((faq, index) => (
            <div
              key={index}
              className='bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg'
            >
              <button
                onClick={() => toggleFAQ(index)}
                className='w-full flex items-center justify-between p-6 text-left transition-colors hover:bg-gray-50'
              >
                <span className='text-lg font-semibold text-gray-900 pr-8'>
                  {faq.question}
                </span>
                <ChevronDown
                  className={`flex-shrink-0 w-6 h-6 text-blue-600 transition-transform duration-300 ${
                    openIndex === index ? "transform rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-96" : "max-h-0"
                }`}
              >
                <div className='px-6 pb-6 text-gray-600 leading-relaxed'>
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
