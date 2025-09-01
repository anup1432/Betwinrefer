import { Users, Share, DollarSign, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsGridProps {
  stats: {
    totalUsers: number;
    totalReferrals: number;
    totalEarnings: string;
    pendingWithdrawals: number;
  };
}

export function StatsGrid({ stats }: StatsGridProps) {
  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
      change: "+12.5%",
      changeType: "positive"
    },
    {
      title: "Total Referrals",
      value: stats.totalReferrals.toLocaleString(),
      icon: Share,
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
      change: "+8.2%",
      changeType: "positive"
    },
    {
      title: "Total Earnings",
      value: `$${parseFloat(stats.totalEarnings).toFixed(2)}`,
      icon: DollarSign,
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-100",
      change: "+15.3%",
      changeType: "positive"
    },
    {
      title: "Pending Withdrawals",
      value: stats.pendingWithdrawals.toString(),
      icon: Clock,
      iconColor: "text-red-600",
      bgColor: "bg-red-100",
      change: "+3",
      changeType: "neutral"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="shadow-sm" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-bold text-card-foreground" data-testid={`value-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`${stat.iconColor} text-xl`} />
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-2">
              <span className={`text-xs font-medium ${
                stat.changeType === 'positive' ? 'text-green-600' : 
                stat.changeType === 'negative' ? 'text-red-600' : 'text-muted-foreground'
              }`}>
                {stat.change}
              </span>
              <span className="text-xs text-muted-foreground">from last week</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
