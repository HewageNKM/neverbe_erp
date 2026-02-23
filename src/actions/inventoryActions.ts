import api from "@/lib/api";
import { Item } from "@/model/Item";

export const fetchInventoryAction = async (size: number, page: number) => {
  try {
    const response = await api({
      method: "GET",
      url: `/api/v1/inventory?size=${size}&page=${page}`,
    });

    return response.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};
export const fetchAItemAction = async (itemId: string) => {
  try {
    const response = await api({
      method: "GET",
      url: `/api/v1/erp/inventory/${itemId}`,
    });
    return response.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};
export const updateAItemAction = async (item: Item) => {
  try {
    const response = await api({
      method: "PUT",
      url: `/api/v1/erp/inventory/${item.itemId}`,
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify(item),
    });
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const addAItem = async (item: Item) => {
  try {
    const response = await api({
      method: "POST",
      url: `/api/v1/inventory`,
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify(item),
    });
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};
export const uploadAFileAction = async (file: File, path: string) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", path);

    const response = await api({
      method: "POST",
      url: `/api/v1/storage`,

      data: formData,
    });

    return response.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};
export const deleteAItemAction = async (itemId: string) => {
  try {
    const response = await api({
      method: "DELETE",
      url: `/api/v1/erp/inventory/${itemId}`,
    });
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};
export const deleteAFileAction = async (path: string) => {
  try {
    const response = await api({
      method: "DELETE",
      url: `/api/v1/storage?path=${path}`,
    });

    return response.data;
  } catch (e) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};

export const getPopularItemsAction = async (
  size: number,
  month: number,
  year: number,
) => {
  try {
    const response = await api({
      method: "GET",
      url: `/api/v1/erp/dashboard/popular-items?size=${size}&month=${month}&year=${year}`,
    });

    return response.data;
  } catch (e: any) {
    throw new Error(e.response ? e.response.data.message : e.message);
  }
};
