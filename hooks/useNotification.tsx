import { Toast, ToastTitle, useToast } from "@/components/ui/toast";
import React, { createContext, ReactNode, useContext } from "react";

// Create the notification context
interface NotificationContextType {
  showNotification: (
    message?: string,
    action?: "error" | "warning" | "success"
  ) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

// Provider component
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const toast = useToast();

  const showNewToast = (
    message = "",
    action: "error" | "warning" | "success" = "success"
  ) => {
    const newId = Math.random();

    toast.show({
      id: newId.toString(),
      placement: "top",
      duration: 5000,
      render: ({ id }) => {
        const uniqueToastId = "toast-" + id;
        return (
          <Toast nativeID={uniqueToastId} action={action} variant="solid">
            <ToastTitle>{message}</ToastTitle>
          </Toast>
        );
      },
    });
  };

  return (
    <NotificationContext.Provider value={{ showNotification: showNewToast }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to use the notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }

  return context;
};

// Global notification function that can be called from anywhere
let globalNotificationFunction:
  | ((message: string, action: "error" | "warning" | "success") => void)
  | null = null;

export const setGlobalNotificationFunction = (
  fn: (message: string, action: "error" | "warning" | "success") => void
) => {
  globalNotificationFunction = fn;
};

export const showGlobalNotification = (
  message: string,
  action: "error" | "warning" | "success" = "error"
) => {
  if (globalNotificationFunction) {
    globalNotificationFunction(message, action);
  }
};
