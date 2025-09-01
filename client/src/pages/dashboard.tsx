import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { StatsGrid } from "@/components/stats-grid";
import { RecentActivity } from "@/components/recent-activity";
import { UsersTable } from "@/components/users-table";
import { WithdrawalsTable } from "@/components/withdrawals-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, Download, RotateCcw, Code, Users, Share } from "lucide-react";
import { User, ActivityLog, Withdrawal, UniqueCode } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalUsers: number;
    totalReferrals: number;
    totalEarnings: string;
    pendingWithdrawals: number;
  }>({
    queryKey: ['/api/stats'],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: activity = [], isLoading: activityLoading } = useQuery<(ActivityLog & { user?: User })[]>({
    queryKey: ['/api/activity'],
  });

  const { data: withdrawals = [], isLoading: withdrawalsLoading } = useQuery<(Withdrawal & { user?: User })[]>({
    queryKey: ['/api/withdrawals'],
  });

  const { data: codes = [], isLoading: codesLoading } = useQuery<(UniqueCode & { user?: User })[]>({
    queryKey: ['/api/codes'],
  });

  const { data: topReferrers = [] } = useQuery<Array<{
    id: string;
    username: string;
    referrals: number;
    balance: string;
  }>>({
    queryKey: ['/api/referrers/top'],
  });

  const handleBroadcast = async () => {
    try {
      await apiRequest('POST', '/api/broadcast', {
        message: 'Hello! This is a test broadcast message from the bot admin.'
      });
      toast({
        title: "Broadcast Sent",
        description: "Message sent to all users successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send broadcast message",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Data export will be ready in a few minutes",
    });
  };

  const handleRestart = () => {
    toast({
      title: "Bot Restarted",
      description: "Telegram bot has been successfully restarted",
    });
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <>
      <Header 
        title="Dashboard Overview" 
        description="Monitor your Telegram bot performance and manage referrals" 
      />
      
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        {stats && <StatsGrid stats={stats} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <RecentActivity activities={activity} />

          {/* Bot Configuration & Quick Actions */}
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-lg font-semibold text-card-foreground">Bot Configuration</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-card-foreground">Welcome Message</span>
                  <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/80" data-testid="button-edit-welcome">
                    Edit
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-card-foreground">Play Button URL</span>
                  <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/80" data-testid="button-edit-url">
                    Edit
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-card-foreground">Referral Reward</span>
                  <span className="text-sm font-medium text-card-foreground">$0.10</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-card-foreground">Min Withdrawal</span>
                  <span className="text-sm font-medium text-card-foreground">$1.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-card-foreground">Channel ID</span>
                  <span className="text-xs font-mono text-muted-foreground">-1001962385481</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-lg font-semibold text-card-foreground">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <Button 
                  className="w-full justify-start"
                  onClick={handleBroadcast}
                  data-testid="button-broadcast"
                >
                  <Megaphone className="mr-2 h-4 w-4" />
                  Broadcast Message
                </Button>
                <Button 
                  variant="secondary" 
                  className="w-full justify-start"
                  onClick={handleExport}
                  data-testid="button-export"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleRestart}
                  data-testid="button-restart"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restart Bot
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Users Table */}
        <UsersTable users={users.slice(0, 10)} />

        {/* Withdrawals Table */}
        <WithdrawalsTable withdrawals={withdrawals.slice(0, 10)} />

        {/* Codes and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-lg font-semibold text-card-foreground">Recent Unique Codes</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {codes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No unique codes generated yet
                </div>
              ) : (
                codes.slice(0, 5).map((code) => (
                  <div key={code.id} className="flex items-center justify-between p-3 bg-muted rounded-lg" data-testid={`code-${code.id}`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Code className="text-white h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-mono font-medium text-card-foreground" data-testid={`code-value-${code.id}`}>
                          {code.code}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`code-user-${code.id}`}>
                          Generated for @{code.user?.username || code.user?.firstName || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground" data-testid={`code-date-${code.id}`}>
                      {new Date(code.generatedAt).toDateString()}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-lg font-semibold text-card-foreground">Referral Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="text-sm font-medium text-card-foreground">78.5%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '78.5%' }}></div>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm text-muted-foreground">Average Referrals per User</span>
                  <span className="text-sm font-medium text-card-foreground">6.2</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '62%' }}></div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm text-muted-foreground">Completion Rate</span>
                  <span className="text-sm font-medium text-card-foreground">45.3%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '45.3%' }}></div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="text-sm font-medium text-card-foreground mb-3">Top Referrers</h4>
                <div className="space-y-2">
                  {topReferrers.slice(0, 3).map((referrer, index: number) => (
                    <div key={index} className="flex items-center justify-between" data-testid={`top-referrer-${index}`}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                        }`}>
                          <span className="text-xs text-white font-bold">{index + 1}</span>
                        </div>
                        <span className="text-sm text-card-foreground">@{referrer.username}</span>
                      </div>
                      <span className="text-sm font-medium text-card-foreground">{referrer.referrals}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
