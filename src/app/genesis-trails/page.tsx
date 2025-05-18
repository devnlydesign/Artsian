"use client";

import { useState } from "react";
import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { GitFork, Loader2, PlusCircle, Trash2, FileText, Image as ImageIcon } from "lucide-react";
import { generateGenesisTrail, type GenesisTrailInput, type GenesisTrailOutput } from "@/ai/flows/genesis-trail-generation";

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
  const { toast } = useToast();

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

  const onSubmit: SubmitHandler<GenesisTrailFormValues> = async (data) => {
    setIsLoading(true);
    setGeneratedTrail(null);
    try {
      // Filter out empty mediaUrl strings before sending
      const processedData = {
        ...data,
        creationEvents: data.creationEvents.map(event => ({
          ...event,
          mediaUrl: event.mediaUrl === "" ? undefined : event.mediaUrl,
        })),
      };
      const result = await generateGenesisTrail(processedData as GenesisTrailInput); // Cast as AI flow expects optional to be potentially undefined
      setGeneratedTrail(result);
      toast({
        title: "Genesis Trail Generated!",
        description: "Your project's history is now visualized.",
      });
    } catch (error) {
      console.error("Error generating genesis trail:", error);
      toast({
        title: "Error",
        description: "Failed to generate trail. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to render timeline nodes recursively
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
    const childIds = new Set(allNodes.flatMap(node => node.children));
    return allNodes.filter(node => !childIds.has(node.id));
  };


  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <GitFork className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl">Genesis Trails</CardTitle>
          <CardDescription>Visualize the creation history of your projects as an interactive, branching timeline.</CardDescription>
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Creation Events</FormLabel>
                {fields.map((field, index) => (
                  <Card key={field.id} className="my-4 p-4 space-y-3 bg-background/50">
                    <FormField
                      control={form.control}
                      name={`creationEvents.${index}.timestamp`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Timestamp</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
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
                            <Textarea placeholder="Describe the event" {...field} rows={2} />
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
                            <Input type="url" placeholder="https://example.com/image.png" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Remove Event
                    </Button>
                  </Card>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ timestamp: new Date().toISOString().slice(0,16), description: "", mediaUrl: "" })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Event
                </Button>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Trail...</>
                ) : (
                  <><GitFork className="mr-2 h-4 w-4" /> Generate Genesis Trail</>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {generatedTrail && (
        <Card className="mt-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" /> Generated Genesis Trail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="text-xl font-semibold mb-2">Timeline Description</h3>
            <p className="mb-6 text-muted-foreground whitespace-pre-wrap">{generatedTrail.timelineDescription}</p>
            
            <h3 className="text-xl font-semibold mb-4">Project Evolution</h3>
            {generatedTrail.timelineNodes.length > 0 ? (
               <ul className="space-y-2">
                {getRootNodes(generatedTrail.timelineNodes).map(rootNode =>
                  renderTimelineNode(rootNode.id, generatedTrail.timelineNodes)
                )}
              </ul>
            ) : (
              <p>No timeline nodes were generated.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
