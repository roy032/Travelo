import { ArrowRight, Plane } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <div className='bg-white py-20'>
      <div className='max-w-7xl mx-auto px-6'>
        <div className='relative rounded-3xl overflow-hidden shadow-2xl min-h-[400px] md:min-h-[500px]'>
          {/* Background Image */}
          <div
            className='absolute inset-0 bg-cover bg-center'
            style={{ backgroundImage: `url('/main/img7.jpg')` }}
          >
            <div className='absolute inset-0 bg-linear-to-r from-blue-900/80 via-blue-800/70 to-transparent'></div>
          </div>

          {/* Content */}
          <div className='relative h-full flex items-center px-8 md:px-16 py-16 md:py-20'>
            <div className='max-w-2xl'>
              <div className='flex items-center gap-2 mb-6'>
                <Plane className='text-white w-8 h-8' />
                <span className='text-white/90 font-semibold text-sm uppercase tracking-wider'>
                  Start Your Adventure
                </span>
              </div>

              <h2 className='text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight'>
                Prepared to start your
                <br />
                Next Journey?
              </h2>

              <p className='text-lg text-white/90 mb-8 leading-relaxed max-w-xl'>
                Discover amazing destinations, create unforgettable memories,
                and embark on the adventure of a lifetime. Your dream vacation
                awaits.
              </p>

              {/* CTA Buttons */}
              <div className='flex flex-col sm:flex-row gap-4'>
                <button
                  className='bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                  onClick={() => navigate("/explore")}
                >
                  Explore Now
                  <ArrowRight size={20} />
                </button>
                <button
                  className='bg-white hover:bg-gray-100 text-blue-600 px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                  onClick={() => navigate("/explore")}
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>

          {/* Decorative wave pattern */}
          <div className='absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-white to-transparent'></div>
        </div>
      </div>
    </div>
  );
};

export default CTASection;
