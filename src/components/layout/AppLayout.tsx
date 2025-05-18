
"use client"

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Sparkles, Gem, Lightbulb, GitFork, Music, Globe, ShieldCheck, BarChartBig, Zap, CalendarClock, MessagesSquare, ShoppingCart, Menu
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
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, tooltip: "Dashboard" },
  { href: "/flux-signature", label: "Flux Signature", icon: Sparkles, tooltip: "My Flux Signature" },
  { href: "/crystalline-blooms", label: "Crystalline Blooms", icon: Gem, tooltip: "View Crystalline Blooms" },
  { href: "/algorithmic-muse", label: "Algorithmic Muse", icon: Lightbulb, tooltip: "Get Creative Prompts" },
  { href: "/genesis-trails", label: "Genesis Trails", icon: GitFork, tooltip: "Project Timelines" },
  { href: "/process-symphony", label: "Process Symphony", icon: Music, tooltip: "AI Generated Audio" },
  { href: "/creative-stratosphere", label: "Creative Stratosphere", icon: Globe, tooltip: "Explore Network" },
  { href: "/biomes", label: "My Biomes", icon: ShieldCheck, tooltip: "Private Communities" },
  { href: "/insights", label: "Insights", icon: BarChartBig, tooltip: "Energy Flow Patterns" },
  { href: "/amplify-flux", label: "Amplify Flux", icon: Zap, tooltip: "Promote Your Work" },
  { href: "/scheduling", label: "Scheduling", icon: CalendarClock, tooltip: "Content Scheduling" },
  { href: "/messages", label: "Messages", icon: MessagesSquare, tooltip: "Direct Messages" },
  { href: "/shop", label: "Shop", icon: ShoppingCart, tooltip: "Artist Merchandise" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  return (
    <SidebarProvider defaultOpen={!isMobile} collapsible={isMobile ? "offcanvas" : "icon"}>
      <Sidebar variant="sidebar" side="left" className="border-r border-sidebar-border">
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <ArtisanLogo className="h-8 w-8 text-sidebar-primary" />
            <span className="font-bold text-xl text-sidebar-foreground group-data-[collapsible=icon]:hidden">ARTISAN</span>
          </Link>
        </SidebarHeader>
        <SidebarContent asChild>
          <ScrollArea className="flex-1">
            <SidebarMenu className="px-2">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} legacyBehavior passHref>
                    <SidebarMenuButton
                      isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
                      className="justify-start"
                      tooltip={item.tooltip}
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
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                <Avatar className="h-8 w-8">
                    <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="avatar person" />
                    <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="text-sm group-data-[collapsible=icon]:hidden">
                    <p className="font-semibold text-sidebar-foreground">User Name</p>
                    <p className="text-xs text-sidebar-foreground/70">user@example.com</p>
                </div>
            </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-md px-6">
            <div className="flex items-center gap-4">
              {isMobile && <SidebarTrigger />}
              <h1 className="text-xl font-semibold">
                {navItems.find(item => pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)))?.label || "ARTISAN"}
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="avatar person" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">User Name</p>
            <p className="text-xs leading-none text-muted-foreground">
              user@example.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
