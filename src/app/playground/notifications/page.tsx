"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  X, 
  Settings, 
  Mail, 
  MessageSquare,
  Clock,
  Trash2
} from "lucide-react";

// Mock Notifications Data
const initialNotifications = [
  {
    id: 1,
    type: "success",
    title: "Report Generated Successfully",
    message: "Weekly report for 'Nike Campaign' has been sent to client.",
    time: "2 mins ago",
    read: false,
    icon: CheckCircle2,
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
  },
  {
    id: 2,
    type: "warning",
    title: "Low Confidence Detection",
    message: "Screen at 'Hongdae Exit 9' flagged for manual review (82% confidence).",
    time: "45 mins ago",
    read: false,
    icon: AlertTriangle,
    color: "text-amber-400 bg-amber-400/10 border-amber-400/20"
  },
  {
    id: 3,
    type: "info",
    title: "System Update",
    message: "New AI model v2.1 deployed. Expect improved night-time recognition.",
    time: "2 hours ago",
    read: true,
    icon: Info,
    color: "text-blue-400 bg-blue-400/10 border-blue-400/20"
  },
  {
    id: 4,
    type: "message",
    title: "New Comment on Dashboard",
    message: "Manager Kim: 'Please check the Gangnam screen brightness.'",
    time: "Yesterday",
    read: true,
    icon: MessageSquare,
    color: "text-violet-400 bg-violet-400/10 border-violet-400/20"
  },
  {
    id: 5,
    type: "warning",
    title: "Slot Vacancy Alert",
    message: "Gangnam Station Screen 3 contract expires tomorrow.",
    time: "Yesterday",
    read: true,
    icon: AlertTriangle,
    color: "text-amber-400 bg-amber-400/10 border-amber-400/20"
  },
];

export default function NotificationCenterPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState("all"); // all, unread

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filteredNotifications = filter === "unread" 
    ? notifications.filter(n => !n.read) 
    : notifications;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8 flex justify-center items-start">
      
      {/* Notification Center Container */}
      <Card className="w-full max-w-2xl bg-neutral-900 border-neutral-800 shadow-2xl">
        <CardHeader className="border-b border-neutral-800 pb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="h-6 w-6 text-violet-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-pink-500 rounded-full animate-pulse ring-2 ring-neutral-900" />
                )}
              </div>
              <div>
                <CardTitle className="text-xl text-white">Notification Center</CardTitle>
                <CardDescription className="text-neutral-400">
                  You have {unreadCount} unread notifications
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-neutral-400 hover:text-white hover:bg-neutral-800"
                disabled={unreadCount === 0}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark all read
              </Button>
              <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white hover:bg-neutral-800">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-4">
            <Badge 
              variant={filter === "all" ? "default" : "outline"}
              className={`cursor-pointer px-3 py-1 ${filter === "all" ? "bg-violet-600 hover:bg-violet-700" : "text-neutral-400 border-neutral-700 hover:bg-neutral-800"}`}
              onClick={() => setFilter("all")}
            >
              All
            </Badge>
            <Badge 
              variant={filter === "unread" ? "default" : "outline"}
              className={`cursor-pointer px-3 py-1 ${filter === "unread" ? "bg-violet-600 hover:bg-violet-700" : "text-neutral-400 border-neutral-700 hover:bg-neutral-800"}`}
              onClick={() => setFilter("unread")}
            >
              Unread Only
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="h-[600px] w-full p-4">
            <div className="space-y-3">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-neutral-500">
                  <Bell className="h-10 w-10 mb-2 opacity-20" />
                  <p>No notifications found</p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`group relative flex gap-4 p-4 rounded-xl border transition-all duration-200 ${
                      notification.read 
                        ? "bg-neutral-900/50 border-neutral-800/50 opacity-70 hover:opacity-100 hover:bg-neutral-800" 
                        : "bg-neutral-800/40 border-neutral-700 hover:bg-neutral-800"
                    }`}
                  >
                    {/* Icon Box */}
                    <div className={`mt-1 h-10 w-10 rounded-full flex items-center justify-center shrink-0 border ${notification.color}`}>
                      <notification.icon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className={`text-sm font-semibold ${notification.read ? "text-neutral-300" : "text-white"}`}>
                          {notification.title}
                        </h4>
                        <span className="text-xs text-neutral-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {notification.time}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-400 leading-relaxed">
                        {notification.message}
                      </p>
                      
                      {/* Action Buttons (Visible on hover) */}
                      <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.read && (
                          <button 
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-violet-400 hover:text-violet-300 font-medium"
                          >
                            Mark as read
                          </button>
                        )}
                        <button 
                          onClick={() => deleteNotification(notification.id)}
                          className="text-xs text-neutral-500 hover:text-red-400 flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Dismiss
                        </button>
                      </div>
                    </div>

                    {/* Unread Indicator Dot */}
                    {!notification.read && (
                      <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
