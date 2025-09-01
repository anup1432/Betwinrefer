import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Share, DollarSign, Code } from "lucide-react";
import { ActivityLog, User } from "@shared/schema";

interface RecentActivityProps {
  activities: (ActivityLog & { user?: User })[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new_user':
        return { icon: UserPlus, color: 'text-green-600', bg: 'bg-green-100' };
      case 'referral_complete':
        return { icon: Share, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'withdrawal_request':
        return { icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-100' };
      case 'code_generated':
        return { icon: Code, color: 'text-orange-600', bg: 'bg-orange-100' };
      default:
        return { icon: UserPlus, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const getActivityText = (activity: ActivityLog & { user?: User }) => {
    const username = activity.user?.username || activity.user?.firstName || 'Unknown User';
    
    switch (activity.type) {
      case 'new_user':
        return {
          title: 'New user joined',
          description: `@${username} started the bot and earned $1`
        };
      case 'referral_complete':
        const data = activity.data as any;
        return {
          title: 'Referral completed',
          description: `@${username} completed a referral and earned $${data?.reward || '0.10'}`
        };
      case 'withdrawal_request':
        const withdrawalData = activity.data as any;
        return {
          title: 'Withdrawal request',
          description: `@${username} requested withdrawal of $${withdrawalData?.amount || '0.00'}`
        };
      case 'code_generated':
        return {
          title: 'Unique code generated',
          description: `@${username} completed 10 referrals and received unique code`
        };
      default:
        return {
          title: 'Activity',
          description: `@${username} performed an action`
        };
    }
  };

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const dateObj = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <Card className="lg:col-span-2 shadow-sm">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-card-foreground">Recent Activity</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 font-medium" data-testid="button-view-all-activity">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No recent activity found
          </div>
        ) : (
          activities.slice(0, 10).map((activity) => {
            const { icon: Icon, color, bg } = getActivityIcon(activity.type);
            const { title, description } = getActivityText(activity);
            
            return (
              <div 
                key={activity.id} 
                className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted transition-colors"
                data-testid={`activity-${activity.type}-${activity.id}`}
              >
                <div className={`w-10 h-10 ${bg} rounded-full flex items-center justify-center`}>
                  <Icon className={`${color} h-5 w-5`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-card-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(activity.createdAt)}
                </span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
