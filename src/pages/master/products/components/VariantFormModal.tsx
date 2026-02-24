import React, { useState, useEffect } from "react";
import { ProductVariant } from "@/model/ProductVariant";
import { DropdownOption } from "../page";
import { IconPhotoPlus, IconX } from "@tabler/icons-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import {
  Modal,
  Form,
  Input,
  Button,
  Upload,
  Switch,
  Divider,
  Space,
} from "antd";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface VariantFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (variant: ProductVariant) => void;
  variant: ProductVariant | null;
  sizes: DropdownOption[];
  productId: string;
}

const VariantFormModal: React.FC<VariantFormModalProps> = ({
  open,
  onClose,
  onSave,
  variant,
  sizes,
  productId,
}) => {
  const [form] = Form.useForm();
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [currentImages, setCurrentImages] = useState<any[]>([]);
  const selectedSizes = Form.useWatch("sizes", form) || [];

  const isEditing = !!variant;
  const isNewVariant =
    !isEditing || (variant && variant.variantId.startsWith("var_"));

  useEffect(() => {
    if (open) {
      if (variant) {
        form.setFieldsValue(variant);
        setCurrentImages(variant.images || []);
      } else {
        form.resetFields();
        form.setFieldsValue({
          variantId: `var_${Date.now()}`,
          status: true,
          sizes: [],
        });
        setCurrentImages([]);
      }
      setNewImageFiles([]);
      setIsSaving(false);
    }
  }, [variant, open, form]);

  const beforeUpload = (file: File) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error(`${file.name}: Invalid Type`);
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`${file.name}: Too Large`);
      return Upload.LIST_IGNORE;
    }
    setNewImageFiles((prev) => [...prev, file]);
    return false;
  };

  const removeNewFile = (index: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setCurrentImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleSize = (sizeLabel: string) => {
    const current = form.getFieldValue("sizes") || [];
    if (current.includes(sizeLabel)) {
      form.setFieldValue(
        "sizes",
        current.filter((s: string) => s !== sizeLabel),
      );
    } else {
      form.setFieldValue("sizes", [...current, sizeLabel]);
    }
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      const formDataPayload = new FormData();
      formDataPayload.append(
        "variantId",
        String(values.variantId || variant?.variantId),
      );
      formDataPayload.append("variantName", String(values.variantName));
      formDataPayload.append("sizes", JSON.stringify(values.sizes || []));
      formDataPayload.append("images", JSON.stringify(currentImages || []));
      formDataPayload.append("status", String(values.status ?? true));

      newImageFiles.forEach((file) => {
        formDataPayload.append("newImages", file, file.name);
      });

      const varId = String(values.variantId || variant?.variantId);
      const url = isNewVariant
        ? `/api/v1/erp/catalog/products/${productId}/variants`
        : `/api/v1/erp/catalog/products/${productId}/variants/${varId}`;

      const response = isNewVariant
        ? await api.post(url, formDataPayload)
        : await api.put(url, formDataPayload);

      onSave(response.data);
      toast.success(`Variant ${isNewVariant ? "added" : "updated"}`);
      onClose();
    } catch (error: unknown) {
      console.error("Failed to save variant:", error);
      toast.error("Failed to save variant");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={isEditing ? "Edit Variant" : "Add Variant"}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={isSaving}
      width={600}
      maskClosable={false}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="variantId" hidden>
          <Input />
        </Form.Item>

        <Form.Item
          name="variantName"
          label="Variant Name"
          rules={[{ required: true }]}
        >
          <Input placeholder="e.g. Red / Limited Edition" />
        </Form.Item>

        <Form.Item label="Size Availability" name="sizes">
          <Space wrap size={[8, 8]}>
            {sizes.map((s) => {
              const isSelected = selectedSizes.includes(s.label);
              return (
                <Button
                  key={s.id}
                  size="small"
                  type={isSelected ? "primary" : "default"}
                  onClick={() => toggleSize(s.label)}
                >
                  {s.label}
                </Button>
              );
            })}
          </Space>
        </Form.Item>

        <Form.Item name="status" label="Active Status" valuePropName="checked">
          <Switch checkedChildren="ACTIVE" unCheckedChildren="INACTIVE" />
        </Form.Item>

        <Divider orientation={"left" as any}>Gallery</Divider>

        <div className="mb-4">
          <Upload beforeUpload={beforeUpload} multiple showUploadList={false}>
            <Button icon={<IconPhotoPlus size={16} />}>Add Images</Button>
          </Upload>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Existing Images */}
          {currentImages.map((img, i) => (
            <div key={i} className="relative w-20 h-20 border border-gray-200">
              <img
                src={img.url}
                className="w-full h-full object-cover"
                alt="cloud"
              />
              <button
                type="button"
                onClick={() => removeExistingImage(i)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:scale-110 transition-transform"
              >
                <IconX size={12} />
              </button>
            </div>
          ))}

          {/* New Images */}
          {newImageFiles.map((file, i) => (
            <div key={i} className="relative w-20 h-20 border border-gray-200">
              <img
                src={URL.createObjectURL(file)}
                className="w-full h-full object-cover opacity-80"
                alt="local"
              />
              <button
                type="button"
                onClick={() => removeNewFile(i)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:scale-110 transition-transform"
              >
                <IconX size={12} />
              </button>
            </div>
          ))}
        </div>
      </Form>
    </Modal>
  );
};

export default VariantFormModal;
