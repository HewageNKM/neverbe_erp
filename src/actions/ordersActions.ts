import api from "@/lib/api";
import { Order } from "@/model/Order";

export const fetchOrdersAction = async (page: number, size: number) => {
  try {
    const response = await api.get(
      `/api/v1/erp/orders?size=${size}&page=${page}`,
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

export const getOrdersByDateAction = async (date: string) => {
  try {
    const response = await api.get(`/api/v1/erp/orders/date?date=${date}`);
    return response.data;
  } catch (e: unknown) {
    const err = e as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    throw new Error(err.response?.data?.message ?? err.message);
  }
};

export const updateAOrderAction = async (order: Order) => {
  try {
    const formData = new FormData();
    formData.append("data", JSON.stringify(order));
    const response = await api.put(
      `/api/v1/erp/orders/${order.orderId}`,
      formData,
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
