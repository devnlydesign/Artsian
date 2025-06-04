
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/context/AppStateContext';
import { createShopItem, getArtistShopItems, updateShopItem, deleteShopItem, type ShopItemData } from '@/actions/shopActions'; 
import { Store, Loader2, PlusCircle, Edit3, Trash2, Image as ImageIcon, UploadCloud } from 'lucide-react'; 
import NextImage from "next/image";
import { storage } from '@/lib/firebase';
import { ref as storageRefSdk, uploadBytes, getDownloadURL, deleteObject as deleteStorageObject } from 'firebase/storage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import Link from 'next/link';

const shopItemFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters.").max(100),
  description: z.string().min(10, "Description must be at least 10 characters.").max(1000),
  priceInCents: z.coerce.number().min(50, "Price must be at least $0.50 (50 cents).").int(),
  category: z.string().optional(),
  crystallineBloomId: z.string().optional().nullable(),
  stock: z.coerce.number().min(0).int().optional().nullable(),
  isDigital: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  dataAiHint: z.string().max(50).optional(),
});

type ShopItemFormValues = z.infer<typeof shopItemFormSchema>;

export default function ManageShopPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoadingAuth } = useAppState();
  
  const [artistItems, setArtistItems] = useState<ShopItemData[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<ShopItemData | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [itemImageFile, setItemImageFile] = useState<File | null>(null);
  const [itemImagePreview, setItemImagePreview] = useState<string | null>(null);
  const itemFileInputRef = useRef<HTMLInputElement>(null);

  const fetchArtistItems = async () => {
    if (currentUser?.uid) {
      setIsLoadingItems(true);
      const items = await getArtistShopItems(currentUser.uid);
      setArtistItems(items);
      setIsLoadingItems(false);
    }
  };

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated && currentUser?.uid) {
      fetchArtistItems();
    } else if (!isLoadingAuth && !isAuthenticated) {
      router.push('/auth/login?redirect=/my-shop/manage');
    }
  }, [currentUser, isAuthenticated, isLoadingAuth, router]);

  const resetFormAndImage = () => {
    form.reset();
    setItemImageFile(null);
    setItemImagePreview(null);
    setEditingItem(null);
    if (itemFileInputRef.current) {
      itemFileInputRef.current.value = "";
    }
  };

  const handleItemFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setItemImageFile(file);
      setItemImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit: SubmitHandler<ShopItemFormValues> = async (data) => {
    if (!currentUser?.uid) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    if (!editingItem && !itemImageFile) { 
      toast({ title: "Image Required", description: "Please select an image for your shop item.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    let uploadedOriginalImageUrl = editingItem?.imageUrlOriginal || editingItem?.imageUrl || ""; // Fallback to imageUrl if original is not set
    let displayImageUrl = editingItem?.imageUrl || "";


    try {
      if (itemImageFile) {
        // Delete old original image if it exists and a new file is being uploaded
        if (editingItem?.imageUrlOriginal && editingItem.imageUrlOriginal.includes('firebasestorage.googleapis.com')) {
            try {
                const oldImageRef = storageRefSdk(storage, editingItem.imageUrlOriginal);
                await deleteStorageObject(oldImageRef);
            } catch (e: any) {
                if (e.code !== 'storage/object-not-found') console.warn("Old original image deletion failed:", e);
            }
        }
        // Also attempt to delete old display image if it's different from original and might be a thumbnail
        if (editingItem?.imageUrl && editingItem.imageUrl !== editingItem?.imageUrlOriginal && editingItem.imageUrl.includes('firebasestorage.googleapis.com')) {
            try {
                const oldDisplayImageRef = storageRefSdk(storage, editingItem.imageUrl);
                await deleteStorageObject(oldDisplayImageRef);
            } catch (e: any) {
                 if (e.code !== 'storage/object-not-found') console.warn("Old display image deletion failed:", e);
            }
        }

        const itemFilePath = `shopItems/${currentUser.uid}/original_${Date.now()}_${itemImageFile.name}`;
        const itemFileRef = storageRefSdk(storage, itemFilePath);
        await uploadBytes(itemFileRef, itemImageFile);
        uploadedOriginalImageUrl = await getDownloadURL(itemFileRef);
        displayImageUrl = uploadedOriginalImageUrl; // For now, display URL is the original. Thumbnails would be handled by extension.
      }
      
      if (!displayImageUrl && !uploadedOriginalImageUrl) { // Check if any image URL is present
         toast({ title: "Image Error", description: "Image URL is missing. Please ensure an image is uploaded or was previously set.", variant: "destructive" });
         setIsSubmitting(false);
         return;
      }

      const itemDetailsToSave = {
        ...data,
        imageUrl: displayImageUrl, // This is the primary URL used for display
        imageUrlOriginal: uploadedOriginalImageUrl, // Storing the original image URL
        dataAiHint: data.dataAiHint || data.name.toLowerCase().split(" ").slice(0,2).join(" ") || "shop item",
      };

      let result;
      if (editingItem) {
        result = await updateShopItem(currentUser.uid, editingItem.id, itemDetailsToSave);
        toast({ title: result.success ? "Item Updated!" : "Update Failed", description: result.message || (result.success ? `'${data.name}' has been updated.` : "Could not update item."), variant: result.success ? "default" : "destructive"});
      } else {
        result = await createShopItem(currentUser.uid, itemDetailsToSave);
        toast({ title: result.success ? "Item Created!" : "Creation Failed", description: result.message || (result.success ? `'${data.name}' added to your shop.` : "Could not create item."), variant: result.success ? "default" : "destructive" });
      }

      if (result.success) {
        resetFormAndImage();
        setIsCreateModalOpen(false);
        fetchArtistItems();
      }
    } catch (error) {
      console.error("Error submitting shop item:", error);
      toast({ title: "Submission Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: ShopItemData) => {
    setEditingItem(item);
    form.reset({
      name: item.name,
      description: item.description,
      priceInCents: item.priceInCents,
      category: item.category || "",
      crystallineBloomId: item.crystallineBloomId || null,
      stock: item.stock ?? null,
      isDigital: item.isDigital || false,
      isPublished: item.isPublished === undefined ? true : item.isPublished,
      dataAiHint: item.dataAiHint || "",
    });
    setItemImagePreview(item.imageUrl); // Display the current primary image (could be a thumbnail)
    setItemImageFile(null);
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (item: ShopItemData) => {
    if (!currentUser?.uid) return;
    const confirmed = window.confirm("Are you sure you want to delete this item? This action cannot be undone.");
    if (confirmed) {
      setIsLoadingItems(true); 
      const result = await deleteShopItem(currentUser.uid, item.id);
      if (result.success) {
        toast({ title: "Item Deleted", description: "The item has been removed from your shop." });
        fetchArtistItems(); // Refreshes list, isLoadingItems will be set to false by it
      } else {
        toast({ title: "Deletion Failed", description: result.message || "Could not delete item.", variant: "destructive" });
        setIsLoadingItems(false);
      }
    }
  };
  
  const ShopItemFormContent = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Name</FormLabel>
              <FormControl><Input placeholder="e.g., Nebula Dreams Print" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
            <FormLabel>Item Image</FormLabel>
            <Card 
                className="border-2 border-dashed border-border hover:border-primary transition-colors p-4 cursor-pointer"
                onClick={() => itemFileInputRef.current?.click()}
            >
              <CardContent className="flex flex-col items-center justify-center text-center text-sm">
                {itemImagePreview ? (
                    <div className="relative w-full h-32 mb-2 rounded-md overflow-hidden">
                        <NextImage src={itemImagePreview} alt="Item Preview" layout="fill" objectFit="contain" />
                    </div>
                ) : ( <UploadCloud className="h-10 w-10 text-muted-foreground mb-1" /> )}
                <p className="text-muted-foreground">
                  {itemImageFile ? `Selected: ${itemImageFile.name.substring(0,30)}...` : (editingItem ? "Click to change image" : "Click or drag to upload image")}
                </p>
                <Input id="itemImageFile" type="file" className="hidden" accept="image/*" ref={itemFileInputRef} onChange={handleItemFileChange} />
              </CardContent>
            </Card>
            {!editingItem && !itemImageFile && form.formState.isSubmitted && <p className="text-sm font-medium text-destructive">Item image is required for new items.</p>}
        </FormItem>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl><Textarea placeholder="Detailed description of your item" {...field} rows={3} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="priceInCents"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price (in Cents)</FormLabel>
              <FormControl><Input type="number" placeholder="e.g., 2500 for $25.00" {...field} /></FormControl>
              <FormDescription>Enter price in cents (e.g., 1000 for $10.00).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category (Optional)</FormLabel>
              <FormControl><Input placeholder="e.g., Prints, Digital, Merchandise" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="crystallineBloomId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Related Crystalline Bloom ID (Optional)</FormLabel>
              <FormControl><Input placeholder="ID of an artwork this relates to" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : e.target.value)} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="stock"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stock Quantity (Optional)</FormLabel>
              <FormControl><Input type="number" placeholder="Leave blank for unlimited/digital" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value,10))} /></FormControl>
              <FormDescription>For physical items. Leave empty if digital or unlimited stock.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="dataAiHint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>AI Hint for Image (Optional)</FormLabel>
              <FormControl><Input placeholder="e.g., abstract print modern (max 2 words)" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center space-x-2">
            <FormField
                control={form.control}
                name="isDigital"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="font-normal">This is a digital item</FormLabel>
                    </FormItem>
                )}
            />
        </div>
         <div className="flex items-center space-x-2">
            <FormField
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="font-normal">Publish this item (visible in shop)</FormLabel>
                    </FormItem>
                )}
            />
        </div>
        <DialogFooter className="pt-4">
          <DialogClose asChild><Button type="button" variant="outline" onClick={resetFormAndImage}>Cancel</Button></DialogClose>
          <Button type="submit" variant="gradientPrimary" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {editingItem ? "Save Changes" : "Create Item"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );


  if (isLoadingAuth || (!isAuthenticated && !isLoadingAuth)) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">{isLoadingAuth ? "Loading authentication..." : "Redirecting to login..."}</p>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg card-interactive-hover">
        <CardHeader className="sm:flex sm:flex-row sm:items-center sm:justify-between">
          <div className="text-center sm:text-left">
            <Store className="mx-auto sm:mx-0 h-12 w-12 text-primary mb-2" />
            <CardTitle className="text-3xl text-gradient-primary-accent">Manage My Shop</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Created by Charis</p>
            <CardDescription>Add, edit, or remove items available in your personal Charisarthub shop.</CardDescription>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={(isOpen) => { setIsCreateModalOpen(isOpen); if (!isOpen) resetFormAndImage(); }}>
            <DialogTrigger asChild>
              <Button variant="gradientPrimary" className="mt-4 sm:mt-0 transition-transform hover:scale-105">
                <PlusCircle className="mr-2 h-5 w-5" /> Add New Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Shop Item" : "Create New Shop Item"}</DialogTitle>
                <DialogDescription>
                  {editingItem ? "Update the details of your shop item." : "Fill in the details for your new shop item."}
                </DialogDescription>
              </DialogHeader>
              <ShopItemFormContent />
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      {isLoadingItems ? (
        <div className="text-center py-10"><Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" /><p>Loading your items...</p></div>
      ) : artistItems.length === 0 ? (
        <Card className="text-center card-interactive-hover">
          <CardContent className="pt-8">
            <Store className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">Your shop is empty!</h3>
            <p className="text-muted-foreground mt-2">Click "Add New Item" to start selling your creations.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artistItems.map((item) => (
            <Card key={item.id} className="card-interactive-hover flex flex-col group">
              <CardHeader className="p-0">
                <div className="relative aspect-video rounded-t-lg overflow-hidden">
                  <NextImage src={item.imageUrl || "https://placehold.co/400x225.png"} alt={item.name} layout="fill" objectFit="cover" data-ai-hint={item.dataAiHint || "shop item image"} />
                  <Badge variant={item.isPublished ? "secondary" : "outline"} className="absolute top-2 left-2">{item.isPublished ? "Published" : "Draft"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-1">
                <CardTitle className="text-lg mb-1 group-hover:text-primary">{item.name}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-1">{item.description}</p>
                <p className="font-semibold text-primary">${(item.priceInCents / 100).toFixed(2)}</p>
                {item.category && <p className="text-xs text-muted-foreground">Category: {item.category}</p>}
                {item.stock !== null && <p className="text-xs text-muted-foreground">{item.isDigital ? "Digital Item" : `Stock: ${item.stock}`}</p>}
              </CardContent>
              <CardFooter className="p-3 border-t flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(item)} className="flex-1 transition-colors hover:border-primary">
                  <Edit3 className="mr-1.5 h-4 w-4" /> Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(item)} className="flex-1 transition-colors hover:border-destructive hover:text-destructive">
                  <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
       <div className="text-center mt-8">
            <Button variant="link" asChild>
                <Link href="/shop">View Public Shop Page</Link>
            </Button>
        </div>
    </div>
  );
}

    