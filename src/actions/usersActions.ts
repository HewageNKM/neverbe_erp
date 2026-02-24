import api from "@/lib/api";
import { User } from "@/model/User";

export const getUsersAction = async (page: number, size: number) => {
  try {
    const response = await api.get(
      `/api/v1/erp/users?page=${page}&size=${size}`,
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

export interface GetUsersV2Params {
  page: number;
  size: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface GetUsersV2Response {
  users: User[];
  total: number;
  page: number;
  size: number;
  hasMore: boolean;
}

export const getUsersV2Action = async (
  params: GetUsersV2Params,
): Promise<GetUsersV2Response> => {
  try {
    const response = await api.get("/api/v1/erp/users", { params });
    return response.data;
  } catch (e: unknown) {
    const err = e as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    throw new Error(err.response?.data?.message ?? err.message);
  }
};

export const addNewUserAction = async (data: User) => {
  try {
    const response = await api.post("/api/v1/erp/users", data);
    return response.data;
  } catch (e: unknown) {
    const err = e as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    throw new Error(err.response?.data?.message ?? err.message);
  }
};

export const deleteUserByIdAction = async (id: string) => {
  try {
    const response = await api.delete(`/api/v1/erp/users/${id}`);
    return response.data;
  } catch (e: unknown) {
    const err = e as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    throw new Error(err.response?.data?.message ?? err.message);
  }
};

export const updateUserByIdAction = async (data: User) => {
  try {
    const response = await api.put(`/api/v1/erp/users/${data.userId}`, data);
    return response.data;
  } catch (e: unknown) {
    const err = e as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    throw new Error(err.response?.data?.message ?? err.message);
  }
};
