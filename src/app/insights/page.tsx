import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChartBig, Zap, Users, TrendingUp, Percent } from "lucide-react";
import Image from "next/image";
import { ChartTooltip, ChartTooltipContent, ChartContainer, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const attentionData = [
  { source: 'Crystalline Blooms', attention: 45, fill: 'hsl(var(--chart-1))' },
  { source: 'Flux Signature Profile', attention: 30, fill: 'hsl(var(--chart-2))' },
  { source: 'Biome Posts', attention: 15, fill: 'hsl(var(--chart-3))' },
  { source: 'Shop Links', attention: 10, fill: 'hsl(var(--chart-4))' },
];

const growthData = [
  { month: 'Jan', growth: 10 },
  { month: 'Feb', growth: 15 },
  { month: 'Mar', growth: 12 },
  { month: 'Apr', growth: 20 },
  { month: 'May', growth: 25 },
  { month: 'Jun', growth: 30 },
];

const chartConfig = {
  attention: {
    label: "Attention",
  },
  growth: {
    label: "Growth Velocity",
    color: "hsl(var(--primary))",
  }
} satisfies import("@/components/ui/chart").ChartConfig;


export default function InsightsPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <BarChartBig className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl">Energy Flow Patterns</CardTitle>
          <CardDescription>Analyze attention pooling and network growth velocity around your Flux Signature and Private Biomes.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-accent" /> Attention Pooling</CardTitle>
            <CardDescription>Where your audience's attention is currently focused.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie data={attentionData} dataKey="attention" nameKey="source" cx="50%" cy="50%" outerRadius={100} label>
                     {attentionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-accent" /> Network Growth Velocity</CardTitle>
            <CardDescription>How quickly your connected network is expanding.</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={growthData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
                <Bar dataKey="growth" fill="var(--color-growth)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Key Metrics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center text-sm text-muted-foreground"><Users className="h-4 w-4 mr-1" /> Followers</div>
                <div className="text-2xl font-bold">1,234</div>
                <div className="text-xs text-green-500 flex items-center"><TrendingUp className="h-3 w-3 mr-0.5" /> +5% last month</div>
            </div>
             <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center text-sm text-muted-foreground"><Percent className="h-4 w-4 mr-1" /> Engagement Rate</div>
                <div className="text-2xl font-bold">7.8%</div>
                <div className="text-xs text-green-500 flex items-center"><TrendingUp className="h-3 w-3 mr-0.5" /> +0.5% last week</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center text-sm text-muted-foreground"><Zap className="h-4 w-4 mr-1" /> Bloom Views</div>
                <div className="text-2xl font-bold">10.5K</div>
                <div className="text-xs text-muted-foreground">Past 30 days</div>
            </div>
             <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4 mr-1" /> Biome Members</div>
                <div className="text-2xl font-bold">88</div>
                <div className="text-xs text-green-500 flex items-center"><TrendingUp className="h-3 w-3 mr-0.5" /> +12 this month</div>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Energy Flow Visualization</CardTitle>
          <CardDescription>An interactive map showing connections and energy intensity.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Image src="https://placehold.co/800x450.png" alt="Energy Flow Visualization Placeholder" width={800} height={450} className="rounded-md object-cover mx-auto" data-ai-hint="network graph" />
          <p className="mt-2 text-sm text-muted-foreground">This area will feature a dynamic, interactive graph visualizing the energy flow patterns.</p>
        </CardContent>
      </Card>
    </div>
  );
}
