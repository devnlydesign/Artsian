
"use client";

import React, { useState, useRef } from 'react';
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/context/AppStateContext';
import { createPost } from '@/actions/postActions'; 
import { Edit, Loader2, PlusCircle, UploadCloud, Image as ImageIconLucide } from 'lucide-react'; 
import NextImage from "next/image";
import { storage } from '@/lib/firebase';
import { ref as storageRefSdk, uploadBytes, getDownloadURL } from 'firebase/storage';

const postFormSchema = z.object({
  caption: z.string().min(1, "Caption cannot be empty unless an image is provided.").max(2000, "Caption is too long.").optional().or(z.literal('')),
  dataAiHintImage: z.string().max(50, "AI hint is too long (max 2 words recommended).").optional(),
});

type PostFormValues = z.infer<typeof postFormSchema>;

export default function NewPostPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoadingAuth } = useAppState();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [postImageFile, setPostImageFile] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const postFileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      caption: "",
      dataAiHintImage: "",
    },
  });

  const handlePostFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setPostImageFile(file);
        setPostImagePreview(URL.createObjectURL(file));
      } else {
        toast({ title: "Invalid File Type", description: "Please select an image file.", variant: "destructive" });
        setPostImageFile(null);
        setPostImagePreview(null);
        if(postFileInputRef.current) postFileInputRef.current.value = "";
      }
    }
  };

  const onSubmit: SubmitHandler<PostFormValues> = async (data) => {
    if (!currentUser?.uid) {
      toast({ title: "Authentication Error", description: "You must be logged in to create a post.", variant: "destructive" });
      return;
    }
    if (!data.caption?.trim() && !postImageFile) {
      toast({ title: "Empty Post", description: "Please write a caption or upload an image.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    let uploadedContentUrl: string | undefined = undefined;

    try {
      if (postImageFile) {
        const imageFilePath = `posts/${currentUser.uid}/images/${Date.now()}_${postImageFile.name}`;
        const imageFileRef = storageRefSdk(storage, imageFilePath);
        await uploadBytes(imageFileRef, postImageFile);
        uploadedContentUrl = await getDownloadURL(imageFileRef);
        toast({ title: "Image Uploaded", description: "Post image successfully uploaded." });
      }

      const authorDetails = {
        name: currentUser.displayName || currentUser.email?.split('@')[0] || "Charis User",
        avatarUrl: currentUser.photoURL,
        username: currentUser.email?.split('@')[0] || currentUser.uid.substring(0,8),
        dataAiHintAvatar: "user avatar",
      };
      
      const result = await createPost(currentUser.uid, {
        contentType: postImageFile ? 'image' : 'text',
        caption: data.caption?.trim() || null,
        contentUrl: uploadedContentUrl,
        dataAiHintImage: data.dataAiHintImage || (postImageFile ? "user uploaded post image" : undefined),
        isPublic: true, // Default to public
      }, authorDetails);

      if (result.success && result.postId) {
        toast({
          title: "Post Created!",
          description: `Your post has been created successfully.`,
        });
        router.push('/'); // Redirect to home feed
      } else {
        toast({
          title: "Error Creating Post",
          description: result.message || "Could not save your post. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting post:", error);
      toast({
        title: "Submission Error",
        description: "An unexpected error occurred during upload or save. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingAuth) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated) {
    router.push('/auth/login?redirect=/posts/new');
    return <div className="flex justify-center items-center min-h-screen"><p>Redirecting to login...</p></div>;
  }

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <Card className="shadow-lg card-interactive-hover">
        <CardHeader className="text-center">
          <Edit className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl text-gradient-primary-accent">Create New Post</CardTitle>
           <p className="text-xs text-muted-foreground mt-1">Created by Charisarthub</p>
          <CardDescription>Share your thoughts, updates, or media with the community.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="caption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caption</FormLabel>
                    <FormControl><Textarea placeholder="What's on your mind?" rows={5} {...field} disabled={isSubmitting}/></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormItem>
                <FormLabel>Image (Optional)</FormLabel>
                <Card 
                    className="border-2 border-dashed border-border hover:border-primary transition-colors p-6 cursor-pointer"
                    onClick={() => postFileInputRef.current?.click()}
                >
                  <CardContent className="flex flex-col items-center justify-center text-center">
                    {postImagePreview ? (
                        <div className="relative w-full h-48 mb-4 rounded-md overflow-hidden">
                           <NextImage src={postImagePreview} alt="Post Preview" layout="fill" objectFit="contain" />
                        </div>
                    ) : (
                        <UploadCloud className="h-12 w-12 text-muted-foreground mb-2" />
                    )}
                    <p className="text-sm text-muted-foreground">
                      {postImageFile ? `Selected: ${postImageFile.name}` : "Click or drag to upload an image"}
                    </p>
                    <Input 
                        id="postImageFile" 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        ref={postFileInputRef}
                        onChange={handlePostFileChange} 
                        disabled={isSubmitting}
                    />
                  </CardContent>
                </Card>
                <FormDescription>Add an image to your post.</FormDescription>
              </FormItem>

              {postImageFile && (
                <FormField
                    control={form.control}
                    name="dataAiHintImage"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>AI Hint for Image (Optional)</FormLabel>
                        <FormControl><Input placeholder="e.g., abstract art (max 2 words)" {...field} disabled={isSubmitting}/></FormControl>
                        <FormDescription>Keywords for the image, used for search/alt text.</FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              )}
              
              <Button type="submit" variant="gradientPrimary" disabled={isSubmitting} className="w-full text-lg py-3">
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5" />}
                {isSubmitting ? "Creating Post..." : "Create Post"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
