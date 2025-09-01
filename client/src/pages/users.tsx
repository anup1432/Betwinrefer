import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { UsersTable } from "@/components/users-table";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Users() {
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const handleViewUser = (userId: string) => {
    toast({
      title: "User Details",
      description: `Viewing details for user: ${userId}`,
    });
  };

  const handleBlockUser = (userId: string) => {
    toast({
      title: "User Blocked",
      description: `User ${userId} has been blocked`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading users...</div>
      </div>
    );
  }

  return (
    <>
      <Header 
        title="Users Management" 
        description="View and manage all bot users" 
      />
      
      <div className="p-6">
        <UsersTable 
          users={users} 
          onViewUser={handleViewUser}
          onBlockUser={handleBlockUser}
        />
      </div>
    </>
  );
}
