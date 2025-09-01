import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  Users, 
  Share, 
  DollarSign, 
  Code, 
  Settings, 
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Users", href: "/users", icon: Users },
  { name: "Referrals", href: "/referrals", icon: Share },
  { name: "Withdrawals", href: "/withdrawals", icon: DollarSign },
  { name: "Unique Codes", href: "/codes", icon: Code },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Bot Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border shadow-sm">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <MessageSquare className="text-primary-foreground text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-card-foreground">Bot Manager</h1>
            <p className="text-sm text-muted-foreground">@captain_0_0_0</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </a>
            </Link>
          );
        })}
      </nav>
      
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-muted-foreground">Bot Status: Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
