
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DollarSign, MapPin, ExternalLink, UserCircle, Shield, Bell, Palette, HelpCircle, LogOut, Save } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { toast } = useToast();
  // Mock state for settings - in a real app, this would come from user data
  const [location, setLocation] = useState("Digital Realm / NYC");
  const [portfolioLink, setPortfolioLink] = useState("https://yourportfolio.example.com");
  const [isMonetizationEnabled, setIsMonetizationEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  const handleSaveChanges = () => {
    // In a real app, you would save these settings to your backend/database
    console.log("Settings saved:", { location, portfolioLink, isMonetizationEnabled, emailNotifications, pushNotifications });
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated.",
    });
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <Card className="shadow-lg card-interactive-hover">
        <CardHeader>
          <UserCircle className="h-10 w-10 text-primary mb-2" />
          <CardTitle className="text-3xl">Account Settings</CardTitle>
          <CardDescription>Manage your profile information, preferences, and platform settings.</CardDescription>
        </CardHeader>
      </Card>

      {/* Profile Settings */}
      <Card className="card-interactive-hover">
        <CardHeader>
          <CardTitle className="text-xl">Profile Information</CardTitle>
          <CardDescription>Update your public profile details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="location">Your Location</Label>
            <Input 
                id="location" 
                placeholder="e.g., New York, USA or 'The Internet'" 
                value={location}
                onChange={(e) => setLocation(e.target.value)} 
            />
            <p className="text-xs text-muted-foreground">This will be displayed on your profile.</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="portfolioLink">External Portfolio Link</Label>
            <Input 
                id="portfolioLink" 
                type="url" 
                placeholder="https://your-amazing-portfolio.com" 
                value={portfolioLink}
                onChange={(e) => setPortfolioLink(e.target.value)}
            />
             <p className="text-xs text-muted-foreground">Link to your personal website or portfolio on another platform.</p>
          </div>
           {/* Placeholder for more profile fields like name, username, bio - usually edited on profile page or a dedicated 'edit profile' page */}
        </CardContent>
      </Card>

      {/* Monetization Settings */}
      <Card className="card-interactive-hover">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><DollarSign className="text-green-500" /> Monetization</CardTitle>
          <CardDescription>Manage how you earn with ARTISAN. (Placeholder for Instagram-like monetization program)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                    <h4 className="font-medium">Enable Content Monetization</h4>
                    <p className="text-sm text-muted-foreground">Allow options for subscriptions, tips, or exclusive content.</p>
                </div>
                <Switch 
                    checked={isMonetizationEnabled} 
                    onCheckedChange={setIsMonetizationEnabled} 
                    aria-label="Toggle content monetization"
                />
            </div>
            {isMonetizationEnabled && (
                 <p className="text-sm text-center text-muted-foreground p-4 border border-dashed rounded-md">
                    Monetization setup and dashboard would appear here. This typically involves connecting payment accounts and configuring your offerings.
                </p>
            )}
             <p className="text-xs text-muted-foreground">
                Note: Full monetization features require backend integration and adherence to platform policies. This is a UI placeholder.
            </p>
        </CardContent>
      </Card>
      
      {/* Notification Settings */}
      <Card className="card-interactive-hover">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><Bell /> Notification Preferences</CardTitle>
          <CardDescription>Choose how you want to be notified.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
                <Label htmlFor="emailNotifications" className="flex flex-col space-y-1">
                    <span>Email Notifications</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                        Receive important updates and summaries via email.
                    </span>
                </Label>
                <Switch id="emailNotifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
             <div className="flex items-center justify-between">
                <Label htmlFor="pushNotifications" className="flex flex-col space-y-1">
                    <span>Push Notifications</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                        Get real-time alerts on your device. (Requires app integration)
                    </span>
                </Label>
                <Switch id="pushNotifications" checked={pushNotifications} onCheckedChange={setPushNotifications} disabled/>
            </div>
        </CardContent>
      </Card>

      {/* Other Settings */}
      <Card className="card-interactive-hover">
        <CardHeader>
            <CardTitle className="text-xl">More Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
            <Button variant="ghost" className="w-full justify-start"><Shield className="mr-2 h-5 w-5"/> Security & Privacy</Button>
            <Button variant="ghost" className="w-full justify-start"><Palette className="mr-2 h-5 w-5"/> Appearance (Theme)</Button>
            <Button variant="ghost" className="w-full justify-start"><HelpCircle className="mr-2 h-5 w-5"/> Help & Support</Button>
            <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"><LogOut className="mr-2 h-5 w-5"/> Log Out</Button>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button variant="gradientPrimary" onClick={handleSaveChanges} className="transition-transform hover:scale-105">
          <Save className="mr-2 h-5 w-5"/> Save Changes
        </Button>
      </div>
    </div>
  );
}
