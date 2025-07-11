'use client'

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  IconHome2,
  IconBroadcast,
  IconCast,
  IconDeviceTv,
  IconLogout,
  IconUser,
} from '@tabler/icons-react';
import { Stack, Tooltip, UnstyledButton } from '@mantine/core';
import classes from '../app/NavbarMinimalColored.module.css';

// Custom hook for scroll direction
const useScrollDirection = () => {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      
      if (Math.abs(scrollY - lastScrollY) < 5) {
        ticking = false;
        return;
      }
      
      const direction = scrollY > lastScrollY ? 'down' : 'up';
      setScrollDirection(direction);
      
      if (direction === 'down' && scrollY > 50) {
        setIsVisible(false);
      } else if (direction === 'up') {
        setIsVisible(true);
      }
      
      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return { scrollDirection, isVisible };
};

interface NavbarLinkProps {
  icon: typeof IconHome2;
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

function NavbarLink({ icon: Icon, label, active, onClick, className }: NavbarLinkProps) {
  return (
    <Tooltip label={label} position="right" transitionProps={{ duration: 0 }}>
      <UnstyledButton 
        onClick={onClick} 
        className={`${classes.link} ${className || ''}`} 
        data-active={active || undefined}
      >
        <Icon size={20} stroke={1.5} />
      </UnstyledButton>
    </Tooltip>
  );
}

const mockdata = [
  { name: 'Dashboard', href: '/dashboard', icon: IconHome2 },
  { name: 'Channel', href: '/channel', icon: IconBroadcast },
  { name: 'Chromecast', href: '/chromecast', icon: IconCast },
  { name: 'Hospitality', href: '/hospitality', icon: IconDeviceTv },
  { name: 'Account', href: '/account', icon: IconUser },
];

export function NavbarMinimalColored() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const { isVisible } = useScrollDirection();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    // Remove user data from memory instead of localStorage
    // localStorage.removeItem("user");
    // For demo purposes, we'll just navigate to login
    router.push("/login");
  };

  const links = mockdata.map((link) => (
    <NavbarLink
      icon={link.icon}
      label={link.name}
      key={link.name}
      active={pathname === link.href}
      onClick={() => router.push(link.href)}
    />
  ));

  const navbarClasses = `${classes.navbar} ${!isVisible && isMobile ? classes.hidden : ''}`;

  return (
    <nav className={navbarClasses}>
      <div className={classes.navbarMain}>
        {isMobile ? (
          <div className={classes.mainLinks}>
            {links}
          </div>
        ) : (
          <Stack justify="center" gap={0}>
            {links}
          </Stack>
        )}
      </div>

      <div className={classes.navbarActions}>
        {isMobile ? (
          <>
            <NavbarLink 
              icon={IconLogout} 
              label="Logout" 
              onClick={handleLogout}
            />
          </>
        ) : (
          <Stack justify="center" gap={0}>
            <NavbarLink 
              icon={IconLogout} 
              label="Logout" 
              onClick={handleLogout}
            />
          </Stack>
        )}
      </div>
    </nav>
  );
}

export default NavbarMinimalColored;