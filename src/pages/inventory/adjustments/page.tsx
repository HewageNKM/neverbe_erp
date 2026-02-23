import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  IconPlus,
  IconEye,
  IconSearch,
  IconFilter,
  IconAdjustments,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import ComponentsLoader from "@/components/ComponentsLoader";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import {
  ADJUSTMENT_STATUS_COLORS,
  ADJUSTMENT_STATUS_LABELS,
  AdjustmentStatus,
} from "@/model/InventoryAdjustment";

type AdjustmentType = "add" | "remove" | "damage" | "return" | "transfer";

interface Adjustment {
  id: string;
  adjustmentNumber: string;
  type: AdjustmentType;
  reason: string;
  items: { productName: string; quantity: number }[];
  status: AdjustmentStatus;
  createdAt: string;
}

const TYPE_LABELS: Record<AdjustmentType, string> = {
  add: "Stock Addition",
  remove: "Stock Removal",
  damage: "Damaged Goods",
  return: "Customer Return",
  transfer: "Stock Transfer",
};

const TYPE_COLORS: Record<AdjustmentType, string> = {
  add: "bg-green-100 text-green-800",
  remove: "bg-red-100 text-red-800",
  damage: "bg-orange-100 text-orange-800",
  return: "bg-blue-100 text-blue-800",
  transfer: "bg-purple-100 text-purple-800",
};

const AdjustmentsPage = () => {
  const [loading, setLoading] = useState(true);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchAdjustments = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const params: Record<string, string> = {};
      if (typeFilter) params.type = typeFilter;

      const res = await axios.get<Adjustment[]>(
        "/api/v1/erp/inventory/adjustments",
        {
          params,
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setAdjustments(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch adjustments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchAdjustments();
  }, [currentUser, typeFilter]);

  const filteredAdjustments = adjustments.filter(
    (a) =>
      a.adjustmentNumber.toLowerCase().includes(search.toLowerCase()) ||
      a.reason.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <PageContainer title="Inventory Adjustments">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold  tracking-tight text-gray-900">
              Inventory Adjustments
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage stock additions, removals, and transfers
            </p>
          </div>
          <Link
            to="/inventory/adjustments/new"
            className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white text-xs font-bold   hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
          >
            <IconPlus size={16} />
            New Adjustment
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <IconSearch
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by ID or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-green-600"
            />
          </div>
          <div className="relative">
            <IconFilter
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="pl-12 pr-8 py-3 bg-white border border-gray-200 focus:outline-none focus:border-green-600 appearance-none min-w-[180px]"
            >
              <option value="">All Types</option>
              <option value="add">Stock Addition</option>
              <option value="remove">Stock Removal</option>
              <option value="damage">Damaged Goods</option>
              <option value="return">Customer Return</option>
              <option value="transfer">Stock Transfer</option>
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <ComponentsLoader />
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500  bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-bold ">Adjustment #</th>
                    <th className="px-6 py-3 font-bold ">Type</th>
                    <th className="px-6 py-3 font-bold ">Status</th>
                    <th className="px-6 py-3 font-bold ">Reason</th>
                    <th className="px-6 py-3 font-bold  text-right">Items</th>
                    <th className="px-6 py-3 font-bold  text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAdjustments.map((adj) => (
                    <tr
                      key={adj.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-gray-900">
                          {adj.adjustmentNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-bold  ${
                            TYPE_COLORS[adj.type] || "bg-gray-100"
                          }`}
                        >
                          {TYPE_LABELS[adj.type] || adj.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-bold  rounded-full ${
                            ADJUSTMENT_STATUS_COLORS[adj.status] ||
                            "bg-gray-100"
                          }`}
                        >
                          {ADJUSTMENT_STATUS_LABELS[adj.status] || adj.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                        {adj.reason}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600">
                        {adj.items?.length || 0} items
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/inventory/adjustments/${adj.id}`}
                          className="p-2 hover:bg-gray-100 inline-flex transition-colors"
                        >
                          <IconEye size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {filteredAdjustments.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <IconAdjustments
                          size={40}
                          className="mx-auto text-gray-300 mb-3"
                        />
                        No adjustments found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default AdjustmentsPage;
