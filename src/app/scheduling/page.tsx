
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarClock, PlusCircle, Edit3, Trash2, BellDot } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface ScheduledItem {
  id: string;
  title: string;
  type: "New Artwork" | "Process Update" | "Biome Announcement";
  bloomId?: string; 
  scheduledDate: Date;
  status: "Scheduled" | "Published" | "Draft";
  thumbnailUrl: string;
  dataAiHint: string;
}

const initialScheduledItems: ScheduledItem[] = [
  { id: "1", title: "Launch 'Quantum Entanglement' series", type: "New Artwork", bloomId: "bloom-qe", scheduledDate: new Date(new Date().setDate(new Date().getDate() + 7)), status: "Scheduled", thumbnailUrl: "https://placehold.co/150x100.png", dataAiHint: "quantum physics art" },
  { id: "2", title: "Behind the scenes: Digital Sculpting", type: "Process Update", scheduledDate: new Date(new Date().setDate(new Date().getDate() + 3)), status: "Scheduled", thumbnailUrl: "https://placehold.co/150x100.png", dataAiHint: "3d sculpting software" },
  { id: "3", title: "Inner Circle Q&A Session", type: "Biome Announcement", scheduledDate: new Date(new Date().setDate(new Date().getDate() - 2)), status: "Published", thumbnailUrl: "https://placehold.co/150x100.png", dataAiHint: "online community chat" },
  { id: "4", title: "Draft: New Painting Concepts", type: "New Artwork", scheduledDate: new Date(new Date().setDate(new Date().getDate() + 14)), status: "Draft", thumbnailUrl: "https://placehold.co/150x100.png", dataAiHint: "painting sketch ideas" },
];


export default function SchedulingPage() {
  const [scheduledItems, setScheduledItems] = useState<ScheduledItem[]>(initialScheduledItems);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const itemsForSelectedDate = selectedDate 
    ? scheduledItems.filter(item => format(item.scheduledDate, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd"))
    : scheduledItems.sort((a,b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

  return (
    <div className="space-y-8">
      <Card className="shadow-lg card-interactive-hover">
        <CardHeader className="text-center">
          <CalendarClock className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl text-gradient-primary-accent">Creative Bloom Cycles</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Created by Charis</p>
          <CardDescription>Schedule new artwork, process updates, or announcements. Pre-program when Crystalline Blooms visually emerge.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button variant="gradientPrimary" className="transition-transform hover:scale-105">
            <PlusCircle className="mr-2 h-5 w-5" /> Schedule New Bloom Cycle
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="card-interactive-hover">
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={{ 
                  scheduled: scheduledItems.filter(item => item.status === "Scheduled").map(item => item.scheduledDate),
                  published: scheduledItems.filter(item => item.status === "Published").map(item => item.scheduledDate)
                }}
                modifiersStyles={{ 
                  scheduled: { border: "2px solid hsl(var(--primary))", borderRadius: "var(--radius)"},
                  published: { border: "2px solid hsl(var(--accent))", borderRadius: "var(--radius)", opacity: 0.7 }
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="card-interactive-hover">
            <CardHeader>
              <CardTitle>
                Items for {selectedDate ? format(selectedDate, "PPP") : "All Dates"}
              </CardTitle>
              <CardDescription>
                {selectedDate ? `Viewing items for the selected date.` : `Viewing all upcoming and recent items, sorted by date.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {itemsForSelectedDate.length > 0 ? (
                <div className="space-y-4">
                  {itemsForSelectedDate.map((item) => (
                    <Card key={item.id} className="flex items-center p-4 gap-4 card-interactive-hover hover:border-primary">
                      <Image 
                        src={item.thumbnailUrl} 
                        alt={item.title} 
                        width={100} 
                        height={67} 
                        className="rounded-md object-cover aspect-[3/2] transition-transform hover:scale-105"
                        data-ai-hint={item.dataAiHint}
                        />
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.type}</p>
                        <p className="text-xs text-muted-foreground">{format(item.scheduledDate, "PPp")}</p>
                      </div>
                      <Badge 
                        variant={item.status === "Scheduled" ? "default" : item.status === "Published" ? "secondary" : "outline"}
                        className="whitespace-nowrap"
                      >
                        {item.status === "Scheduled" && <BellDot className="mr-1 h-3 w-3 animate-pulse"/>}
                        {item.status}
                      </Badge>
                      <div className="flex flex-col sm:flex-row gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 transition-colors hover:text-primary">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 transition-colors hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No items scheduled for this date.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
