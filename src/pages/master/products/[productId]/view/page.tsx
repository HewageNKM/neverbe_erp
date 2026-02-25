import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Tag,
  Statistic,
  Table,
  Image,
  Breadcrumb,
  Skeleton,
  Badge,
  Button,
  Empty,
  Tooltip,
} from "antd";
import {
  IconChevronLeft,
  IconEdit,
  IconTag,
  IconRuler,
  IconPhoto,
  IconCurrencyRupee,
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
        const response = await api.get(`/api/v1/erp/catalog/products/${id}`);
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
        <div className="space-y-6">
          <Skeleton active paragraph={{ rows: 1 }} />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5">
              <Skeleton.Image active className="!w-full !h-96 rounded-xl" />
            </div>
            <div className="lg:col-span-7">
              <Skeleton active paragraph={{ rows: 10 }} />
            </div>
          </div>
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
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Breadcrumb + Actions */}
        <div className="flex items-center justify-between">
          <Breadcrumb
            items={[
              {
                title: (
                  <Link
                    to="/master/products"
                    className="flex items-center gap-1 !text-green-600 hover:!text-green-700 font-medium transition-colors"
                  >
                    <IconChevronLeft size={14} />
                    Products
                  </Link>
                ),
              },
              { title: <span className="font-semibold">{product.name}</span> },
            ]}
          />
          <Tooltip title="Edit product">
            <Button
              icon={<IconEdit size={16} />}
              onClick={() => navigate(`/master/products`)}
            >
              Edit
            </Button>
          </Tooltip>
        </div>

        {/* Main content: image + details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── Left: Image gallery ── */}
          <div className="lg:col-span-5 space-y-3">
            {/* Main image */}
            <Card
              className="overflow-hidden p-0"
              styles={{ body: { padding: 0 } }}
            >
              <div className="aspect-square bg-gray-50 flex items-center justify-center rounded-lg overflow-hidden">
                {activeImage ? (
                  <Image
                    src={activeImage}
                    alt={product.name}
                    className="w-full h-full object-contain"
                    style={{ maxHeight: "400px" }}
                    preview={{ mask: <IconPhoto size={20} /> }}
                  />
                ) : (
                  <div className="flex flex-col items-center text-gray-300 gap-2">
                    <IconPhoto size={48} />
                    <span className="text-sm">No image</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <Image.PreviewGroup>
                <div className="grid grid-cols-5 gap-2">
                  {allImages.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveImage(img.url)}
                      className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                        activeImage === img.url
                          ? "border-gray-200 ring-2 ring-green-200"
                          : "border-transparent hover:border-gray-300"
                      }`}
                    >
                      <Image
                        src={img.url}
                        className="w-full h-full object-cover"
                        alt=""
                        preview={false}
                      />
                    </div>
                  ))}
                </div>
              </Image.PreviewGroup>
            )}
          </div>

          {/* ── Right: Product details ── */}
          <div className="lg:col-span-7 space-y-4">
            {/* Header card */}
            <Card>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">
                    {product.brand} · {product.category}
                  </p>
                  <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                    {product.name}
                  </h1>
                  <p className="text-xs font-mono text-gray-400 mt-1">
                    SKU: {product.productId}
                  </p>
                </div>
                <div className="flex flex-col gap-2 items-end shrink-0">
                  <Tag
                    color={product.status ? "success" : "default"}
                    className="!text-xs"
                  >
                    {product.status ? "Active" : "Inactive"}
                  </Tag>
                  <Tag
                    color={product.listing ? "blue" : "default"}
                    className="!text-xs"
                  >
                    {product.listing ? "Listed" : "Unlisted"}
                  </Tag>
                </div>
              </div>

              {product.description && (
                <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3 mt-3">
                  {product.description}
                </p>
              )}
            </Card>

            {/* Pricing cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card size="small" className="bg-green-50 border-gray-200">
                <Statistic
                  title={
                    <span className="text-xs text-green-700">
                      Selling Price
                    </span>
                  }
                  value={product.sellingPrice}
                  prefix={<IconCurrencyRupee size={14} />}
                  valueStyle={{
                    color: "#16a34a",
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                  formatter={(v) => Number(v).toLocaleString()}
                />
              </Card>
              <Card size="small">
                <Statistic
                  title={
                    <span className="text-xs text-gray-500">Market Price</span>
                  }
                  value={product.marketPrice}
                  prefix={<IconCurrencyRupee size={14} />}
                  valueStyle={{ fontSize: 16, fontWeight: 600 }}
                  formatter={(v) => Number(v).toLocaleString()}
                />
              </Card>
              <Card size="small">
                <Statistic
                  title={
                    <span className="text-xs text-gray-500">Cost Price</span>
                  }
                  value={product.buyingPrice}
                  prefix={<IconCurrencyRupee size={14} />}
                  valueStyle={{ fontSize: 16, fontWeight: 600 }}
                  formatter={(v) => Number(v).toLocaleString()}
                />
              </Card>
              <Card size="small" className="bg-red-50 border-red-100">
                <Statistic
                  title={<span className="text-xs text-red-600">Discount</span>}
                  value={product.discount}
                  suffix="%"
                  valueStyle={{
                    color: "#dc2626",
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                />
              </Card>
            </div>

            {/* Specs row */}
            <Card size="small">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Stock</p>
                  <span
                    className={`font-bold ${product.inStock ? "text-green-600" : "text-red-500"}`}
                  >
                    {product.inStock
                      ? `${product.totalStock} units`
                      : "Out of stock"}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Weight</p>
                  <span className="font-semibold">
                    {product.weight ?? "—"} g
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Gender</p>
                  <div className="flex flex-wrap gap-1">
                    {(product as unknown as Record<string, unknown[]>).gender &&
                    (
                      (product as unknown as Record<string, unknown[]>)
                        .gender as string[]
                    ).length > 0 ? (
                      (
                        (product as unknown as Record<string, unknown[]>)
                          .gender as string[]
                      ).map((g: string) => (
                        <Tag key={g} color="green" className="!text-xs">
                          {g}
                        </Tag>
                      ))
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Sizes</p>
                  <div className="flex flex-wrap gap-1">
                    {(product as unknown as Record<string, unknown[]>)
                      .availableSizes &&
                    (
                      (product as unknown as Record<string, unknown[]>)
                        .availableSizes as string[]
                    ).length > 0 ? (
                      (
                        (product as unknown as Record<string, unknown[]>)
                          .availableSizes as string[]
                      ).map((s: string) => (
                        <Tag key={s} className="!text-xs">
                          {s}
                        </Tag>
                      ))
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <Card size="small">
                <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                  <IconTag size={12} /> Tags
                </p>
                <div className="flex flex-wrap gap-1">
                  {product.tags.map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Variants table */}
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 mb-3 pb-2 border-b border-gray-200">
            <IconRuler size={16} />
            Product Variants ({product.variants?.length || 0})
          </div>
          <Table scroll={{ x: 'max-content' }}
            columns={variantColumns}
            dataSource={product.variants || []}
            rowKey="variantId"
            pagination={false}
            size="small"
            locale={{ emptyText: "No variants configured" }}
            className="rounded-lg overflow-hidden border border-gray-100"
          />
        </div>
      </div>
    </PageContainer>
  );
};

export default ProductViewPage;
