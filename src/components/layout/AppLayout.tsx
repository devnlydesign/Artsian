
"use client"

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Search, Compass, Clapperboard, MessagesSquare, Heart, PlusSquare, UserCircle, Settings, Sparkles, Gem, Lightbulb, GitBranch, Music, ShieldCheck, BarChartBig, Zap, CalendarClock, ShoppingCart, Bot, Palette, LogOut
} from 'lucide-react'; // Added LogOut
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
import { MobileBottomNav } from './MobileBottomNav';

const mainNavItems = [
  { href: "/", label: "Home", icon: Home, tooltip: "Home Feed" },
  { href: "/profile", label: "My Profile", icon: UserCircle, tooltip: "Your Profile" },
  { href: "/search", label: "Search", icon: Search, tooltip: "Search Content" },
  { href: "/creative-stratosphere", label: "Discover", icon: Compass, tooltip: "Discover Art & Creators" },
  { href: "/reels", label: "Reels", icon: Clapperboard, tooltip: "View Reels" },
  { href: "/messages", label: "Messages", icon: MessagesSquare, tooltip: "Direct Messages" },
  { href: "/notifications", label: "Activity", icon: Heart, tooltip: "Your Notifications" },
  { href: "/create", label: "Create", icon: PlusSquare, tooltip: "Create New Content" },
];

const artisanToolsNavItems = [
  { href: "/flux-signature", label: "My Artistic Style", icon: Palette, tooltip: "View Your Artistic Style" },
  { href: "/crystalline-blooms", label: "My Artworks", icon: Gem, tooltip: "View My Artworks" },
  { href: "/algorithmic-muse", label: "AI Idea Sparker", icon: Lightbulb, tooltip: "Get Creative Ideas" },
  { href: "/genesis-trails", label: "Project Stories", icon: GitBranch, tooltip: "Project Creation Timelines" },
  { href: "/process-symphony", label: "Creative Soundtracks", icon: Music, tooltip: "AI Generated Audio for Sessions" },
  { href: "/personal-assistant", label: "AI Assistant", icon: Bot, tooltip: "Personalize Your App" },
  { href: "/biomes", label: "Private Spaces", icon: ShieldCheck, tooltip: "Your Private Communities" },
  { href: "/insights", label: "My Insights", icon: BarChartBig, tooltip: "Audience Engagement Data" },
  { href: "/amplify-flux", label: "Boost Your Art", icon: Zap, tooltip: "Promote Your Work" },
  { href: "/scheduling", label: "Content Planner", icon: CalendarClock, tooltip: "Plan Your Content Releases" },
  { href: "/shop", label: "My Shop", icon: ShoppingCart, tooltip: "Your Artist Shop" },
];


export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { isAuthenticated, showWelcome, logoutUser, currentUser } = useAppState(); // Use logoutUser

  if (showWelcome || pathname.startsWith('/auth/') || pathname.startsWith('/onboarding')) {
    return <>{children}</>;
  }
  
  const getPageTitle = () => {
    const allNavItems = [...mainNavItems, ...artisanToolsNavItems];
    const currentItem = allNavItems.find(item => pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)));
    return currentItem?.label || "Artisan";
  }

  return (
    <SidebarProvider defaultOpen={!isMobile} collapsible={isMobile ? "offcanvas" : "icon"}>
      <Sidebar variant="sidebar" side="left" className="border-r border-sidebar-border hidden md:flex">
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
              {isAuthenticated ? (
                <DropdownMenuItem onClick={logoutUser} className="text-destructive focus:bg-destructive/20 focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4"/> Log out
                </DropdownMenuItem>
              ) : (
                 <DropdownMenuItem asChild>
                    <Link href="/auth/login">
                        <UserCircle className="mr-2 h-4 w-4"/> Log In
                    </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-md px-6">
            <div className="flex items-center gap-4">
              {isMobile && <SidebarTrigger />} 
               <Link href="/" className="flex items-center gap-2 md:hidden"> 
                 <ArtisanLogo className="h-7 w-7 text-primary" />
                 <span className="font-semibold text-xl text-gradient-primary-accent">Artisan</span>
               </Link>
               <h1 className="text-xl font-semibold text-gradient-primary-accent hidden md:block"> 
                {getPageTitle()}
              </h1>
            </div>
            <UserMenu />
        </header>
        <main 
            key={pathname} 
            className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 animate-fadeInPage"
        >
            {children}
        </main>
        {isMobile && <MobileBottomNav />}
      </SidebarInset>
    </SidebarProvider>
  );
}

function UserMenu() {
  const { logoutUser, isAuthenticated, currentUser } = useAppState(); // Use logoutUser
  
  // Use Firebase user data if available
  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || "Artist";
  const userEmail = currentUser?.email || "No email";
  const userAvatarFallback = userName ? userName.substring(0,1).toUpperCase() : "A";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-primary/50 transition-transform hover:scale-110">
            <AvatarImage src={currentUser?.photoURL || "https://placehold.co/40x40.png"} alt="User Avatar" data-ai-hint="user profile avatar" />
            <AvatarFallback>{userAvatarFallback}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        {isAuthenticated && currentUser ? (
          <>
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
            <DropdownMenuItem onClick={logoutUser} className="text-destructive focus:bg-destructive/20 focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4"/>Log out
            </DropdownMenuItem>
          </>
        ) : (
           <>
            <DropdownMenuItem asChild>
                <Link href="/auth/login">
                    <UserCircle className="mr-2 h-4 w-4"/> Log In
                </Link>
            </DropdownMenuItem>
             <DropdownMenuItem asChild>
                <Link href="/auth/signup">
                    <PlusSquare className="mr-2 h-4 w-4"/> Sign Up
                </Link>
            </DropdownMenuItem>
           </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
