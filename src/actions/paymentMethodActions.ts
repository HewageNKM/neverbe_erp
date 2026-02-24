import api from "@/lib/api";
import { PaymentMethod } from "@/model/PaymentMethod";

export const getAllPaymentMethodAction = async () => {
  try {
    const response = await api.get("/api/v1/erp/finance/payment-methods");
    return response.data;
  } catch (e: unknown) {
    const err = e as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    throw new Error(err.response?.data?.message ?? err.message);
  }
};

export const createPaymentMethodAction = async (
  paymentMethod: PaymentMethod,
) => {
  try {
    const response = await api.post(
      "/api/v1/erp/finance/payment-methods",
      paymentMethod,
    );
    return response.data;
  } catch (e: unknown) {
    const err = e as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    throw new Error(err.response?.data?.message ?? err.message);
  }
};

export const updatePaymentMethodAction = async (
  paymentMethod: PaymentMethod,
) => {
  try {
    const response = await api.put(
      `/api/v1/erp/finance/payment-methods/${paymentMethod.paymentId.toLowerCase()}`,
      paymentMethod,
    );
    return response.data;
  } catch (e: unknown) {
    const err = e as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    throw new Error(err.response?.data?.message ?? err.message);
  }
};
