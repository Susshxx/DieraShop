import { NavLink } from 'react-router-dom';

const aboutPages = [
  { name: 'Our Story', path: '/about/our-story' },
  { name: 'Sustainability', path: '/about/sustainability' },
  { name: 'Customer Care', path: '/about/customer-care' },
  { name: 'Store Locator', path: '/about/store-locator' }
];

const AboutSidebar = () => {
  return (
    <aside className="hidden md:block w-64 pr-8 py-8 border-r border-border">
      <nav className="sticky top-24 space-y-1">
        <h3 className="text-lg font-medium text-foreground mb-6">About</h3>
        {aboutPages.map((page) => (
          <NavLink
            key={page.path}
            to={page.path}
            className={({ isActive }) =>
              `block py-2 px-3 text-sm font-light transition-all rounded ${
                isActive
                  ? 'text-foreground bg-accent font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`
            }
          >
            {page.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default AboutSidebar;