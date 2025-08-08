"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IconHome2,
  IconBroadcast,
  IconCast,
  IconDeviceTv,
  IconLogout,
} from "@tabler/icons-react";
import { Stack, Tooltip, UnstyledButton } from "@mantine/core";
import classes from "../app/NavbarMinimalColored.module.css";
import { useAuth } from "./AuthContext";
import { useScrollDirection } from '../app/useScrollDirection';

interface NavbarLinkProps {
  icon: typeof IconHome2;
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

function NavbarLink({
  icon: Icon,
  label,
  active,
  onClick,
  className,
}: NavbarLinkProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isMobile) {
    // Mobile: hanya icon dengan tooltip
    return (
      <Tooltip label={label} position="top" transitionProps={{ duration: 0 }}>
        <UnstyledButton
          onClick={onClick}
          className={`${classes.link} ${className || ""}`}
          data-active={active || undefined}
        >
          <Icon size={20} stroke={1.5} />
        </UnstyledButton>
      </Tooltip>
    );
  }

  // Desktop: icon dengan label
  return (
    <UnstyledButton
      onClick={onClick}
      className={`${classes.linkWithLabel} ${className || ""}`}
      data-active={active || undefined}
    >
      <Icon size={20} stroke={1.5} />
      <span className={classes.linkLabel}>{label}</span>
    </UnstyledButton>
  );
}

const mockdata = [
  { name: "Dashboard", href: "/dashboard", icon: IconHome2 },
  { name: "Channel", href: "/channel", icon: IconBroadcast },
  { name: "Chromecast", href: "/chromecast", icon: IconCast },
  { name: "Hospitality", href: "/hospitality", icon: IconDeviceTv },
];

export function NavbarMinimalColored() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const { isVisible } = useScrollDirection(); // Gunakan hook eksternal
  const { logout } = useAuth();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      window.location.href = "/login";
    }
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

  // Improved mobile navbar visibility logic
  const getNavbarClasses = () => {
    let navbarClasses = classes.navbar;
    
    if (isMobile) {
      // Only hide if not visible
      if (!isVisible) {
        navbarClasses += ` ${classes.hidden}`;
      }
    }
    
    return navbarClasses;
  };

  return (
    <nav className={getNavbarClasses()}>
      <div className={classes.navbarMain}>
        {isMobile ? (
          <div className={classes.mainLinks}>{links}</div>
        ) : (
          <Stack justify="center" gap={0}>
            {links}
          </Stack>
        )}
      </div>

      <div className={classes.navbarActions}>
        {isMobile ? (
          <NavbarLink
            icon={IconLogout}
            label="Logout"
            onClick={handleLogout}
          />
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
