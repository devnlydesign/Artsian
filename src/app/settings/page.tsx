
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DollarSign, UserCircle, Shield, Bell, Palette, HelpCircle, LogOut, Save, Loader2, UploadCloud, Image as ImageIcon, Sun, Moon, Settings as SettingsIcon } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useAppState } from '@/context/AppStateContext';
import { saveUserProfile, getUserProfile, type UserProfileData } from '@/actions/userProfile';
import { Textarea } from '@/components/ui/textarea';
import NextImage from "next/image";
import { storage } from '@/lib/firebase';
import { ref as storageRefSdk, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

async function deleteFileFromFirebaseStorage(url: string | undefined | null): Promise<void> {
  if (!url || !url.startsWith('https://firebasestorage.googleapis.com/')) {
    console.info("[deleteFileFromFirebaseStorage] URL is invalid or not a Firebase Storage URL, skipping deletion:", url);
    return;
  }
  try {
    // Extract the path from the URL. The path starts after '/o/' and ends before '?alt=media'.
    const filePath = decodeURIComponent(new URL(url).pathname.split('/o/')[1].split('?')[0]);
    if (!filePath) {
        console.warn("[deleteFileFromFirebaseStorage] Could not extract file path from URL:", url);
        return;
    }
    const fileRef = storageRefSdk(storage, filePath);
    await deleteObject(fileRef);
    console.log("[deleteFileFromFirebaseStorage] Successfully deleted old file:", filePath);
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      console.warn(`[deleteFileFromFirebaseStorage] Old file not found for deletion, skipping: ${url}`);
    } else {
      console.error("[deleteFileFromFirebaseStorage] Error deleting old file from storage:", error);
    }
  }
}

