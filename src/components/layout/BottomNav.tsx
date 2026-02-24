import { NavLink } from 'react-router-dom';
import { Home, Search, List, PlusCircle, User } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export const BottomNav = () => {
  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Buscar', path: '/search' },
    { icon: List, label: 'Listas', path: '/lists' },
    { icon: PlusCircle, label: 'Preço', path: '/contribute' },
    { icon: User, label: 'Perfil', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-t border-slate-100 safe-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center w-full h-full transition-all space-y-1',
                isActive ? 'text-primary' : 'text-slate-400'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
