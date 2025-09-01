import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Eye, Ban } from "lucide-react";
import { User } from "@shared/schema";

interface UsersTableProps {
  users: User[];
  onViewUser?: (userId: string) => void;
  onBlockUser?: (userId: string) => void;
}

export function UsersTable({ users, onViewUser, onBlockUser }: UsersTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.telegramId.includes(searchTerm)
  );

  const getStatusBadge = (user: User) => {
    if (user.isBlocked) {
      return <Badge variant="destructive">Blocked</Badge>;
    }
    if (user.totalReferrals >= 10) {
      return <Badge className="bg-yellow-100 text-yellow-800">Code Generated</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Active</Badge>;
  };

  const getUserInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName) {
      return user.firstName.slice(0, 2).toUpperCase();
    }
    if (user.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-card-foreground">Recent Users</CardTitle>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10"
                data-testid="input-search-users"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            <Button className="text-sm" data-testid="button-add-user">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Join Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Referrals
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-muted/50 transition-colors"
                    data-testid={`user-row-${user.id}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-primary-foreground text-xs font-medium">
                            {getUserInitials(user)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-card-foreground" data-testid={`user-name-${user.id}`}>
                            @{user.username || user.firstName || 'unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground" data-testid={`user-id-${user.id}`}>
                            ID: {user.telegramId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground" data-testid={`user-join-date-${user.id}`}>
                      {new Date(user.joinedAt).toDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" data-testid={`user-referrals-${user.id}`}>
                      <span className="text-sm font-medium text-card-foreground">{user.totalReferrals}</span>
                      <span className="text-xs text-muted-foreground">/10</span>
                      {user.totalReferrals >= 10 && (
                        <span className="ml-2 text-green-500">✓</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-card-foreground" data-testid={`user-balance-${user.id}`}>
                      ${parseFloat(user.balance).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" data-testid={`user-status-${user.id}`}>
                      {getStatusBadge(user)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onViewUser?.(user.id)}
                        className="text-primary hover:text-primary/80"
                        data-testid={`button-view-user-${user.id}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onBlockUser?.(user.id)}
                        className="text-muted-foreground hover:text-foreground"
                        data-testid={`button-block-user-${user.id}`}
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Block
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
