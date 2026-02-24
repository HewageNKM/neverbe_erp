import api from "@/lib/api";

// ============ BANNER ACTIONS ============

export const addBannerAction = async (data: FormData) => {
  try {
    const response = await api.post(
      "/api/v1/erp/settings/ecom-web/banners",
      data,
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

export const getBannersAction = async () => {
  try {
    const response = await api.get("/api/v1/erp/settings/ecom-web/banners");
    return response.data;
  } catch (e: unknown) {
    const err = e as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    throw new Error(err.response?.data?.message ?? err.message);
  }
};

export const deleteBannerAction = async (id: string) => {
  try {
    const response = await api.delete(
      `/api/v1/erp/settings/ecom-web/banners/${id}`,
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

// ============ PROMOTIONS ACTIONS ============

export const addPromotionAction = async (data: FormData) => {
  try {
    const response = await api.post(
      "/api/v1/erp/settings/ecom-web/promotions",
      data,
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

export const getPromotionsAction = async () => {
  try {
    const response = await api.get("/api/v1/erp/settings/ecom-web/promotions");
    return response.data;
  } catch (e: unknown) {
    const err = e as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    throw new Error(err.response?.data?.message ?? err.message);
  }
};

export const deletePromotionAction = async (id: string) => {
  try {
    const response = await api.delete(
      `/api/v1/erp/settings/ecom-web/promotions/${id}`,
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

// ============ NAVIGATION ACTIONS ============

export const getNavigationAction = async () => {
  try {
    const response = await api.get("/api/v1/erp/settings/ecom-web/navigation");
    return response.data;
  } catch (e: unknown) {
    const err = e as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    throw new Error(err.response?.data?.message ?? err.message);
  }
};

export const saveNavigationAction = async (data: unknown) => {
  try {
    const response = await api.post(
      "/api/v1/erp/settings/ecom-web/navigation",
      data,
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
