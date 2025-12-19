import { ArrowRight, Compass } from "lucide-react";
import { useNavigate } from "react-router-dom";

const StatsBlock = () => {
  const navigate = useNavigate();
  return (
    <div className='bg-white py-16'>
      <div className='max-w-7xl mx-auto px-6'>
        <div className='bg-linear-to-br from-blue-50 to-cyan-50 rounded-3xl p-12 md:p-16 shadow-xl'>
          <div className='flex flex-col md:flex-row items-center justify-between gap-8'>
            {/* Stats Section */}
            <div className='text-center md:text-left'>
              <div className='inline-flex items-baseline gap-2 mb-4'>
                <span className='text-5xl md:text-6xl lg:text-7xl font-bold text-blue-600'>
                  120+
                </span>
                <Compass className='text-blue-500 w-8 h-8 md:w-10 md:h-10' />
              </div>
              <p className='text-xl md:text-2xl text-gray-700 font-semibold mb-2'>
                Amazing Destinations
              </p>
              <p className='text-gray-600'>
                Curated recommendations from travel experts
              </p>
            </div>

            {/* CTA Buttons */}
            <div className='flex flex-col sm:flex-row gap-4'>
              <button
                className='bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                onClick={() => navigate("/explore")}
              >
                Explore Destinations
                <ArrowRight size={20} />
              </button>
              <button
                className='bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-500 px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                onClick={() => navigate("/explore")}
              >
                View All Trips
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsBlock;
