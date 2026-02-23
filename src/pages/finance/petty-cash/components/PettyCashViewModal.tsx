import React, { useState } from "react";
import {
  IconLoader,
  IconCheck,
  IconBan,
  IconExternalLink,
  IconDownload,
  IconPaperclip,
} from "@tabler/icons-react";
import { PettyCash } from "@/model/PettyCash";
import { getToken } from "@/firebase/firebaseClient";
import toast from "react-hot-toast";
import {
  Modal,
  Descriptions,
  Tag,
  Button,
  Space,
  Statistic,
  Typography,
} from "antd";

const { Title, Text } = Typography;

interface PettyCashViewModalProps {
  open: boolean;
  onClose: () => void;
  onStatusChange: () => void;
  entry: PettyCash | null;
}

const PettyCashViewModal: React.FC<PettyCashViewModalProps> = ({
  open,
  onClose,
  onStatusChange,
  entry,
}) => {
  const [processing, setProcessing] = useState<"approve" | "reject" | null>(
    null,
  );

  const handleStatusUpdate = async (newStatus: "APPROVED" | "REJECTED") => {
    if (!entry) return;

    setProcessing(newStatus === "APPROVED" ? "approve" : "reject");
    try {
      const token = await getToken();
      const res = await fetch(`/api/v1/erp/finance/petty-cash/${entry.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update status");
      }

      toast.success(`ENTRY ${newStatus}`);
      onStatusChange();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (date: string | any) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "green";
      case "REJECTED":
        return "red";
      default:
        return "orange";
    }
  };

  if (!entry) return null;

  return (
    <Modal
      open={open}
      title={
        <Space>
          <Text strong>Record #{entry.id?.slice(-6)}</Text>
          <Tag color={getStatusColor(entry.status)}>{entry.status}</Tag>
        </Space>
      }
      onCancel={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} disabled={!!processing}>
            Close
          </Button>
          {entry.status === "PENDING" && (
            <>
              <Button
                danger
                onClick={() => handleStatusUpdate("REJECTED")}
                loading={processing === "reject"}
                icon={<IconBan size={16} />}
              >
                Reject
              </Button>
              <Button
                type="primary"
                onClick={() => handleStatusUpdate("APPROVED")}
                loading={processing === "approve"}
                icon={<IconCheck size={16} />}
              >
                Approve
              </Button>
            </>
          )}
        </div>
      }
      width={700}
    >
      <div className="bg-gray-50 p-6 text-center border rounded-lg mb-6">
        <Statistic
          title={
            <Tag color={entry.type === "income" ? "green" : "red"}>
              {entry.type.toUpperCase()}
            </Tag>
          }
          value={entry.amount}
          precision={2}
          prefix="LKR"
          valueStyle={{ fontWeight: "bold" }}
        />
      </div>

      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="Category">{entry.category}</Descriptions.Item>
        <Descriptions.Item label="Sub Category">
          {entry.subCategory || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Method">
          {entry.paymentMethod}
        </Descriptions.Item>
        <Descriptions.Item label="Bank Account">
          {entry.bankAccountName || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Note" span={2}>
          {entry.note}
        </Descriptions.Item>

        <Descriptions.Item label="Attachment" span={2}>
          {entry.attachment ? (
            <Space>
              <Button
                size="small"
                icon={<IconExternalLink size={14} />}
                href={entry.attachment}
                target="_blank"
              >
                View
              </Button>
              <Button
                size="small"
                icon={<IconDownload size={14} />}
                href={entry.attachment}
                download
              >
                Download
              </Button>
            </Space>
          ) : (
            "No Attachment"
          )}
        </Descriptions.Item>

        <Descriptions.Item label="Created By">
          {entry.createdBy || "System"}
        </Descriptions.Item>
        <Descriptions.Item label="Created At">
          {formatDate(entry.createdAt)}
        </Descriptions.Item>
        {entry.reviewedBy && (
          <>
            <Descriptions.Item label="Reviewed By">
              {entry.reviewedBy}
            </Descriptions.Item>
            <Descriptions.Item label="Reviewed At">
              {formatDate(entry.reviewedAt)}
            </Descriptions.Item>
          </>
        )}
      </Descriptions>
    </Modal>
  );
};

export default PettyCashViewModal;
