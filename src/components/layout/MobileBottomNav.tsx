
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Compass, PlusSquare, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/create", label: "Create", icon: PlusSquare },
  { href: "/creative-stratosphere", label: "Discover", icon: Compass }, // Or /notifications
  { href: "/profile", label: "Profile", icon: UserCircle },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border shadow-md md:hidden z-40">
      <div className="flex justify-around items-center h-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href) && item.href !== "/creative-stratosphere") || (item.href === "/creative-stratosphere" && pathname.startsWith("/creative-stratosphere"));
          return (
            <Link key={item.href} href={item.href} legacyBehavior passHref>
              <a className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-primary transition-colors">
                <item.icon className={cn("h-6 w-6", isActive && "text-primary")} />
                {/* Optional: Show label if needed, but icons are common for bottom nav */}
                {/* <span className={cn("text-xs mt-0.5", isActive && "text-primary")}>{item.label}</span> */}
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

    