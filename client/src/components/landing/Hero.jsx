import { useState, useEffect, useRef } from "react";
import { MapPin, Search } from "lucide-react";
import { gsap } from "gsap";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const [location, setLocation] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();

  const bgRef1 = useRef(null);
  const bgRef2 = useRef(null);

  const backgroundImages = [
    "/main/img1.jpeg",
    "/main/img7.jpg",
    "/main/img6.jpg",
    "/main/img8.jpg",
    "/main/img9.jpg",
  ];

  const carouselImages = [
    "/main/img1.jpeg",
    "/main/img2.webp",
    "/main/img3.jpeg",
    "/main/img4.jpg",
    "/main/img5.webp",
    "/main/img6.jpg",
  ];

  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef(null);

  // Auto-advance carousel
  useEffect(() => {
    const carouselInterval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselImages.length);
    }, 4000);

    return () => clearInterval(carouselInterval);
  }, [carouselImages.length]);

  // Animate carousel transitions with clip-path
  useEffect(() => {
    if (carouselRef.current) {
      gsap.fromTo(
        carouselRef.current,
        {
          opacity: 0,
          clipPath: "polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)",
        },
        {
          opacity: 1,
          clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
          duration: 1.2,
          ease: "power3.out",
        }
      );
    }
  }, [carouselIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % backgroundImages.length;

        // Determine which background element is currently visible
        const currentBg = prevIndex % 2 === 0 ? bgRef1.current : bgRef2.current;
        const nextBg = prevIndex % 2 === 0 ? bgRef2.current : bgRef1.current;

        // Fade out current, fade in next
        gsap.to(currentBg, {
          opacity: 0,
          duration: 1.5,
          ease: "power2.inOut",
        });

        gsap.to(nextBg, {
          opacity: 0.9,
          duration: 1.5,
          ease: "power2.inOut",
        });

        return nextIndex;
      });
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Handle search logic
    navigate("/explore");
  };

  const partners = [
    { name: "Tripadvisor", icon: "/main/img1.jpeg" },
    { name: "Expedia", icon: "/main/img2.webp" },
    { name: "Booking", icon: "/main/img3.jpeg" },
    { name: "Airbnb", icon: "/main/img4.jpg" },
    { name: "Trivago", icon: "/main/img5.webp" },
    { name: "Priceline", icon: "/main/img6.jpg" },
  ];

  return (
    <div className='relative min-h-[600px] lg:min-h-[700px] bg-linear-to-br from-blue-400 to-cyan-500 overflow-hidden'>
      {/* Background Image Layer 1 */}
      <div
        ref={bgRef1}
        className='absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity'
        style={{
          backgroundImage: `url('${
            backgroundImages[
              currentImageIndex % 2 === 0
                ? currentImageIndex
                : currentImageIndex - 1
            ]
          }')`,
          opacity: currentImageIndex % 2 === 0 ? 0.9 : 0,
        }}
      >
        <div className='absolute inset-0 bg-linear-to-r from-blue-600/40 to-cyan-500/40'></div>
      </div>

      {/* Background Image Layer 2 */}
      <div
        ref={bgRef2}
        className='absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity'
        style={{
          backgroundImage: `url('${
            backgroundImages[
              currentImageIndex % 2 === 1
                ? currentImageIndex
                : (currentImageIndex + 1) % backgroundImages.length
            ]
          }')`,
          opacity: currentImageIndex % 2 === 1 ? 0.9 : 0,
        }}
      >
        <div className='absolute inset-0 bg-linear-to-r from-blue-600/40 to-cyan-500/40'></div>
      </div>

      {/* Content */}
      <div className='relative max-w-7xl mx-auto px-6 py-16 lg:py-24'>
        <div className='grid lg:grid-cols-2 gap-8 lg:gap-12 items-center'>
          {/* Left Column - Main Content */}
          <div>
            <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight'>
              Easy Planning for Your
              <br />
              Dream Adventure!
            </h1>
            <p className='text-lg md:text-xl text-white/90 mb-8'>
              Discover amazing destinations and plan your perfect trip with our
              easy-to-use platform.
            </p>

            {/* Search Form */}
            <div className='bg-white rounded-2xl shadow-2xl p-4 md:p-6'>
              <form
                onSubmit={handleSearch}
                className='flex flex-col md:flex-row gap-4'
              >
                {/* Location Input */}
                <div className='flex-1 flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-blue-400 transition-colors'>
                  <MapPin className='text-blue-500 shrink-0' size={20} />
                  <input
                    type='text'
                    placeholder='Location'
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className='w-full outline-none text-gray-700 placeholder-gray-400'
                  />
                </div>

                {/* Search Button */}
                <button
                  type='submit'
                  className='bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg hover:shadow-xl'
                >
                  <Search size={20} />
                  Explore
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - Image Carousel with Clip-Path */}
          <div className='hidden lg:block relative'>
            <div className='relative h-[500px] overflow-visible'>
              {/* Main Carousel Image with Creative Clip-Path */}
              <div
                ref={carouselRef}
                className='w-full h-full bg-cover bg-center shadow-2xl'
                style={{
                  backgroundImage: `url('${carouselImages[carouselIndex]}')`,
                  clipPath: "polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)",
                  borderRadius: "20px",
                }}
              >
                <div className='absolute inset-0 bg-linear-to-br from-blue-500/20 via-transparent to-purple-500/20'></div>
              </div>

              {/* Decorative Background Shape */}
              <div
                className='absolute -z-10 w-full h-full bg-linear-to-br from-white/40 to-white/10 backdrop-blur-sm'
                style={{
                  clipPath: "polygon(5% 5%, 95% 5%, 95% 95%, 5% 95%)",
                  top: "15px",
                  left: "15px",
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Partner Logos */}
        <div className='mt-16'>
          <div className='flex flex-wrap items-center justify-center gap-8 md:gap-12'>
            {partners.map((partner, index) => (
              <div
                key={index}
                className='w-16 h-16 md:w-20 md:h-20 bg-white/90 backdrop-blur-sm rounded-lg shadow-md flex items-center justify-center p-3 hover:scale-110 transition-transform'
              >
                <img
                  src={partner.icon}
                  alt={partner.name}
                  className='w-full h-full object-contain opacity-70 hover:opacity-100 transition-opacity'
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
