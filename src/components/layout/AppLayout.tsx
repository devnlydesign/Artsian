
"use client"

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Search, Compass, Clapperboard, MessagesSquare, Heart, PlusSquare, UserCircle, Settings, Sparkles, Gem, Lightbulb, GitFork, Music, Globe, ShieldCheck, BarChartBig, Zap, CalendarClock, ShoppingCart
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarSeparator,
  SidebarGroupLabel
} from '@/components/ui/sidebar';
import { ArtisanLogo } from '@/components/icons/ArtisanLogo';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAppState } from '@/context/AppStateContext';

const mainNavItems = [
  { href: "/", label: "Home", icon: Home, tooltip: "Home Feed" },
  { href: "/search", label: "Search", icon: Search, tooltip: "Search Content" },
  { href: "/creative-stratosphere", label: "Explore", icon: Compass, tooltip: "Explore Network" },
  { href: "/reels", label: "Reels", icon: Clapperboard, tooltip: "View Reels" },
  { href: "/messages", label: "Messages", icon: MessagesSquare, tooltip: "Direct Messages" },
  { href: "/notifications", label: "Notifications", icon: Heart, tooltip: "Your Notifications" },
  { href: "/create", label: "Create", icon: PlusSquare, tooltip: "Create New Content" },
];

const artisanToolsNavItems = [
  { href: "/flux-signature", label: "Flux Signature", icon: Sparkles, tooltip: "My Flux Signature" },
  { href: "/crystalline-blooms", label: "Crystalline Blooms", icon: Gem, tooltip: "View Crystalline Blooms" },
  { href: "/algorithmic-muse", label: "Algorithmic Muse", icon: Lightbulb, tooltip: "Get Creative Prompts" },
  { href: "/genesis-trails", label: "Genesis Trails", icon: GitFork, tooltip: "Project Timelines" },
  { href: "/process-symphony", label: "Process Symphony", icon: Music, tooltip: "AI Generated Audio" },
  { href: "/biomes", label: "My Biomes", icon: ShieldCheck, tooltip: "Private Communities" },
  { href: "/insights", label: "Insights", icon: BarChartBig, tooltip: "Energy Flow Patterns" },
  { href: "/amplify-flux", label: "Amplify Flux", icon: Zap, tooltip: "Promote Your Work" },
  { href: "/scheduling", label: "Scheduling", icon: CalendarClock, tooltip: "Content Scheduling" },
  { href: "/shop", label: "Shop", icon: ShoppingCart, tooltip: "Artist Merchandise" },
];

const userProfileNavItem = { href: "/profile", label: "Profile", icon: UserCircle, tooltip: "Your Profile" };


export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { isAuthenticated, showWelcome, logout } = useAppState();

  if (showWelcome || pathname.startsWith('/auth/') || pathname.startsWith('/onboarding')) {
    return <>{children}</>;
  }
  
  const getPageTitle = () => {
    const allNavItems = [...mainNavItems, ...artisanToolsNavItems, userProfileNavItem];
    const currentItem = allNavItems.find(item => pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)));
    return currentItem?.label || "Artisan";
  }

  return (
    <SidebarProvider defaultOpen={!isMobile} collapsible={isMobile ? "offcanvas" : "icon"}>
      <Sidebar variant="sidebar" side="left" className="border-r border-sidebar-border">
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <ArtisanLogo className="h-8 w-8 text-sidebar-primary block group-data-[collapsible=expanded]:hidden" />
            <span className="font-bold text-2xl text-sidebar-foreground hidden group-data-[collapsible=expanded]:block italic">Artisan</span>
          </Link>
        </SidebarHeader>
        <SidebarContent asChild>
          <ScrollArea className="flex-1">
            <SidebarMenu className="px-2">
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} legacyBehavior passHref>
                    <SidebarMenuButton
                      isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
                      className="justify-start"
                      tooltip={item.tooltip}
                    >
                      <item.icon className="h-6 w-6" />
                      <span className="group-data-[collapsible=icon]:hidden text-base">{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
               {/* Profile link as main nav item */}
               <SidebarMenuItem key={userProfileNavItem.href}>
                  <Link href={userProfileNavItem.href} legacyBehavior passHref>
                    <SidebarMenuButton
                      isActive={pathname === userProfileNavItem.href || pathname.startsWith(userProfileNavItem.href)}
                      className="justify-start"
                      tooltip={userProfileNavItem.tooltip}
                    >
                      <userProfileNavItem.icon className="h-6 w-6" />
                      <span className="group-data-[collapsible=icon]:hidden text-base">{userProfileNavItem.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
            </SidebarMenu>
            <SidebarSeparator className="my-4" />
             <SidebarMenu className="px-2">
              <SidebarGroupLabel className="px-2 text-xs uppercase text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">Artist Tools</SidebarGroupLabel>
              {artisanToolsNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} legacyBehavior passHref>
                    <SidebarMenuButton
                      isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
                      className="justify-start"
                      tooltip={item.tooltip}
                      size="sm"
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </ScrollArea>
        </SidebarContent>
         <SidebarFooter className="p-4 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-2 h-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-auto transition-colors hover:bg-sidebar-accent">
                  <Settings className="h-6 w-6 text-sidebar-foreground" />
                  <span className="ml-2 text-base text-sidebar-foreground group-data-[collapsible=icon]:hidden">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2 ml-2" side="top" align="start">
              <DropdownMenuLabel>User Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Your Activity</DropdownMenuItem>
              <DropdownMenuItem>Saved Content</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:bg-destructive/20 focus:text-destructive">Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-md px-6">
            <div className="flex items-center gap-4">
              {isMobile && <SidebarTrigger />}
              <h1 className="text-xl font-semibold text-gradient-primary-accent">
                {getPageTitle()}
              </h1>
            </div>
            <UserMenu />
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function UserMenu() {
  const { logout } = useAppState();
  // Placeholder user data
  const userName = "Alex Chroma";
  const userEmail = "alex.chroma@example.com";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-primary/50 transition-transform hover:scale-110">
            <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="user profile avatar" />
            <AvatarFallback>{userName ? userName.substring(0,1).toUpperCase() : "U"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/profile">Profile</Link></DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-destructive focus:bg-destructive/20 focus:text-destructive">Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
