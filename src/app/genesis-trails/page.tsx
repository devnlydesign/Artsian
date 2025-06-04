
"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { GitFork, Loader2, PlusCircle, Trash2, FileText, Image as ImageIcon, History, Brain } from "lucide-react";
import { generateGenesisTrail, type GenerateGenesisTrailWithUserInput, type GenesisTrailInput, type GenesisTrailOutput } from "@/ai/flows/genesis-trail-generation";
import { useAppState } from "@/context/AppStateContext"; 
import { getGenesisTrailsByUserId, type GenesisTrailStorageData } from "@/actions/genesisTrailActions"; 
import { ScrollArea } from "@/components/ui/scroll-area"; 
import { formatDistanceToNow } from 'date-fns'; 
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion" 


const creationEventSchema = z.object({
  timestamp: z.string().min(1, "Timestamp is required."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  mediaUrl: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
});

const formSchema = z.object({
  projectDescription: z.string().min(50, "Project description must be at least 50 characters."),
  creationEvents: z.array(creationEventSchema).min(1, "At least one creation event is required."),
});

type GenesisTrailFormValues = z.infer<typeof formSchema>;

export default function GenesisTrailsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedTrail, setGeneratedTrail] = useState<GenesisTrailOutput | null>(null);
  const [pastTrails, setPastTrails] = useState<GenesisTrailStorageData[]>([]); 
  const [isLoadingHistory, setIsLoadingHistory] = useState(true); 
  const { toast } = useToast();
  const { currentUser, isAuthenticated, isLoadingAuth } = useAppState(); 

  const form = useForm<GenesisTrailFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectDescription: "",
      creationEvents: [{ timestamp: new Date().toISOString().slice(0,16), description: "", mediaUrl: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "creationEvents",
  });

  useEffect(() => {
    async function fetchPastTrails() {
      if (isAuthenticated && currentUser?.uid) {
        setIsLoadingHistory(true);
        const trails = await getGenesisTrailsByUserId(currentUser.uid);
        setPastTrails(trails);
        setIsLoadingHistory(false);
      } else if (!isLoadingAuth && !isAuthenticated) {
        setPastTrails([]);
        setIsLoadingHistory(false);
      }
    }
    if (!isLoadingAuth) {
      fetchPastTrails();
    }
  }, [currentUser, isAuthenticated, isLoadingAuth]);

  const onSubmit: SubmitHandler<GenesisTrailFormValues> = async (data) => {
    if (!currentUser?.uid) {
      toast({ title: "Login Required", description: "Please log in to generate and save project stories.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setGeneratedTrail(null);
    try {
      const processedData: GenesisTrailInput = {
        projectDescription: data.projectDescription,
        creationEvents: data.creationEvents.map(event => ({
          ...event,
          mediaUrl: event.mediaUrl === "" ? undefined : event.mediaUrl,
        })),
      };
      const inputForFlow: GenerateGenesisTrailWithUserInput = {
        ...processedData,
        userId: currentUser.uid,
      };

      const result = await generateGenesisTrail(inputForFlow);
      setGeneratedTrail(result); 
      toast({
        title: "Project Story Generated!",
        description: "Your project's history is now visualized and saved.",
      });
      if (currentUser?.uid) {
        const trails = await getGenesisTrailsByUserId(currentUser.uid);
        setPastTrails(trails);
      }
    } catch (error) {
      console.error("Error generating genesis trail:", error);
      toast({
        title: "Error",
        description: "Failed to generate project story. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderTimelineNode = (nodeId: string, allNodes: GenesisTrailOutput['timelineNodes'], level = 0) => {
    const node = allNodes.find(n => n.id === nodeId);
    if (!node) return null;

    return (
      <li key={node.id} className={`ml-${level * 4} relative border-l-2 border-primary pl-6 py-3`}>
        <div className={`absolute -left-[0.30rem] top-4 h-2 w-2 rounded-full bg-primary`} />
        <p className="font-semibold text-sm text-muted-foreground">{new Date(node.timestamp).toLocaleString()}</p>
        <p className="text-md font-medium">{node.description}</p>
        {node.mediaUrl && (
          <a href={node.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline flex items-center gap-1 mt-1">
            <ImageIcon className="h-4 w-4" /> View Media
          </a>
        )}
        {node.children && node.children.length > 0 && (
          <ul className="mt-2">
            {node.children.map(childId => renderTimelineNode(childId, allNodes, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  const getRootNodes = (allNodes: GenesisTrailOutput['timelineNodes']) => {
    if (!allNodes) return [];
    const childIds = new Set(allNodes.flatMap(node => node.children || []));
    return allNodes.filter(node => !childIds.has(node.id));
  };


  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <Card className="shadow-lg card-interactive-hover">
        <CardHeader className="text-center">
          <GitFork className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl text-gradient-primary-accent">Create Project Story</CardTitle>
           <p className="text-xs text-muted-foreground mt-1">Created by Charis Mul</p>
          <CardDescription>Visualize the creation history of your projects. This will be saved to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="projectDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the project, its goals, and the creative process involved."
                        rows={4}
                        {...field}
                        disabled={isLoading || !isAuthenticated}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Creation Events</FormLabel>
                {fields.map((field, index) => (
                  <Card key={field.id} className="my-4 p-4 space-y-3 bg-muted/30">
                    <FormField
                      control={form.control}
                      name={`creationEvents.${index}.timestamp`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Timestamp</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} disabled={isLoading || !isAuthenticated}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`creationEvents.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describe the event" {...field} rows={2} disabled={isLoading || !isAuthenticated}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`creationEvents.${index}.mediaUrl`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Media URL (Optional)</FormLabel>
                          <FormControl>
                            <Input type="url" placeholder="https://example.com/image.png" {...field} disabled={isLoading || !isAuthenticated}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)} disabled={isLoading || !isAuthenticated}>
                      <Trash2 className="mr-2 h-4 w-4" /> Remove Event
                    </Button>
                  </Card>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ timestamp: new Date().toISOString().slice(0,16), description: "", mediaUrl: "" })}
                  disabled={isLoading || !isAuthenticated}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Event
                </Button>
              </div>

              <Button type="submit" variant="gradientPrimary" disabled={isLoading || !isAuthenticated || isLoadingAuth} className="w-full">
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Story...</>
                ) : (
                  <><GitFork className="mr-2 h-4 w-4" /> Generate Project Story</>
                )}
              </Button>
              {!isAuthenticated && !isLoadingAuth && <p className="text-sm text-destructive text-center">Please log in to generate and save project stories.</p>}
            </form>
          </Form>
        </CardContent>
      </Card>

      {generatedTrail && (
        <Card className="mt-8 shadow-lg bg-primary/10 border-primary">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2 text-primary-foreground">
              <FileText className="h-6 w-6 text-accent" /> Newly Generated Project Story
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="text-xl font-semibold mb-2 text-foreground">Timeline Description</h3>
            <p className="mb-6 text-muted-foreground whitespace-pre-wrap">{generatedTrail.timelineDescription}</p>
            
            <h3 className="text-xl font-semibold mb-4 text-foreground">Project Evolution</h3>
            {generatedTrail.timelineNodes?.length > 0 ? (
               <ul className="space-y-2">
                {getRootNodes(generatedTrail.timelineNodes).map(rootNode =>
                  renderTimelineNode(rootNode.id, generatedTrail.timelineNodes)
                )}
              </ul>
            ) : (
              <p className="text-muted-foreground">No timeline nodes were generated for this story.</p>
            )}
          </CardContent>
        </Card>
      )}

      {isAuthenticated && (
        <Card className="mt-8 card-interactive-hover">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <History className="h-7 w-7 text-primary" />
              Your Past Project Stories
            </CardTitle>
            <CardDescription>Review project stories you've previously generated.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading history...
              </div>
            ) : pastTrails.length > 0 ? (
              <ScrollArea className="h-[600px] pr-4">
                <Accordion type="single" collapsible className="w-full">
                  {pastTrails.map((trail) => (
                    <AccordionItem value={trail.id} key={trail.id}>
                      <AccordionTrigger>
                        <div className="flex flex-col text-left">
                            <span className="font-semibold text-md">{trail.projectTitle || "Untitled Project"}</span>
                            <span className="text-xs text-muted-foreground">
                            Generated {trail.createdAt ? formatDistanceToNow(trail.createdAt.toDate(), { addSuffix: true }) : 'some time ago'}
                            </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <Card className="bg-muted/50 p-4 shadow-sm">
                            <h4 className="text-lg font-semibold mb-1">Timeline Description</h4>
                            <p className="mb-4 text-sm text-muted-foreground whitespace-pre-wrap">{trail.output.timelineDescription}</p>
                            
                            <h4 className="text-lg font-semibold mb-2">Project Evolution</h4>
                             {trail.output.timelineNodes?.length > 0 ? (
                                <ul className="space-y-2">
                                    {getRootNodes(trail.output.timelineNodes).map(rootNode =>
                                    renderTimelineNode(rootNode.id, trail.output.timelineNodes)
                                    )}
                                </ul>
                                ) : (
                                <p className="text-sm text-muted-foreground">No timeline nodes available for this story.</p>
                                )}
                            <details className="text-xs mt-4">
                                <summary className="cursor-pointer text-muted-foreground hover:text-primary">View Original Input</summary>
                                <div className="mt-2 p-2 bg-background/70 rounded-md space-y-1 text-xs">
                                    <p><strong>Project Desc:</strong> {trail.input.projectDescription.substring(0,200)}...</p>
                                    <p><strong>Events:</strong> {trail.input.creationEvents.length} event(s)</p>
                                </div>
                            </details>
                        </Card>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </ScrollArea>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Brain className="mx-auto h-12 w-12 mb-3"/>
                <p>You haven't generated any project stories yet.</p>
                <p>Use the form above to create one!</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
