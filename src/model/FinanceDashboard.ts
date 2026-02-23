export interface FinanceDashboardData {
  cards: {
    totalBankBalance: number;
    totalPayable: number;
    monthlyExpenses: number;
    monthlyIncome: number;
  };
  expenseBreakdown: { category: string; amount: number; color: string }[];
  recentTransactions: any[];
  cashFlow: { date: string; income: number; expense: number }[];
}
