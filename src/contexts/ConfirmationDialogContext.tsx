
import { createContext, useContext, ReactNode } from "react";
import { Modal } from "antd";
import {
  IconAlertTriangle,
  IconInfoCircle,
  IconBan,
} from "@tabler/icons-react";

type ConfirmationDialogOptions = {
  title?: string;
  message: string;
  onSuccess?: () => void;
  onClose?: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "default";
};

type ConfirmationDialogContextType = {
  showConfirmation: (options: ConfirmationDialogOptions) => void;
};

const ConfirmationDialogContext = createContext<
  ConfirmationDialogContextType | undefined
>(undefined);

export const ConfirmationDialogProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [modal, contextHolder] = Modal.useModal();

  const showConfirmation = (options: ConfirmationDialogOptions) => {
    const {
      title,
      message,
      onSuccess,
      onClose,
      confirmText = "Confirm",
      cancelText = "Cancel",
      variant = "default",
    } = options;

    let icon = <IconInfoCircle size={24} className="text-blue-500" />;
    let okType: "primary" | "danger" | "dashed" | "link" | "text" | "default" =
      "primary";
    let okButtonProps = {};

    if (variant === "danger") {
      icon = <IconBan size={24} className="text-red-500" />;
      okType = "danger";
      okButtonProps = { danger: true, className: "bg-red-600" };
    } else if (variant === "warning") {
      icon = <IconAlertTriangle size={24} className="text-amber-500" />;
      // AntD doesn't have a 'warning' button type, usually use default or danger.
      okButtonProps = {
        className:
          "bg-amber-500 hover:bg-amber-600 border-amber-500 text-white",
      };
    }

    modal.confirm({
      title: title || "Are you sure?",
      icon: icon,
      content: message,
      okText: confirmText,
      cancelText: cancelText,
      okType,
      okButtonProps,
      onOk: () => {
        onSuccess?.();
      },
      onCancel: () => {
        onClose?.();
      },
      centered: true,
    });
  };

  return (
    <ConfirmationDialogContext.Provider value={{ showConfirmation }}>
      {contextHolder}
      {children}
    </ConfirmationDialogContext.Provider>
  );
};

export const useConfirmationDialog = () => {
  const context = useContext(ConfirmationDialogContext);
  if (!context) {
    throw new Error(
      "useConfirmationDialog must be used within a ConfirmationDialogProvider",
    );
  }
  return context;
};
