import { PopularItem } from "@/model/PopularItem";
import { useEffect, useState, useRef } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getPopularItemsAction } from "@/actions/inventoryActions";
import DashboardCard from "@/pages/components/shared/DashboardCard";
import PopularItemCard from "@/pages/components/dashboard/PopularItemCard";
import {
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import toast from "react-hot-toast";
import { Button, Select, Spin, Divider } from "antd";

const PopularItems = () => {
  const [items, setItems] = useState<PopularItem[] | null>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  // State for Month and Size
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [fetchSize, setFetchSize] = useState(10); // Default to Top 10

  const sliderRef = useRef<HTMLDivElement>(null);

  const months = [
    { value: 0, label: "JANUARY" },
    { value: 1, label: "FEBRUARY" },
    { value: 2, label: "MARCH" },
    { value: 3, label: "APRIL" },
    { value: 4, label: "MAY" },
    { value: 5, label: "JUNE" },
    { value: 6, label: "JULY" },
    { value: 7, label: "AUGUST" },
    { value: 8, label: "SEPTEMBER" },
    { value: 9, label: "OCTOBER" },
    { value: 10, label: "NOVEMBER" },
    { value: 11, label: "DECEMBER" },
  ];

  const sizeOptions = [
    { value: 5, label: "TOP 5" },
    { value: 10, label: "TOP 10" },
    { value: 20, label: "TOP 20" },
    { value: 50, label: "TOP 50" },
  ];

  // Re-fetch when User, Month, OR Size changes
  useEffect(() => {
    if (currentUser) {
      fetchPopularItems();
    }
  }, [currentUser, selectedMonth, fetchSize]);

  const fetchPopularItems = async () => {
    try {
      setIsLoading(true);
      const currentYear = new Date().getFullYear();

      const items: PopularItem[] = await getPopularItemsAction(
        fetchSize, // Pass the dynamic size here
        selectedMonth,
        currentYear,
      );
      setItems(items);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollSlider = (direction: "left" | "right") => {
    if (sliderRef.current) {
      const scrollAmount = 240;
      sliderRef.current.scrollBy({
        left: direction === "right" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <DashboardCard>
      <div className="mb-2">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h4 className="text-xl font-bold text-black m-0 leading-none">
              Trending Products
            </h4>

            <div className="flex items-center gap-1">
              
              <Divider type="vertical" className="h-6 bg-gray-300 mx-1" />
              <Button.Group>
                <Button
                  icon={<IconChevronLeft size={16} />}
                  onClick={() => scrollSlider("left")}
                />
                <Button
                  icon={<IconChevronRight size={16} />}
                  onClick={() => scrollSlider("right")}
                />
              </Button.Group>
            </div>
          </div>

          <div className="flex gap-2 w-full xl:w-auto">
            {/* Size Selector */}
            <Select
              value={fetchSize}
              onChange={setFetchSize}
              options={sizeOptions}
              className="w-1/3 xl:w-28"
            />

            {/* Month Selector */}
            <Select
              value={selectedMonth}
              onChange={setSelectedMonth}
              options={months}
              className="w-2/3 xl:w-40"
            />
          </div>
        </div>

        <Spin spinning={isLoading}>
          <div
            ref={sliderRef}
            className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide scroll-smooth snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {items?.map((item: PopularItem) => (
              <div key={item.item.productId} className="snap-start">
                <PopularItemCard item={item} />
              </div>
            ))}

            {!isLoading && items?.length === 0 && (
              <div className="w-full py-12 flex flex-col items-center justify-center opacity-50 border-2 border-dashed border-gray-100">
                <p className="text-sm font-bold m-0">
                  No Data For Selected Month
                </p>
              </div>
            )}
          </div>
        </Spin>
      </div>
    </DashboardCard>
  );
};

export default PopularItems;
