import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { label: 'Questionnaire', path: '/' },
    { label: 'Cone Test', path: '/cone-test' },
    { label: 'Custom Preset Tasks', path: '/task-games' },
    { label: 'OS Preset Tasks', path: '/task-games' },
    { label: 'Results', path: '/statistics' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="container mx-auto flex gap-2 flex-wrap">
        {navItems.map((item) => (
          <Link key={item.path + item.label} href={item.path}>
            <Button
              variant={location === item.path ? 'default' : 'outline'}
              size="sm"
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {item.label}
            </Button>
          </Link>
        ))}
      </div>
    </nav>
  );
}
