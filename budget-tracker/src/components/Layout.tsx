import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/month', icon: '📅', label: 'Month' },
  { to: '/trends', icon: '📈', label: 'Trends' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
];

function linkClass({ isActive }: { isActive: boolean }): string {
  const base =
    'flex flex-1 md:flex-none flex-col md:flex-row items-center gap-1 md:gap-3 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors';
  return isActive
    ? `${base} bg-teal-100 text-teal-800`
    : `${base} text-slate-600 hover:bg-slate-100`;
}

export default function Layout() {
  return (
    <div className="min-h-screen md:flex">
      {/* Sidebar on desktop, bottom bar on mobile */}
      <nav
        aria-label="Main"
        className="fixed bottom-0 inset-x-0 z-10 flex gap-1 border-t border-slate-200 bg-white p-1
                   md:static md:w-56 md:flex-col md:border-t-0 md:border-r md:p-4"
      >
        <div className="hidden md:block mb-6 px-3 text-lg font-bold text-teal-700">💶 Budget</div>
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass}>
            <span aria-hidden className="text-lg md:text-base">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <main className="flex-1 p-4 pb-24 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
