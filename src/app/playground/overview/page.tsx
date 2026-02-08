"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import { Activity, Tv, Eye, FileCheck, Sparkles, RefreshCw, Smartphone, MapPin, LayoutGrid } from "lucide-react";
import Image from "next/image";

// Mock Data
const data = [
  { name: 'Mon', value: 4000 },
  { name: 'Tue', value: 3000 },
  { name: 'Wed', value: 2000 },
  { name: 'Thu', value: 2780 },
  { name: 'Fri', value: 1890 },
  { name: 'Sat', value: 2390 },
  { name: 'Sun', value: 3490 },
];

const recentLogs = [
  { id: 1, location: "Gangnam St. Screen A", time: "14:02", status: "Verified", vehicle: "Bus 140" },
  { id: 2, location: "Hongdae Exit 9", time: "13:45", status: "Verified", vehicle: "Taxi 3829" },
  { id: 3, location: "Yeouido Transfer Ctr", time: "13:30", status: "Pending", vehicle: "Subway Screen" },
  { id: 4, location: "Samsung COEX Mall", time: "13:15", status: "Verified", vehicle: "Digital Billboard" },
];

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-pink-400">
            AdMate Vision AI Analytics
          </h1>
          <p className="text-neutral-400 mt-1">Real-time OOH Advertising Performance Dashboard</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
          <Button className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
            <Sparkles className="mr-2 h-4 w-4" />
            Run AI Analysis
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Impressions" 
          value="1.2M" 
          change="+12.5%" 
          icon={<Eye className="h-5 w-5 text-blue-400" />}
          gradient="from-blue-500/10 to-blue-500/5"
        />
        <MetricCard 
          title="Covered Locations" 
          value="45" 
          change="+3 new sites" 
          icon={<MapPin className="h-5 w-5 text-violet-400" />}
          gradient="from-violet-500/10 to-violet-500/5"
        />
        <MetricCard 
          title="AI Detection Rate" 
          value="98.5%" 
          change="+0.2%" 
          icon={<Smartphone className="h-5 w-5 text-pink-400" />}
          gradient="from-pink-500/10 to-pink-500/5"
        />
        <MetricCard 
          title="Slot Occupancy" 
          value="85%" 
          change="15% Vacant" 
          icon={<LayoutGrid className="h-5 w-5 text-amber-400" />}
          gradient="from-amber-500/10 to-amber-500/5"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart Section (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Daily Ad Exposures</CardTitle>
              <CardDescription className="text-neutral-400">
                Number of verified ad displays over the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#888" 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#888" 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value}`} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', color: '#fff' }}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="url(#colorGradient)" 
                      radius={[4, 4, 0, 0]} 
                    />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* AI Insight Box */}
          <Card className="bg-gradient-to-br from-violet-900/20 to-pink-900/20 border-violet-500/30">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-400 animate-pulse" />
                <CardTitle className="text-lg text-violet-100">AI Daily Insight</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-neutral-300">
                <p>Based on today's data analysis:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-neutral-400 ml-1">
                  <li>Exposure efficiency is highest during <strong>14:00 - 16:00</strong>.</li>
                  <li><strong>Gangnam Screen A</strong> has 15% more potential viewers than average.</li>
                  <li>Anomaly detected: <strong>Hongdae Exit 9</strong> screen brightness seems low in captured images.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Sidebar (1/3 width) */}
        <div className="space-y-6">
          <Card className="bg-neutral-900 border-neutral-800 h-full">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-neutral-400" />
                Recent Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-neutral-800/50 transition-colors border border-transparent hover:border-neutral-800">
                  <div className={`mt-1 h-2 w-2 rounded-full ${log.status === 'Verified' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-yellow-500'}`} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-white">{log.location}</p>
                    <div className="flex justify-between items-center text-xs text-neutral-400">
                      <span>{log.vehicle}</span>
                      <span className="font-mono">{log.time}</span>
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="ghost" className="w-full text-xs text-neutral-500 hover:text-neutral-300">
                View All Activity
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, change, icon, gradient }: { title: string, value: string, change: string, icon: any, gradient: string }) {
  return (
    <Card className={`bg-neutral-900 border-neutral-800 overflow-hidden relative group`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
      <CardContent className="p-6 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-neutral-800 rounded-lg border border-neutral-700">
            {icon}
          </div>
          <Badge variant="secondary" className="bg-neutral-800 text-neutral-300 hover:bg-neutral-700">
            {change}
          </Badge>
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-neutral-400">{title}</h3>
          <div className="text-2xl font-bold text-white">{value}</div>
        </div>
      </CardContent>
    </Card>
  )
}
