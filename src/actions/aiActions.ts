import api from "@/lib/api";

export type ChatMessage = {
  role: "user" | "model";
  parts: [{ text: string }];
};

export const sendAIChatMessage = async (
  contextData: Record<string, unknown>,
  messages: ChatMessage[],
): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("data", JSON.stringify({ contextData, messages }));
    const response = await api.post("/api/v1/erp/ai/chat", formData);
    return response.data.data.text as string;
  } catch (e: unknown) {
    const err = e as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    throw new Error(
      err.response?.data?.message ?? err.message ?? "AI chat failed",
    );
  }
};

export type GenerateDescriptionInput = {
  name: string;
  category?: string;
  brand?: string;
  gender?: string[];
  tags?: string[];
};

export const generateProductDescription = async (
  input: GenerateDescriptionInput,
): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("data", JSON.stringify(input));
    const response = await api.post(
      "/api/v1/erp/ai/generate-description",
      formData,
    );
    return response.data.data.description as string;
  } catch (e: unknown) {
    const err = e as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    throw new Error(
      err.response?.data?.message ??
        err.message ??
        "Description generation failed",
    );
  }
};
