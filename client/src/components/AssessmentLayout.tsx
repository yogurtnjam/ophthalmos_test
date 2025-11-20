interface AssessmentLayoutProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
}

export function AssessmentLayout({ 
  title, 
  description, 
  icon, 
  children,
  maxWidth = '2xl'
}: AssessmentLayoutProps) {
  const maxWidthClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    'full': 'max-w-full'
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Gradient Header with Wave */}
      <div className="relative bg-gradient-to-r from-blue-600 via-teal-500 to-green-400 pb-32">
        <div className="container mx-auto px-4 pt-12 pb-16">
          <div className="flex items-center gap-4 mb-4">
            {icon && (
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                {icon}
              </div>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {title}
            </h1>
          </div>
          {description && (
            <p className="text-white/90 text-lg max-w-3xl">
              {description}
            </p>
          )}
        </div>
        
        {/* Wave Shape */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg className="relative block w-full h-16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-white"></path>
          </svg>
        </div>
      </div>

      {/* Content Area */}
      <div className="container mx-auto px-4 -mt-24 pb-12">
        <div className={`${maxWidthClasses[maxWidth]} mx-auto`}>
          {children}
        </div>
      </div>
    </div>
  );
}
