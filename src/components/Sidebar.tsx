"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IconHome2,
  IconBroadcast,
  IconCast,
  IconDeviceTv,
  IconLogout,
  IconInfoHexagon,
  IconMichelinBibGourmand,
  IconBrain,
  IconUsers,
  IconUserCog,
  IconSettings,
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
  // Main Navigation (Admin & Guest - Ordered)
  { name: "Dashboard", href: "/dashboard", icon: IconHome2, roles: ["admin", "guest"], section: "main" },
  { name: "Channel", href: "/channels", icon: IconBroadcast, roles: ["admin"], section: "main" },
  { name: "Chromecast", href: "/chromecast", icon: IconCast, roles: ["admin"], section: "main" },
  { name: "Hospitality", href: "/hospitality", icon: IconDeviceTv, roles: ["admin"], section: "main" },
  { name: "ML Dashboard", href: "/ml-dashboard", icon: IconBrain, roles: ["admin"], section: "main" },
  { name: "Notifications", href: "/notifications", icon: IconInfoHexagon, roles: ["admin", "guest"], section: "main" },
  { name: "Help", href: "/help", icon: IconMichelinBibGourmand, roles: ["admin", "guest"], section: "main" },

  // User & Staff Management (Admin Only - Divider sebelum ini)
  { name: "Users", href: "/users", icon: IconUserCog, roles: ["admin"], section: "management" },
  { name: "Staff", href: "/staff", icon: IconUsers, roles: ["admin"], section: "management" },
];

export function NavbarMinimalColored() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const { isVisible } = useScrollDirection(); // Gunakan hook eksternal
  const { logout, user } = useAuth();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  // Filter menu berdasarkan user role dan group by section
  const userRole = user?.role || 'guest';
  const filteredLinks = mockdata.filter((link) =>
    link.roles.includes(userRole)
  );

  // Group links by section
  const mainLinks = filteredLinks.filter(link => link.section === "main");
  const managementLinks = filteredLinks.filter(link => link.section === "management");

  const renderLinks = (links: typeof mockdata) => links.map((link) => (
    <NavbarLink
      icon={link.icon}
      label={link.name}
      key={link.name}
      active={pathname === link.href}
      onClick={() => router.push(link.href)}
    />
  ));

  // Add divider component
  const Divider = () => (
    <div
      style={{
        width: '80%',
        height: '1px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        margin: '8px auto'
      }}
    />
  );

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
          <div className={classes.mainLinks}>
            {renderLinks(mainLinks)}
            {managementLinks.length > 0 && <Divider />}
            {renderLinks(managementLinks)}
          </div>
        ) : (
          <Stack justify="center" gap={0}>
            {renderLinks(mainLinks)}
            {managementLinks.length > 0 && <Divider />}
            {renderLinks(managementLinks)}
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