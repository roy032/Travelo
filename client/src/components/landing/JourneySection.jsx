import { Check } from "lucide-react";

const JourneySection = () => {
  const features = [
    {
      title: "All things new bucket",
      description:
        "Discover unique experiences and hidden gems around the world",
    },
    {
      title: "They have idea Relationships",
      description: "Connect with local guides and build meaningful connections",
    },
    {
      title: "Non idea than Relationships",
      description:
        "Go beyond traditional tourism and create authentic memories",
    },
  ];

  return (
    <div className='bg-linear-to-b from-white to-gray-50 py-20'>
      <div className='max-w-7xl mx-auto px-6'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
          {/* Left Content */}
          <div>
            <div className='mb-6'>
              <span className='text-blue-600 font-semibold text-sm uppercase tracking-wider'>
                Travel with us
              </span>
              <h2 className='text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mt-3 mb-6'>
                The journey is more important than the goal.
              </h2>
              <p className='text-lg text-gray-600 leading-relaxed'>
                Experience unforgettable adventures and create lasting memories.
                Our carefully curated destinations offer something special for
                every traveler.
              </p>
            </div>

            {/* Feature List */}
            <div className='space-y-6 mt-8'>
              {features.map((feature, index) => (
                <div key={index} className='flex gap-4 group'>
                  <div className='shrink-0'>
                    <div className='w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-500 transition-colors'>
                      <Check className='w-4 h-4 text-blue-600 group-hover:text-white transition-colors' />
                    </div>
                  </div>
                  <div>
                    <h3 className='font-semibold text-gray-900 mb-1'>
                      {feature.title}
                    </h3>
                    <p className='text-sm text-gray-600'>
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Image */}
          <div className='relative'>
            <div className='relative rounded-3xl overflow-hidden shadow-2xl'>
              <img
                src='/main/img6.jpg'
                alt='Tropical water bungalows'
                className='w-full h-full object-cover'
              />
              <div className='absolute inset-0 bg-linear-to-t from-blue-900/20 to-transparent'></div>
            </div>

            {/* Decorative Elements */}
            <div className='absolute -bottom-6 -right-6 w-48 h-48 bg-blue-200 rounded-full blur-3xl opacity-30 -z-10'></div>
            <div className='absolute -top-6 -left-6 w-48 h-48 bg-cyan-200 rounded-full blur-3xl opacity-30 -z-10'></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JourneySection;
