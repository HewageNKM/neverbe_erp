import React, { useState, useEffect, useMemo } from "react";
import { DropdownOption } from "@/pages/master/products/page";
import api from "@/lib/api";
import toast from "react-hot-toast";
import {
  Modal,
  Form,
  Select,
  Button,
  Spin,
  Card,
  Typography,
  Statistic,
  Row,
  Col,
  InputNumber,
} from "antd";

const { Title, Text } = Typography;
const { Option } = Select;

interface StockLocationOption extends DropdownOption {}

interface VariantDropdownOption {
  id: string;
  label: string;
  sizes: string[];
}

interface BulkInventoryFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  products: DropdownOption[];
  stockLocations: StockLocationOption[];
}

const BulkInventoryFormModal: React.FC<BulkInventoryFormModalProps> = ({
  open,
  onClose,
  onSave,
  products,
  stockLocations,
}) => {
  const [variants, setVariants] = useState<VariantDropdownOption[]>([]);
  const [selectedVariant, setSelectedVariant] =
    useState<VariantDropdownOption | null>(null);

  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>(
    {},
  );
  const [currentStock, setCurrentStock] = useState<Record<string, number>>({});

  const [loadingVariants, setLoadingVariants] = useState(false);
  const [loadingStock, setLoadingStock] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form selections (handled outside AntD Form for grid logic, but can use state)
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [stockId, setStockId] = useState("");

  useEffect(() => {
    if (open) {
      setProductId("");
      setVariantId("");
      setStockId("");
      setVariants([]);
      setSelectedVariant(null);
      setSizeQuantities({});
      setCurrentStock({});
      setSaving(false);
    }
  }, [open]);

  // Fetch variants when product changes
  const fetchVariants = async (pid: string) => {
    if (!pid) {
      setVariants([]);
      return;
    }
    setLoadingVariants(true);
    setVariantId("");
    setSelectedVariant(null);
    try {
      const response = await api.get(
        `/api/v1/erp/catalog/products/${pid}/variants/dropdown`,
      );
      setVariants(response.data || []);
    } catch {
      setVariants([]);
    } finally {
      setLoadingVariants(false);
    }
  };

  // Fetch current stock
  useEffect(() => {
    const fetchCurrentStock = async () => {
      if (!productId || !variantId || !stockId || !selectedVariant) {
        setCurrentStock({});
        return;
      }

      setLoadingStock(true);
      const stockData: Record<string, number> = {};
      try {
        const promises = selectedVariant.sizes.map(async (size) => {
          try {
            const response = await api.get(
              "/api/v1/erp/inventory/check-quantity",
              {
                params: { productId, variantId, size, stockId },
              },
            );
            stockData[size] = response.data?.quantity ?? 0;
          } catch {
            stockData[size] = 0;
          }
        });
        await Promise.all(promises);
        setCurrentStock(stockData);
        setSizeQuantities(stockData);
      } catch {
        // ignore
      } finally {
        setLoadingStock(false);
      }
    };

    fetchCurrentStock();
  }, [productId, variantId, stockId, selectedVariant]);

  const handleProductChange = (value: string) => {
    setProductId(value);
    fetchVariants(value);
  };

  const handleVariantChange = (value: string) => {
    setVariantId(value);
    const v = variants.find((i) => i.id === value) || null;
    setSelectedVariant(v);
    if (v) {
      const initial: Record<string, number> = {};
      v.sizes.forEach((s) => (initial[s] = 0));
      setSizeQuantities(initial);
    } else {
      setSizeQuantities({});
    }
    setCurrentStock({});
  };

  const handleQuantityChange = (size: string, value: number | null) => {
    setSizeQuantities((prev) => ({
      ...prev,
      [size]: value || 0,
    }));
  };

  const changedCount = useMemo(() => {
    return Object.entries(sizeQuantities).filter(
      ([size, qty]) => qty !== (currentStock[size] ?? 0),
    ).length;
  }, [sizeQuantities, currentStock]);

  const handleSubmit = async () => {
    if (!productId || !variantId || !stockId) {
      toast("Missing Required Selections");
      return;
    }

    if (changedCount === 0) {
      toast("No changes detected");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        bulk: true,
        productId,
        variantId,
        stockId,
        sizeQuantities: Object.entries(sizeQuantities)
          .filter(([size, qty]) => qty !== (currentStock[size] ?? 0))
          .map(([size, quantity]) => ({ size, quantity })),
      };
      const response = await api.post("/api/v1/erp/inventory", payload);
      toast.success(`Bulk entry success: ${response.data.success} updated`);
      onSave();
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Bulk Stock Entry"
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={saving}
      okText={`Save Updates (${changedCount})`}
      width={800}
      maskClosable={false}
      okButtonProps={{ disabled: changedCount === 0 }}
    >
      <div className="space-y-4">
        <Select
          className="w-full"
          placeholder="Select Product..."
          value={productId || undefined}
          onChange={handleProductChange}
          showSearch
          optionFilterProp="children"
          disabled={saving}
        >
          {products.map((p) => (
            <Option key={p.id} value={p.id}>
              {p.label}
            </Option>
          ))}
        </Select>

        <Row gutter={16}>
          <Col span={12}>
            <Select
              className="w-full"
              placeholder="Select Variant..."
              value={variantId || undefined}
              onChange={handleVariantChange}
              loading={loadingVariants}
              disabled={saving || !productId}
            >
              {variants.map((v) => (
                <Option key={v.id} value={v.id}>
                  {v.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={12}>
            <Select
              className="w-full"
              placeholder="Select Stock Location..."
              value={stockId || undefined}
              onChange={setStockId}
              disabled={saving}
            >
              {stockLocations.map((s) => (
                <Option key={s.id} value={s.id}>
                  {s.label}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        <div className="pt-4 border-t border-gray-200">
          {loadingStock ? (
            <div className="text-center py-8">
              <Spin tip="Loading Stock Data..." />
            </div>
          ) : selectedVariant && stockId ? (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <Title level={5} className="!m-0">
                  Size Distribution
                </Title>
                <Text type="secondary">{changedCount} Sizes Changed</Text>
              </div>

              {selectedVariant.sizes.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {selectedVariant.sizes.map((size) => {
                    const current = currentStock[size] ?? 0;
                    const newVal = sizeQuantities[size] ?? 0;
                    const isChanged = newVal !== current;

                    return (
                      <Card
                        key={size}
                        size="small"
                        className={`${isChanged ? "border-gray-200 bg-green-50" : "bg-gray-50"}`}
                        bordered={isChanged}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <Text strong>{size}</Text>
                          <Text type="secondary" className="text-xs">
                            Prev: {current}
                          </Text>
                        </div>
                        <InputNumber
                          min={0}
                          className="w-full"
                          value={sizeQuantities[size]}
                          onChange={(val) => handleQuantityChange(size, val)}
                        />
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No sizes defined for this variant.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 border border-dashed rounded-lg bg-gray-50">
              Select Product, Variant and Location to manage stock.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default BulkInventoryFormModal;
