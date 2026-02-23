import PageContainer from "../components/container/PageContainer";
import SalesOverview from "../components/dashboard/SalesOverview";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import DailyEarnings from "../components/dashboard/DailyEarnings";
import PopularItems from "../components/dashboard/PopularItems";
import LowStockAlerts from "../components/dashboard/LowStockAlerts";
import MonthlyComparison from "../components/dashboard/MonthlyComparison";
import OrderStatusPanel from "../components/dashboard/OrderStatusPanel";
import WeeklyTrends from "../components/dashboard/WeeklyTrends";
import FinancialHealthPanel from "../components/dashboard/FinancialHealthPanel";
import RevenueByCategory from "../components/dashboard/RevenueByCategory";

const Dashboard = () => {
  return (
    <PageContainer title="Dashboard" description="This is the Dashboard">
      <div className="flex flex-col gap-6">
        {/* Row 1: Daily Earnings (wide) + Monthly Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <DailyEarnings />
          </div>
          <div>
            <MonthlyComparison />
          </div>
        </div>

        {/* Row 2: Sales Overview + Order Status (donut + attention merged) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SalesOverview />
          <OrderStatusPanel />
        </div>

        {/* Row 3: Weekly Trends + Financial Health (tabbed: margins / expenses / inventory) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <WeeklyTrends />
          <FinancialHealthPanel />
        </div>

        {/* Row 4: Revenue by Category + Low Stock side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RevenueByCategory />
          <LowStockAlerts />
        </div>

        {/* Row 5: Trending Products — full width, horizontal scroll */}
        <div>
          <PopularItems />
        </div>

        {/* Row 6: Recent Orders — full width */}
        <div>
          <RecentTransactions />
        </div>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
