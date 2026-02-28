import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Tag,
  Table,
  Image,
  Spin,
  Badge,
  Button,
  Empty,
  Tooltip,
  Descriptions,
  Statistic,
  Typography,
} from "antd";

const { Text } = Typography;
import {
  IconChevronLeft,
  IconEdit,
  IconTag,
  IconRuler,
  IconPhoto,
} from "@tabler/icons-react";
import api from "@/lib/api";
import { Product } from "@/model/Product";
import PageContainer from "@/pages/components/container/PageContainer";
import { useAppSelector } from "@/lib/hooks";
import { Link } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import { ProductVariant } from "@/model/ProductVariant";

const ProductViewPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const id = params.productId as string;
  const { currentUser } = useAppSelector((state) => state.authSlice);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !currentUser) return;
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/api/v1/erp/master/products/${id}`);
        if (response.data) {
          const prod: Product = response.data;
          setProduct(prod);
          setActiveImage(prod.thumbnail?.url || null);
        } else {
          setError("Product not found.");
        }
      } catch {
        setError("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, currentUser]);

  const allImages = product
    ? [
        ...(product.thumbnail ? [product.thumbnail] : []),
        ...(product.variants?.flatMap((v) => v.images || []) || []),
      ]
    : [];

  const variantColumns: ColumnsType<ProductVariant> = [
    {
      title: "Variant Name",
      dataIndex: "variantName",
      key: "variantName",
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: "Variant ID",
      dataIndex: "variantId",
      key: "variantId",
      render: (text: string) => (
        <span className="font-mono text-xs text-gray-400">{text}</span>
      ),
    },
    {
      title: "Sizes",
      dataIndex: "sizes",
      key: "sizes",
      render: (sizes: string[]) => (
        <div className="flex flex-wrap gap-1">
          {sizes?.map((s) => (
            <Tag key={s} className="text-xs">
              {s}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v: boolean) => (
        <Badge
          status={v ? "success" : "default"}
          text={v ? "Active" : "Inactive"}
        />
      ),
    },
    {
      title: "Images",
      dataIndex: "images",
      key: "images",
      render: (imgs: { url: string }[]) => (
        <div className="flex gap-1">
          {imgs?.slice(0, 3).map((img, i) => (
            <img
              key={i}
              src={img.url}
              className="w-8 h-8 rounded object-cover border border-gray-100"
              alt=""
            />
          ))}
          {(imgs?.length || 0) > 3 && (
            <span className="text-xs text-gray-400 flex items-center">
              +{imgs.length - 3}
            </span>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <PageContainer title="Loading Product...">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spin size="large" tip="Loading product details..." />
        </div>
      </PageContainer>
    );
  }

  if (error || !product) {
    return (
      <PageContainer title="Product Not Found">
        <Empty description={error || "Product not found"} className="mt-20">
          <Link to="/master/products">
            <Button>Back to Products</Button>
          </Link>
        </Empty>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={product.name}
      description={`Details for ${product.name}`}
    >
      <div className="space-y-8">
        {" "}
        {/* Header & Main Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-100 pb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shrink-0">
              <IconTag size={32} stroke={1.5} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Text className="text-xs font-bold text-green-600 uppercase tracking-wider">
                  {product.brand} · {product.category}
                </Text>
                <Tag
                  color={product.status ? "success" : "default"}
                  className="rounded-full px-3 text-[10px] font-bold uppercase border-none"
                >
                  {product.status ? "Active" : "Inactive"}
                </Tag>
                {product.listing && (
                  <Tag
                    color="blue"
                    className="rounded-full px-3 text-[10px] font-bold uppercase border-none"
                  >
                    Listed
                  </Tag>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight m-0">
                {product.name}
              </h1>
              <Text className="text-gray-400 font-mono text-xs">
                SKU: {product.productId}
              </Text>
            </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              size="large"
              className="flex-1 sm:flex-none rounded-xl font-semibold inline-flex items-center justify-center gap-2"
              icon={<IconEdit size={18} />}
              onClick={() => navigate(`/master/products`)}
            >
              Edit Product
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Media & Primary Info (Lg: 5/12) */}
          <div className="lg:col-span-5 space-y-8">
            {/* Image Gallery Container */}
            <div className="space-y-4">
              <Card
                className="border-none rounded-3xl overflow-hidden bg-gray-50 shadow-none ring-1 ring-gray-100"
                styles={{ body: { padding: 0 } }}
              >
                <div className="aspect-square flex items-center justify-center rounded-2xl overflow-hidden relative group">
                  {activeImage ? (
                    <Image
                      src={activeImage}
                      alt={product.name}
                      className="w-full h-full object-contain mix-blend-multiply"
                      style={{ maxHeight: "450px" }}
                      preview={{
                        mask: (
                          <div className="flex items-center gap-2 font-bold text-white uppercase tracking-widest text-[10px]">
                            <IconPhoto size={20} /> Preview
                          </div>
                        ),
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-300 gap-2">
                      <IconPhoto size={64} stroke={1} />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        No image available
                      </span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Thumbnails Swiper-like grid */}
              {allImages.length > 1 && (
                <div className="grid grid-cols-5 gap-3 px-1">
                  {allImages.slice(0, 5).map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveImage(img.url)}
                      className={`aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-300 ${
                        activeImage === img.url
                          ? "border-green-500 shadow-md transform scale-105"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img.url}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Overview / Description */}
            <Card
              title={
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-green-500 rounded-full" />
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    Product Narrative
                  </span>
                </div>
              }
              className="border border-gray-100 rounded-2xl bg-white shadow-none"
            >
              <div className="text-sm text-gray-600 leading-relaxed font-medium">
                {product.description || (
                  <span className="italic text-gray-400">
                    No description provided for this catalog item.
                  </span>
                )}
              </div>
            </Card>

            {/* Tags Box */}
            {product.tags && product.tags.length > 0 && (
              <Card
                className="border border-gray-100 rounded-2xl bg-white shadow-none p-2"
                styles={{ body: { padding: "12px" } }}
              >
                <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3 px-1">
                  <IconTag size={12} /> Keywords
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Tag
                      key={tag}
                      className="m-0 px-3 py-1 rounded-full border-gray-100 bg-gray-50 text-gray-600 font-bold"
                    >
                      {tag}
                    </Tag>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column: Specs, Pricing & Variants (Lg: 7/12) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Financial Performance Section */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border border-gray-100 rounded-2xl bg-green-50/30 shadow-none hover:bg-green-50 transition-colors">
                <Statistic
                  title={
                    <span className="text-[10px] uppercase font-bold text-green-700 tracking-widest">
                      Primary Retail
                    </span>
                  }
                  value={product.sellingPrice}
                  prefix={<span className="text-sm font-bold">LKR</span>}
                  valueStyle={{
                    color: "#059669",
                    fontSize: 24,
                    fontWeight: 900,
                  }}
                  formatter={(v) => Number(v).toLocaleString()}
                />
                <div className="mt-1">
                  <span className="text-[10px] font-bold text-green-600 uppercase">
                    Active MSRP
                  </span>
                </div>
              </Card>
              <Card className="border border-gray-100 rounded-2xl bg-white shadow-none hover:border-gray-200 transition-colors">
                <Statistic
                  title={
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                      Market Value
                    </span>
                  }
                  value={product.marketPrice}
                  prefix={<span className="text-sm font-bold">LKR</span>}
                  valueStyle={{
                    color: "#1f2937",
                    fontSize: 20,
                    fontWeight: 700,
                    textDecoration: "line-through",
                    opacity: 0.3,
                  }}
                  formatter={(v) => Number(v).toLocaleString()}
                />
                <div className="mt-1">
                  <Tag className="rounded-full bg-red-50 text-red-600 border-none font-bold text-[10px]">
                    SAVE {product.discount}%
                  </Tag>
                </div>
              </Card>
            </div>

            {/* Product Specifications Grid */}
            <Card
              title={
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-gray-300 rounded-full" />
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    Technical Specifications
                  </span>
                </div>
              }
              className="border border-gray-100 rounded-2xl bg-white shadow-none"
            >
              <Descriptions
                bordered={false}
                column={{ xxl: 2, xl: 2, lg: 1, md: 2, sm: 1, xs: 1 }}
                size="middle"
                labelStyle={{
                  color: "#9ca3af",
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  paddingBottom: 4,
                }}
                contentStyle={{
                  color: "#111827",
                  fontSize: 14,
                  fontWeight: 700,
                  paddingBottom: 20,
                }}
              >
                <Descriptions.Item label="Inventory Status">
                  <span
                    className={
                      product.inStock ? "text-green-600" : "text-red-500"
                    }
                  >
                    {product.inStock
                      ? `${product.totalStock} units available`
                      : "Stock Exhausted"}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Unit Weight">
                  {product.weight ? `${product.weight} g` : "Not specified"}
                </Descriptions.Item>
                <Descriptions.Item label="Target Audience">
                  <div className="flex flex-wrap gap-1">
                    {(product as any).gender?.length > 0 ? (
                      (product as any).gender.map((g: string) => (
                        <Tag
                          key={g}
                          className="m-0 rounded-full border-gray-100 bg-gray-50 text-gray-600 text-xs font-bold"
                        >
                          {g}
                        </Tag>
                      ))
                    ) : (
                      <span className="text-gray-400 font-medium">Generic</span>
                    )}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Size Range">
                  <div className="flex flex-wrap gap-1">
                    {(product as any).availableSizes?.length > 0 ? (
                      (product as any).availableSizes.map((s: string) => (
                        <Tag
                          key={s}
                          className="m-0 rounded-md border-gray-200 bg-white text-gray-900 text-xs font-bold"
                        >
                          {s}
                        </Tag>
                      ))
                    ) : (
                      <span className="text-gray-400 font-medium">—</span>
                    )}
                  </div>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Variants Table Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <IconRuler size={18} className="text-gray-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    Geometric Variants ({product.variants?.length || 0})
                  </span>
                </div>
              </div>
              <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-none">
                <Table
                  scroll={{ x: 1000 }}
                  bordered
                  columns={variantColumns}
                  dataSource={product.variants || []}
                  rowKey="variantId"
                  pagination={false}
                  size="middle"
                  locale={{ emptyText: "No variants configured" }}
                  className="variant-table"
                />
              </div>
            </div>

            {/* Bottom Actions or Notes could go here */}
          </div>
        </div>
      </div>

      <style>{`
        .variant-table .ant-table-thead > tr > th {
          background: #fcfcfc !important;
          color: #9ca3af !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          font-weight: 800 !important;
          border-bottom: 1px solid #f3f4f6 !important;
        }
        .variant-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f9fafb !important;
          padding: 16px !important;
        }
        .variant-table .ant-table {
          background: transparent !important;
        }
      `}</style>
    </PageContainer>
  );
};

export default ProductViewPage;
