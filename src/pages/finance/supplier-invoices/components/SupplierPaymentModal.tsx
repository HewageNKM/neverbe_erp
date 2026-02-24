import {  Spin , Button } from "antd";
import api from "@/lib/api";
import React, { useState, useEffect } from "react";
import {
  IconX,
  IconLoader2,
  IconBuildingBank,
  IconCurrencyDollar,
  IconNote,
} from "@tabler/icons-react";
import { SupplierInvoice } from "@/model/SupplierInvoice";
import toast from "react-hot-toast";

interface SupplierPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  invoice: SupplierInvoice | null;
}

const styles = {
  label:
    "block text-xs font-bold text-gray-500   mb-2",
  input:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-lg border border-transparent focus:bg-white focus:border-gray-200 transition-all duration-200 outline-none placeholder:text-gray-400",
  select:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-lg border border-transparent focus:bg-white focus:border-gray-200 transition-all duration-200 outline-none appearance-none cursor-pointer",
};

const SupplierPaymentModal: React.FC<SupplierPaymentModalProps> = ({
  open,
  onClose,
  onPaymentSuccess,
  invoice,
}) => {
  const [amount, setAmount] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [notes, setNotes] = useState("");
  const [bankAccounts, setBankAccounts] = useState<
    { id: string; label: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(invoice ? String(invoice.balance) : "");
      setBankAccountId("");
      setNotes("");
      fetchBankAccounts();
    }
  }, [open, invoice]);

  const fetchBankAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        "/api/v1/erp/finance/bank-accounts?dropdown=true");
      setBankAccounts(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      toast("Enter a valid amount");
      return;
    }
    if (Number(amount) > (invoice?.balance || 0)) {
      toast("Amount exceeds balance");
      return;
    }

    setProcessing(true);
    try {
      await api.post(
        `/api/v1/erp/finance/supplier-invoices/${invoice?.id}/payment`,
        {
          amount: Number(amount),
          bankAccountId: bankAccountId || undefined,
          notes,
        });

      toast.success("Payment recorded");
      onPaymentSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  if (!open || !invoice) return null;

  return (
    <div className="fixed inset-0 bg-green-600/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md shadow-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-sm font-bold   text-gray-900">
              Record Payment
            </h3>
            <p className="text-xs text-gray-500  tracking-wide">
              {invoice.invoiceNumber} • Balance:{" "}
              {invoice.balance.toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={processing}
            className="text-gray-400 hover:text-black transition-colors"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className={styles.label}>
              Payment Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`${styles.input} text-xl font-bold`}
                placeholder="0.00"
                disabled={processing}
                autoFocus
              />
              <IconCurrencyDollar
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>

          <div>
            <label className={styles.label}>Pay From (Optional)</label>
            <div className="relative">
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className={styles.select}
                disabled={processing || loading}
              >
                <option value="">Cash / Other</option>
                {bankAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.label}
                  </option>
                ))}
              </select>
              <IconBuildingBank
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Select a bank account to automatically deduct this amount.
            </p>
          </div>

          <div>
            <label className={styles.label}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={styles.input}
              placeholder="Cheque No, Ref ID..."
              disabled={processing}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-xs font-bold   hover:bg-gray-100"
            disabled={processing}
          >
            Cancel
          </button>
          <Button type="primary" size="large" onClick={handleSubmit} disabled={processing}>{processing && <Spin size="small" />}
            Confirm Payment</Button>
        </div>
      </div>
    </div>
  );
};

export default SupplierPaymentModal;
