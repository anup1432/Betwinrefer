import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { WithdrawalsTable } from "@/components/withdrawals-table";
import { Withdrawal, User } from "@shared/schema";

export default function Withdrawals() {
  const { data: withdrawals = [], isLoading } = useQuery<(Withdrawal & { user?: User })[]>({
    queryKey: ['/api/withdrawals'],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading withdrawals...</div>
      </div>
    );
  }

  return (
    <>
      <Header 
        title="Withdrawals Management" 
        description="Review and process withdrawal requests" 
      />
      
      <div className="p-6">
        <WithdrawalsTable withdrawals={withdrawals} />
      </div>
    </>
  );
}
