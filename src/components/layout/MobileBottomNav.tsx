
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, PlusSquare, UserCircle, Users, MessagesSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/messages", label: "Chat", icon: MessagesSquare },
  { href: "/create", label: "Create", icon: PlusSquare },
  { href: "/profile", label: "Profile", icon: UserCircle },
  // { href: "/communities", label: "Communities", icon: Users }, // Decided to keep 5 main icons for simplicity on bottom nav
];

export function MobileBottomNav() {
  const pathname = usePathname();

  // A more specific set of icons for the bottom bar, Communities can be accessed via sidebar or explore.
  const bottomNavItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/explore", label: "Explore", icon: Compass },
    { href: "/create", label: "Create", icon: PlusSquare },
    { href: "/messages", label: "Chat", icon: MessagesSquare },
    { href: "/profile", label: "Profile", icon: UserCircle },
  ];


  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border shadow-md md:hidden z-40">
      <div className="flex justify-around items-center h-full">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href) && item.href !== "/explore") || (item.href === "/explore" && pathname.startsWith("/explore"));
          return (
            <Link key={item.href} href={item.href} legacyBehavior passHref>
              <a className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-primary transition-colors">
                <item.icon className={cn("h-6 w-6", isActive && "text-primary")} />
                <span className={cn("text-[0.6rem] mt-0.5", isActive && "text-primary")}>{item.label}</span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

    