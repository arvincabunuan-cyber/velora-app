import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FF6A00' }}>
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