export default function SettingsPage() {
  const { toast } = useToast();
  const { currentUser, logoutUser, refreshUserProfile } = useAppState(); // Added refreshUserProfile
  const { theme, setTheme } = useTheme();

  const [profileData, setProfileData] = useState<Partial<UserProfileData>>({});
  const [isMonetizationEnabled, setIsMonetizationEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(null);

  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (currentUser?.uid) {
        setIsLoading(true);
        const data = await getUserProfile(currentUser.uid);
        if (data) {
          setProfileData(data);
          setEmailNotifications(data.emailOptIn ?? true);
          // Use photoURL (display/thumbnail) for preview, not photoURLOriginal,
          // unless photoURL is null and photoURLOriginal exists.
          setProfileImagePreview(data.photoURL || data.photoURLOriginal || "https://placehold.co/100x100.png");
          setBannerImagePreview(data.bannerURL || data.bannerURLOriginal || "https://placehold.co/800x200.png");
        }
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name as keyof UserProfileData]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner') => {
    const file = event.target.files?.[0];
    if (file) {
      if (type === 'profile') {
        setProfileImageFile(file);
        setProfileImagePreview(URL.createObjectURL(file));
      } else {
        setBannerImageFile(file);
        setBannerImagePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSaveChanges = async () => {
    if (!currentUser?.uid) {
      toast({ title: "Error", description: "You must be logged in to save settings.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    
    let newPhotoURLOriginal = profileData.photoURLOriginal;
    let newBannerURLOriginal = profileData.bannerURLOriginal;
    
    // The display URLs (photoURL, bannerURL) will be updated if originals are updated.
    // The actual URLs for display (thumbnails) would ideally come from the Resize Images extension's output
    // or be constructed based on its naming convention. For now, we'll set the display URL to the new original if it changes.
    let displayPhotoURL = profileData.photoURL;
    let displayBannerURL = profileData.bannerURL;

    try {
      if (profileImageFile) {
        await deleteFileFromFirebaseStorage(profileData.photoURLOriginal); 
        // Also delete old display URL if it's different and a Firebase URL (might be a thumbnail path)
        if(profileData.photoURL !== profileData.photoURLOriginal) {
            await deleteFileFromFirebaseStorage(profileData.photoURL);
        }

        const profileFilePath = `users/${currentUser.uid}/profile/original_${Date.now()}_${profileImageFile.name}`;
        const profileFileRef = storageRefSdk(storage, profileFilePath);
        await uploadBytes(profileFileRef, profileImageFile);
        newPhotoURLOriginal = await getDownloadURL(profileFileRef);
        displayPhotoURL = newPhotoURLOriginal; // Assuming original is used as display for now
        toast({ title: "Profile Picture Uploaded", description: "Your new profile picture is set."});
      }

      if (bannerImageFile) {
        await deleteFileFromFirebaseStorage(profileData.bannerURLOriginal);
        if(profileData.bannerURL !== profileData.bannerURLOriginal) {
            await deleteFileFromFirebaseStorage(profileData.bannerURL);
        }

        const bannerFilePath = `users/${currentUser.uid}/banner/original_${Date.now()}_${bannerImageFile.name}`;
        const bannerFileRef = storageRefSdk(storage, bannerFilePath);
        await uploadBytes(bannerFileRef, bannerImageFile);
        newBannerURLOriginal = await getDownloadURL(bannerFileRef);
        displayBannerURL = newBannerURLOriginal; // Assuming original is used as display for now
        toast({ title: "Banner Image Uploaded", description: "Your new banner image is set."});
      }

      const dataToSave: Partial<UserProfileData> = {
        ...profileData,
        photoURL: displayPhotoURL, // Update display URL
        photoURLOriginal: newPhotoURLOriginal, // Update original URL
        bannerURL: displayBannerURL, // Update display banner
        bannerURLOriginal: newBannerURLOriginal, // Update original banner
        emailOptIn: emailNotifications,
      };

      const result = await saveUserProfile(currentUser.uid, dataToSave);
      if (result.success) {
        toast({
          title: "Settings Saved",
          description: "Your preferences have been updated.",
        });
        setProfileImageFile(null); 
        setBannerImageFile(null);
        
        // Re-fetch and update AppStateContext
        await refreshUserProfile(); 
        
        // Fetch again for local state after AppState context update
        const updatedData = await getUserProfile(currentUser.uid); 
        if (updatedData) {
            setProfileData(updatedData);
            setProfileImagePreview(updatedData.photoURL || updatedData.photoURLOriginal || "https://placehold.co/100x100.png");
            setBannerImagePreview(updatedData.bannerURL || updatedData.bannerURLOriginal || "https://placehold.co/800x200.png");
        }

      } else {
        toast({
          title: "Error Saving Settings",
          description: result.message || "Could not save settings. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error during save/upload:", error);
      toast({ title: "Upload/Save Error", description: "An error occurred while saving or uploading images.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-3xl mx-auto">
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <Card className="shadow-lg card-interactive-hover">
        <CardHeader>
          <SettingsIcon className="h-10 w-10 text-primary mb-2" />
          <CardTitle className="text-3xl">Settings</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Created by Charis Mul</p>
          <CardDescription>Manage your profile information, preferences, and platform settings for Charisarthub.</CardDescription>
        </CardHeader>
      </Card>

      <Card className="card-interactive-hover">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><Palette className="h-5 w-5 text-primary"/> Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the application.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <Label htmlFor="theme">Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger id="theme" className="w-[180px]">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light"><Sun className="inline-block mr-2 h-4 w-4"/>Light</SelectItem>
                <SelectItem value="dark"><Moon className="inline-block mr-2 h-4 w-4"/>Dark</SelectItem>
                <SelectItem value="system"><SettingsIcon className="inline-block mr-2 h-4 w-4"/>System</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Choose your preferred theme or let it follow your system settings.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="card-interactive-hover">
        <CardHeader>
          <CardTitle className="text-xl">Profile Information</CardTitle>
          <CardDescription>Update your public profile details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="profilePicture">Profile Picture</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profileImagePreview || undefined} alt="Profile Preview" data-ai-hint="user avatar" />
                <AvatarFallback><UserCircle className="h-12 w-12 text-muted-foreground"/></AvatarFallback>
              </Avatar>
              <Button type="button" variant="outline" onClick={() => profileFileInputRef.current?.click()} disabled={isSaving}>
                <UploadCloud className="mr-2 h-4 w-4" /> Change Picture
              </Button>
              <Input 
                id="profilePictureFile" 
                type="file" 
                className="hidden" 
                accept="image/*" 
                ref={profileFileInputRef}
                onChange={(e) => handleFileChange(e, 'profile')}
                disabled={isSaving}
              />
            </div>
            {profileImageFile && <p className="text-xs text-muted-foreground">New: {profileImageFile.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bannerImage">Banner Image</Label>
            <div className="aspect-[16/5] w-full bg-muted rounded-md overflow-hidden relative group">
              {bannerImagePreview ? (
                <NextImage src={bannerImagePreview} alt="Banner Preview" layout="fill" objectFit="cover" data-ai-hint="profile banner abstract" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mb-2" />
                  <p>No banner set</p>
                </div>
              )}
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={() => bannerFileInputRef.current?.click()}
                disabled={isSaving}
                >
                <UploadCloud className="mr-2 h-4 w-4" /> Change Banner
              </Button>
            </div>
             <Input 
                id="bannerImageFile" 
                type="file" 
                className="hidden" 
                accept="image/*" 
                ref={bannerFileInputRef}
                onChange={(e) => handleFileChange(e, 'banner')}
                disabled={isSaving}
              />
            {bannerImageFile && <p className="text-xs text-muted-foreground">New: {bannerImageFile.name}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" name="fullName" placeholder="Your full name" value={profileData.fullName || ""} onChange={handleInputChange} disabled={isSaving}/>
          </div>
          <div className="space-y-1">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" placeholder="Your unique username" value={profileData.username || ""} onChange={handleInputChange} disabled={isSaving}/>
          </div>
           <div className="space-y-1">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" name="bio" placeholder="Tell everyone a bit about yourself and your art." value={profileData.bio || ""} onChange={handleInputChange} rows={3} disabled={isSaving}/>
          </div>
          <div className="space-y-1">
            <Label htmlFor="location">Your Location</Label>
            <Input id="location" name="location" placeholder="e.g., New York, USA or 'The Internet'" value={profileData.location || ""} onChange={handleInputChange} disabled={isSaving}/>
            <p className="text-xs text-muted-foreground">This will be displayed on your profile.</p>
          </div>
           <div className="space-y-1">
            <Label htmlFor="website">Personal Website</Label>
            <Input id="website" name="website" type="url" placeholder="https://your-personal-site.com" value={profileData.website || ""} onChange={handleInputChange} disabled={isSaving}/>
             <p className="text-xs text-muted-foreground">Link to your primary website.</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="portfolioLink">External Portfolio Link</Label>
            <Input id="portfolioLink" name="portfolioLink" type="url" placeholder="https://your-amazing-portfolio.com" value={profileData.portfolioLink || ""} onChange={handleInputChange} disabled={isSaving}/>
             <p className="text-xs text-muted-foreground">Link to your portfolio on another platform (e.g., Behance, ArtStation).</p>
          </div>
        </CardContent>
      </Card>

      <Card className="card-interactive-hover">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><DollarSign className="text-green-500" /> Monetization</CardTitle>
          <CardDescription>Manage how you earn with Charisarthub. (Currently a placeholder for future integration)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                    <h4 className="font-medium">Enable Content Monetization</h4>
                    <p className="text-sm text-muted-foreground">Allow options for subscriptions, tips, or exclusive content.</p>
                </div>
                <Switch checked={isMonetizationEnabled} onCheckedChange={setIsMonetizationEnabled} aria-label="Toggle content monetization" disabled />
            </div>
            <p className="text-xs text-muted-foreground">Note: Full monetization features require backend integration. This is a UI placeholder.</p>
        </CardContent>
      </Card>
      
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
                        Receive important updates, news, and special offers from Charisarthub at {currentUser?.email}.
                    </span>
                </Label>
                <Switch id="emailNotifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} disabled={isSaving}/>
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

      <Card className="card-interactive-hover">
        <CardHeader><CardTitle className="text-xl">More Options</CardTitle></CardHeader>
        <CardContent className="space-y-2">
            <Button variant="ghost" className="w-full justify-start" disabled><Shield className="mr-2 h-5 w-5"/> Security & Privacy (Coming Soon)</Button>
            <Button variant="ghost" className="w-full justify-start" disabled><HelpCircle className="mr-2 h-5 w-5"/> Help & Support (Coming Soon)</Button>
            <Button variant="ghost" onClick={logoutUser} className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" disabled={isSaving}><LogOut className="mr-2 h-5 w-5"/> Log Out</Button>
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

    