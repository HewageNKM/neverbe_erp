import api from "@/lib/api";
import { Expense } from "@/model/Expense";

export const addNewExpenseAction = async (expense: Expense) => {
  try {
    const response = await api.post("/api/v1/erp/finance/petty-cash", expense);
    return response.data;
  } catch (e: unknown) {
    const err = e as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    throw new Error(err.response?.data?.message ?? err.message);
  }
};

export const getAllExpensesAction = async (page: number, size: number) => {
  try {
    const response = await api.get(
      `/api/v1/erp/finance/petty-cash?page=${page}&size=${size}`,
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

export const getAllExpensesByDateAction = async (date: string) => {
  try {
    const response = await api.get(
      `/api/v1/erp/finance/petty-cash?date=${date}`,
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

export const deleteExpenseByIdAction = async (id: string) => {
  try {
    const response = await api.delete(`/api/v1/erp/finance/petty-cash/${id}`);
    return response.data;
  } catch (e: unknown) {
    const err = e as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    throw new Error(err.response?.data?.message ?? err.message);
  }
};
