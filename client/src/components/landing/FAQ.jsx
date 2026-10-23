import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "What is Travelo?",
      answer:
        "Travelo is a free planner for group trips. Create a trip, invite friends, and plan it together: a day-by-day itinerary with a map, shared expenses with automatic splits, a group chat, checklists, notes, photos and a packing list with the weather forecast.",
    },
    {
      question: "Can I book flights or hotels on Travelo?",
      answer:
        "No. Travelo is for planning and organising, not booking. Add your bookings to the itinerary or notes so the whole group can see them.",
    },
    {
      question: "How do shared expenses work?",
      answer:
        "Whoever pays adds the expense and picks who it is split between, in any currency. Travelo converts it to the trip's currency, keeps a running balance for everyone and suggests the fewest payments to settle up.",
    },
    {
      question: "Why do some trips ask me to verify my identity?",
      answer:
        "Trip owners can require verified members. You upload an NID for domestic trips or a passport for international ones, and an admin reviews it. Documents are only visible to admins and are deleted with your account.",
    },
    {
      question: "Can I take my data with me or delete my account?",
      answer:
        "Yes. On your profile page you can download everything you have added as a JSON file, sign out on every device, or delete your account permanently.",
    },
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className='bg-gradient-to-b from-gray-50 to-white py-20 dark:from-gray-950 dark:to-gray-900'>
      <div className='max-w-4xl mx-auto px-6'>
        {/* Section Header */}
        <div className='text-center mb-12'>
          <h2 className='text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 dark:text-gray-100'>
            Frequently Asked Questions
          </h2>
          <p className='text-lg text-gray-600 dark:text-gray-400'>
            Answers to common questions about Travelo
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className='space-y-4'>
          {faqs.map((faq, index) => (
            <div
              key={index}
              className='bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg dark:bg-gray-900'
            >
              <button
                type='button'
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
                id={`faq-question-${index}`}
                className='w-full flex items-center justify-between p-6 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800'
              >
                <span className='text-lg font-semibold text-gray-900 pr-8 dark:text-gray-100'>
                  {faq.question}
                </span>
                <ChevronDown
                  className={`flex-shrink-0 w-6 h-6 text-blue-600 transition-transform duration-300 dark:text-blue-400 ${
                    openIndex === index ? "transform rotate-180" : ""
                  }`}
                  aria-hidden='true'
                />
              </button>

              <div
                id={`faq-answer-${index}`}
                role='region'
                aria-labelledby={`faq-question-${index}`}
                inert={openIndex !== index}
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-96" : "max-h-0 invisible"
                }`}
              >
                <div className='px-6 pb-6 text-gray-600 leading-relaxed dark:text-gray-400'>
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
