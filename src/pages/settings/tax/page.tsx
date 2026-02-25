import { Spin, Button } from "antd";
import api from "@/lib/api";

import React, { useState, useEffect } from "react";
import { IconReceipt2, IconInfoCircle } from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface TaxSettings {
  id?: string;
  taxEnabled: boolean;
  taxName: string;
  taxRate: number;
  taxIncludedInPrice: boolean;
  applyToShipping: boolean;
  taxRegistrationNumber?: string;
  businessName?: string;
  minimumOrderForTax?: number;
}

// Toggle Switch Component
const Toggle = ({
  checked,
  onChange,
  size = "md",
}: {
  checked: boolean;
  onChange: () => void;
  size?: "sm" | "md";
}) => {
  const isSmall = size === "sm";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`
        relative inline-flex shrink-0 cursor-pointer items-center
        rounded-full border border-transparent transition-colors duration-200 ease-in-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2
        ${checked ? "bg-green-600" : "bg-gray-300"}
        ${isSmall ? "h-6 w-11" : "h-7 w-14"}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block transform rounded-full bg-white shadow-lg
          ring-0 transition duration-200 ease-in-out
          ${
            checked
              ? isSmall
                ? "translate-x-5"
                : "translate-x-7"
              : "translate-x-0.5"
          }
          ${isSmall ? "h-5 w-5" : "h-6 w-6"}
        `}
      />
    </button>
  );
};

const TaxSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<TaxSettings>({
    taxEnabled: false,
    taxName: "VAT",
    taxRate: 0,
    taxIncludedInPrice: true,
    applyToShipping: false,
    taxRegistrationNumber: "",
    businessName: "",
    minimumOrderForTax: 0,
  });

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get<TaxSettings>("/api/v1/erp/settings/tax");
      setSettings(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch tax settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchSettings();
  }, [currentUser]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/api/v1/erp/settings/tax", settings);
      toast.success("Tax settings saved successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save tax settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    field: keyof TaxSettings,
    value: string | number | boolean,
  ) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  // Calculate example tax
  const examplePrice = 10000;
  const calculateExampleTax = () => {
    if (!settings.taxEnabled || settings.taxRate <= 0) return 0;
    if (settings.taxIncludedInPrice) {
      return examplePrice - examplePrice / (1 + settings.taxRate / 100);
    }
    return (examplePrice * settings.taxRate) / 100;
  };

  if (loading) {
    return (
      <PageContainer title="Tax Settings">
        <div className="flex justify-center py-20">
          <div className="flex justify-center py-12">
            <Spin size="large" />
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Tax Settings" description="Taxation & Compliance">
      <div className="space-y-6">
        {/* PREMIUM HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-emerald-600 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                Taxation & Compliance
              </span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                Tax Settings
              </h2>
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            onClick={handleSave}
            disabled={saving}
            className="bg-black hover:bg-gray-800 border-none h-12 px-6 rounded-lg text-sm font-bold shadow-lg shadow-black/10 flex items-center gap-2"
          >
            {saving ? <Spin size="small" /> : null}
            Save Settings
          </Button>
        </div>

        {/* Main Toggle */}
        <div className="bg-white border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0 ${
                  settings.taxEnabled ? "bg-green-600" : "bg-gray-100"
                }`}
              >
                <IconReceipt2
                  size={20}
                  className={
                    settings.taxEnabled ? "text-white" : "text-gray-400"
                  }
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                  Enable Tax Collection
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  Calculate and track tax on orders
                </p>
              </div>
            </div>
            <Toggle
              checked={settings.taxEnabled}
              onChange={() => handleChange("taxEnabled", !settings.taxEnabled)}
            />
          </div>
        </div>

        {/* Tax Configuration */}
        {settings.taxEnabled && (
          <div className="space-y-6">
            {/* Tax Rate Section */}
            <div className="bg-white border border-gray-200 overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-xs sm:text-sm font-bold   text-gray-900">
                  Tax Rate
                </h3>
              </div>
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-xs font-bold   text-gray-500 mb-2">
                      Tax Name
                    </label>
                    <input
                      type="text"
                      value={settings.taxName}
                      onChange={(e) => handleChange("taxName", e.target.value)}
                      placeholder="e.g., VAT, GST"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-300 text-gray-900 font-medium focus:outline-none focus:border-gray-200 focus:ring-1 focus:ring-black text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold   text-gray-500 mb-2">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={settings.taxRate}
                      onChange={(e) =>
                        handleChange("taxRate", parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-300 text-gray-900 font-medium focus:outline-none focus:border-gray-200 focus:ring-1 focus:ring-black text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Calculation Preview */}
                <div className="bg-gray-50 border border-gray-200 p-3 sm:p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <IconInfoCircle
                      size={16}
                      className="text-gray-400 mt-0.5 flex-shrink-0"
                    />
                    <span className="text-xs font-bold   text-gray-500">
                      Calculation Preview
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">
                    For Rs {examplePrice.toLocaleString()}:{" "}
                    <strong className="text-black">
                      {settings.taxName} = Rs {calculateExampleTax().toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Calculation Rules */}
            <div className="bg-white border border-gray-200 overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-xs sm:text-sm font-bold   text-gray-900">
                  Calculation Rules
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {/* Tax Included Toggle */}
                <div className="p-4 sm:p-6 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                      Tax Included in Prices
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Prices already include tax
                    </p>
                  </div>
                  <Toggle
                    checked={settings.taxIncludedInPrice}
                    onChange={() =>
                      handleChange(
                        "taxIncludedInPrice",
                        !settings.taxIncludedInPrice,
                      )
                    }
                    size="sm"
                  />
                </div>

                {/* Apply to Shipping Toggle */}
                <div className="p-4 sm:p-6 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                      Apply Tax to Shipping
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Include shipping in taxable amount
                    </p>
                  </div>
                  <Toggle
                    checked={settings.applyToShipping}
                    onChange={() =>
                      handleChange("applyToShipping", !settings.applyToShipping)
                    }
                    size="sm"
                  />
                </div>

                {/* Minimum Order */}
                <div className="p-4 sm:p-6">
                  <label className="block text-xs font-bold   text-gray-500 mb-2">
                    Minimum Order for Tax (Rs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settings.minimumOrderForTax || 0}
                    onChange={(e) =>
                      handleChange(
                        "minimumOrderForTax",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    placeholder="0"
                    className="w-full sm:max-w-xs px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-300 text-gray-900 font-medium focus:outline-none focus:border-gray-200 focus:ring-1 focus:ring-black text-sm sm:text-base"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Set to 0 to apply to all orders
                  </p>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="bg-white border border-gray-200 overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-xs sm:text-sm font-bold   text-gray-900">
                  Business Information
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-xs font-bold   text-gray-500 mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={settings.businessName || ""}
                      onChange={(e) =>
                        handleChange("businessName", e.target.value)
                      }
                      placeholder="Your business name"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-300 text-gray-900 font-medium focus:outline-none focus:border-gray-200 focus:ring-1 focus:ring-black text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold   text-gray-500 mb-2">
                      Tax Registration Number
                    </label>
                    <input
                      type="text"
                      value={settings.taxRegistrationNumber || ""}
                      onChange={(e) =>
                        handleChange("taxRegistrationNumber", e.target.value)
                      }
                      placeholder="e.g., VAT-123456789"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-300 text-gray-900 font-medium focus:outline-none focus:border-gray-200 focus:ring-1 focus:ring-black text-sm sm:text-base"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default TaxSettingsPage;
