
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DollarSign, MapPin, ExternalLink, UserCircle, Shield, Bell, Palette, HelpCircle, LogOut, Save, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useAppState } from '@/context/AppStateContext';
import { saveUserProfile, getUserProfile, type UserProfileData } from '@/actions/userProfile';
import { Textarea } from '@/components/ui/textarea'; // Added for Bio

export default function SettingsPage() {
  const { toast } = useToast();
  const { currentUser, logoutUser } = useAppState(); // Added logoutUser

  const [profileData, setProfileData] = useState<Partial<UserProfileData>>({
    location: "",
    portfolioLink: "",
    website: "",
    fullName: "",
    username: "",
    bio: "",
    // Initialize other fields as needed
  });
  const [isMonetizationEnabled, setIsMonetizationEnabled] = useState(false); // Placeholder
  const [emailNotifications, setEmailNotifications] = useState(true); // Placeholder
  const [pushNotifications, setPushNotifications] = useState(true); // Placeholder
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);


  useEffect(() => {
    async function fetchProfile() {
      if (currentUser?.uid) {
        setIsLoading(true);
        const data = await getUserProfile(currentUser.uid);
        if (data) {
          setProfileData({
            fullName: data.fullName || "",
            username: data.username || "",
            bio: data.bio || "",
            location: data.location || "",
            portfolioLink: data.portfolioLink || "",
            website: data.website || "",
            emailOptIn: data.emailOptIn ?? true,
            // set other fields from 'data'
          });
          setEmailNotifications(data.emailOptIn ?? true); // Sync with profile data
        }
        setIsLoading(false);
      } else {
        setIsLoading(false); // No user, no data to load
      }
    }
    fetchProfile();
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    if (!currentUser?.uid) {
      toast({ title: "Error", description: "You must be logged in to save settings.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const dataToSave: Partial<UserProfileData> = {
      ...profileData,
      emailOptIn: emailNotifications, // Save notification preference
    };

    const result = await saveUserProfile(currentUser.uid, dataToSave);
    if (result.success) {
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated.",
      });
    } else {
      toast({
        title: "Error Saving Settings",
        description: result.message || "Could not save settings. Please try again.",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-3xl mx-auto">
        <Card><CardHeader><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardHeader></Card>
        <Card><CardContent><p>Loading settings...</p></CardContent></Card>
      </div>
    );
  }

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
            <Label htmlFor="fullName">Full Name</Label>
            <Input 
                id="fullName" 
                name="fullName"
                placeholder="Your full name" 
                value={profileData.fullName || ""}
                onChange={handleInputChange} 
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="username">Username</Label>
            <Input 
                id="username" 
                name="username"
                placeholder="Your unique username" 
                value={profileData.username || ""}
                onChange={handleInputChange} 
            />
          </div>
           <div className="space-y-1">
            <Label htmlFor="bio">Bio</Label>
            <Textarea 
                id="bio" 
                name="bio"
                placeholder="Tell everyone a bit about yourself and your art." 
                value={profileData.bio || ""}
                onChange={handleInputChange} 
                rows={3}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="location">Your Location</Label>
            <Input 
                id="location" 
                name="location"
                placeholder="e.g., New York, USA or 'The Internet'" 
                value={profileData.location || ""}
                onChange={handleInputChange} 
            />
            <p className="text-xs text-muted-foreground">This will be displayed on your profile.</p>
          </div>
           <div className="space-y-1">
            <Label htmlFor="website">Personal Website</Label>
            <Input 
                id="website" 
                name="website"
                type="url" 
                placeholder="https://your-personal-site.com" 
                value={profileData.website || ""}
                onChange={handleInputChange}
            />
             <p className="text-xs text-muted-foreground">Link to your primary website.</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="portfolioLink">External Portfolio Link</Label>
            <Input 
                id="portfolioLink" 
                name="portfolioLink"
                type="url" 
                placeholder="https://your-amazing-portfolio.com" 
                value={profileData.portfolioLink || ""}
                onChange={handleInputChange}
            />
             <p className="text-xs text-muted-foreground">Link to your portfolio on another platform (e.g., Behance, ArtStation).</p>
          </div>
        </CardContent>
      </Card>

      {/* Monetization Settings */}
      <Card className="card-interactive-hover">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><DollarSign className="text-green-500" /> Monetization</CardTitle>
          <CardDescription>Manage how you earn with ARTISAN. (Currently a placeholder for future integration)</CardDescription>
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
                    disabled // Disabled for now as it's a placeholder
                />
            </div>
            {isMonetizationEnabled && (
                 <p className="text-sm text-center text-muted-foreground p-4 border border-dashed rounded-md">
                    Monetization setup and dashboard would appear here. This typically involves connecting payment accounts and configuring your offerings.
                </p>
            )}
             <p className="text-xs text-muted-foreground">
                Note: Full monetization features require backend integration with Stripe (or similar) and adherence to platform policies. This is a UI placeholder.
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
                        Receive important updates, news, and special offers from ARTISAN at {currentUser?.email}.
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
            <Button variant="ghost" className="w-full justify-start" disabled><Shield className="mr-2 h-5 w-5"/> Security & Privacy (Coming Soon)</Button>
            <Button variant="ghost" className="w-full justify-start" disabled><Palette className="mr-2 h-5 w-5"/> Appearance (Theme) (Coming Soon)</Button>
            <Button variant="ghost" className="w-full justify-start" disabled><HelpCircle className="mr-2 h-5 w-5"/> Help & Support (Coming Soon)</Button>
            <Button variant="ghost" onClick={logoutUser} className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"><LogOut className="mr-2 h-5 w-5"/> Log Out</Button>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button variant="gradientPrimary" onClick={handleSaveChanges} disabled={isSaving} className="transition-transform hover:scale-105">
          {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Save className="mr-2 h-5 w-5"/>}
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
