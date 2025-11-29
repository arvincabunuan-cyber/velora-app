import { Link } from 'react-router-dom';
import { ShoppingCart, Package, Truck, Star, ChevronRight, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import Logo from '../components/Logo';

const LandingPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      title: "Fast & Reliable Delivery",
      subtitle: "SAVE UP TO 40%",
      description: "On Selected Products From Top Sellers",
      image: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=600&h=400&fit=crop",
      cta: "Shop Now"
    },
    {
      title: "Order From Local Sellers",
      subtitle: "FRESH PRODUCTS DAILY",
      description: "Support Local Businesses & Get Quick Delivery",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop",
      cta: "Browse Products"
    }
  ];

  const featuredProducts = [
    {
      name: "Fresh Groceries",
      price: 29.99,
      originalPrice: 39.99,
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop",
      discount: 25
    },
    {
      name: "Electronics",
      price: 499.99,
      originalPrice: 599.99,
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&h=300&fit=crop",
      discount: 17
    },
    {
      name: "Fashion Items",
      price: 79.99,
      originalPrice: 99.99,
      image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=300&h=300&fit=crop",
      discount: 20
    },
    {
      name: "Home Essentials",
      price: 149.99,
      originalPrice: 199.99,
      image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=300&h=300&fit=crop",
      discount: 25
    }
  ];

  const categories = [
    { name: "Food", icon: "🍔", color: "bg-orange-100" },
    { name: "Groceries", icon: "🛒", color: "bg-green-100" },
    { name: "Electronics", icon: "📱", color: "bg-blue-100" },
    { name: "Fashion", icon: "👕", color: "bg-pink-100" },
    { name: "Home", icon: "🏠", color: "bg-purple-100" },
    { name: "Beauty", icon: "💄", color: "bg-red-100" },
    { name: "Sports", icon: "⚽", color: "bg-yellow-100" },
    { name: "Books", icon: "📚", color: "bg-indigo-100" }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-gray-900 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <span>📞 Call Us 24/7: 1234-567890</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>PHP ₱</span>
            <span>|</span>
            <span>English</span>
            <span>|</span>
            <Link to="/login" className="hover:text-orange-500">My Account</Link>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center">
                <Logo className="w-12 h-12" textClassName="text-2xl font-bold" />
              </Link>
              
              <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-4 py-2 w-96">
                <input
                  type="text"
                  placeholder="Search for products..."
                  className="bg-transparent outline-none flex-1"
                  onClick={() => window.location.href = '/register'}
                />
                <Link to="/register" className="bg-orange-500 text-white px-4 py-1 rounded-md ml-2">
                  Search
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <Link to="/login" className="flex items-center space-x-2 hover:text-orange-500">
                <span>👤</span>
                <span className="hidden md:block">Account</span>
              </Link>
              <Link to="/register" className="hidden md:block hover:text-orange-500">
                Register
              </Link>
              <Link to="/register" className="relative hover:text-orange-500">
                <ShoppingCart size={24} />
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  0
                </span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Category Bar */}
      <div className="bg-orange-500 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center space-x-8 py-3 overflow-x-auto">
            <button className="flex items-center space-x-2 bg-orange-600 px-4 py-2 rounded-md whitespace-nowrap">
              <span>☰</span>
              <span>All Categories</span>
            </button>
            <Link to="/" className="hover:text-orange-200 whitespace-nowrap">Home</Link>
            <Link to="/register" className="hover:text-orange-200 whitespace-nowrap">About</Link>
            <Link to="/register" className="hover:text-orange-200 whitespace-nowrap">Shop</Link>
            <Link to="/register" className="hover:text-orange-200 whitespace-nowrap">Vendors</Link>
            <Link to="/register" className="hover:text-orange-200 whitespace-nowrap">Contact</Link>
            <Link to="/register" className="ml-auto bg-red-600 px-4 py-2 rounded-md whitespace-nowrap cursor-pointer">
              🎁 Get Sale Now
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Hero Slider */}
          <div className="lg:col-span-8">
            <div className="relative bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl overflow-hidden h-96">
              <div className="absolute inset-0 flex items-center justify-between p-12">
                <div className="max-w-md">
                  <p className="text-orange-500 font-semibold text-sm mb-2">
                    {heroSlides[currentSlide].subtitle}
                  </p>
                  <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
                    {heroSlides[currentSlide].title}
                  </h1>
                  <p className="text-gray-600 mb-6">
                    {heroSlides[currentSlide].description}
                  </p>
                  <Link
                    to="/register"
                    className="inline-block bg-orange-500 text-white px-8 py-3 rounded-full hover:bg-orange-600 transition"
                  >
                    {heroSlides[currentSlide].cta}
                  </Link>
                </div>
                <div className="hidden md:block">
                  <img
                    src="/hero-image.jpg"
                    alt="Velora Delivery"
                    className="w-full h-96 object-cover rounded-lg"
                  />
                </div>
              </div>

              {/* Slider Controls */}
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
              >
                <ChevronRight size={24} />
              </button>

              {/* Slider Dots */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full ${
                      currentSlide === index ? 'bg-orange-500 w-8' : 'bg-gray-400'
                    } transition-all`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Side Banners */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl p-6 text-white h-44 flex flex-col justify-between relative overflow-hidden">
              <img src="/mangoo.jpg" alt="Mango" className="absolute inset-0 w-full h-full object-cover opacity-70" />
              <div className="relative z-10">
                <p className="text-sm mb-1">SPECIAL OFFER</p>
                <h3 className="text-2xl font-bold mb-2">Fresh Mangoes</h3>
                <p className="text-3xl font-bold">
                  ₱150.00 <span className="text-lg line-through opacity-75">₱200.00</span>
                </p>
              </div>
              <Link to="/register" className="bg-white text-orange-500 px-6 py-2 rounded-full font-semibold w-fit hover:bg-gray-100 relative z-10">
                Shop Now →
              </Link>
            </div>

            <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white h-44 flex flex-col justify-between relative overflow-hidden">
              <img src="/vegetables.webp" alt="Vegetables" className="absolute inset-0 w-full h-full object-cover opacity-70" />
              <div className="relative z-10">
                <p className="text-sm mb-1">NEW ARRIVAL</p>
                <h3 className="text-2xl font-bold mb-2">Fresh Vegetables</h3>
                <p className="text-xl">Starting from ₱50</p>
              </div>
              <Link to="/register" className="bg-white text-blue-500 px-6 py-2 rounded-full font-semibold w-fit hover:bg-gray-100 relative z-10">
                Explore →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((category, index) => (
            <Link
              key={index}
              to="/register"
              className={`${category.color} rounded-xl p-6 text-center hover:shadow-lg transition transform hover:-translate-y-1`}
            >
              <div className="text-4xl mb-2">{category.icon}</div>
              <p className="font-semibold text-gray-900">{category.name}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
          <Link to="/register" className="text-orange-500 hover:text-orange-600 flex items-center">
            View All <ChevronRight size={20} />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product, index) => (
            <Link to="/register" key={index} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition group">
              <div className="relative overflow-hidden">
                {product.discount && (
                  <span className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold z-10">
                    -{product.discount}%
                  </span>
                )}
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-64 object-cover group-hover:scale-110 transition duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                <div className="flex items-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-400 fill-current" />
                  ))}
                  <span className="text-gray-500 text-sm ml-2">(4.5)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-orange-500">₱{product.price}</span>
                    <span className="text-gray-400 line-through ml-2">₱{product.originalPrice}</span>
                  </div>
                  <div className="bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600">
                    <ShoppingCart size={20} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start space-x-4">
              <div className="bg-orange-100 p-4 rounded-full">
                <Truck className="text-orange-500" size={32} />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Fast Delivery</h3>
                <p className="text-gray-600">Get your orders delivered within 30 minutes</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-orange-100 p-4 rounded-full">
                <Package className="text-orange-500" size={32} />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Quality Products</h3>
                <p className="text-gray-600">Fresh products from verified sellers</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-orange-100 p-4 rounded-full">
                <Star className="text-orange-500" size={32} />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">24/7 Support</h3>
                <p className="text-gray-600">We're here to help you anytime</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <p className="text-orange-500 font-bold text-xl mb-2">🔥 Your All-Night Delivery Partner</p>
            <p className="text-gray-400">Designed by Velora Team - Developed with ❤️ by Velora</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
