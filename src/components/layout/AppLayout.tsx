
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
  SidebarInset
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
  { href: "/reels", label: "Reels", icon: Clapperboard, tooltip: "View Reels (placeholder)" },
  { href: "/messages", label: "Messages", icon: MessagesSquare, tooltip: "Direct Messages" },
  { href: "/notifications", label: "Notifications", icon: Heart, tooltip: "Your Notifications (placeholder)" },
  { href: "/create", label: "Create", icon: PlusSquare, tooltip: "Create New Content (placeholder)" },
  { href: "/profile", label: "Profile", icon: UserCircle, tooltip: "Your Profile (placeholder)" },
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


export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { isAuthenticated, showWelcome } = useAppState();

  // If showing welcome screen or on any auth/* path, don't render AppLayout
  if (showWelcome || pathname.startsWith('/auth/') || pathname.startsWith('/onboarding')) {
    return <>{children}</>;
  }
  
  // If not authenticated and not on an auth path (already handled),
  // potentially redirect or show minimal layout, but for now let's assume AppStateProvider handles redirection.
  // This check might be redundant if AppStateProvider always redirects non-auth users away from protected areas.
  // if (!isAuthenticated) {
  //   // Or return a minimal layout, or null if redirection is handled
  //   return <>{children}</>;
  // }


  return (
    <SidebarProvider defaultOpen={!isMobile} collapsible={isMobile ? "offcanvas" : "icon"}>
      <Sidebar variant="sidebar" side="left" className="border-r border-sidebar-border">
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            {/* For icon-only state, show logo. For expanded, show "Artisan" text */}
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
            </SidebarMenu>
            <SidebarSeparator className="my-4" />
             <SidebarMenu className="px-2">
              <SidebarGroupLabel className="px-2 text-xs uppercase text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">Tools</SidebarGroupLabel>
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
              <Button variant="ghost" className="w-full justify-start p-2 h-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-auto">
                  <Settings className="h-6 w-6 text-sidebar-foreground" />
                  <span className="ml-2 text-base text-sidebar-foreground group-data-[collapsible=icon]:hidden">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2 ml-2" side="top" align="start">
              <DropdownMenuLabel>User Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Your Activity</DropdownMenuItem>
              <DropdownMenuItem>Saved</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-md px-6">
            <div className="flex items-center gap-4">
              {isMobile && <SidebarTrigger />}
              <h1 className="text-xl font-semibold">
                {mainNavItems.find(item => pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)))?.label || 
                 artisanToolsNavItems.find(item => pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)))?.label ||
                 "Artisan"}
              </h1>
            </div>
            <UserMenu />
        </header>
        <main className="flex-1 overflow-y-auto p-6">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function UserMenu() {
  const { logout } = useAppState();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="avatar person" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Artist Name</p> {/* Replace with actual user name */}
            <p className="text-xs leading-none text-muted-foreground">
              artist@example.com {/* Replace with actual user email */}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/profile">Profile</Link></DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Add a simple mobile bottom navigation if needed
// function MobileBottomNav() { ... }
