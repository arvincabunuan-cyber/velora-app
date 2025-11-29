const Logo = ({ className = "w-10 h-10", textClassName = "text-2xl font-bold", showText = true }) => {
  return (
    <div className="flex items-center gap-2">
      <img 
        src="/logo.png" 
        alt="Velora Logo" 
        className={className}
      />
      {showText && <span className={textClassName + " text-primary-600"}>Velora</span>}
    </div>
  );
};

export default Logo;
