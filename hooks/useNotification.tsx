import { Toast, ToastTitle, useToast } from "@/components/ui/toast";

export const useNotification = () => {
  const toast = useToast();
  const showNewToast = (
    message = "",
    action: "error" | "warning" | "success" = "success"
  ) => {
    const newId = Math.random();

    toast.show({
      id: newId.toString(),
      placement: "top",
      duration: 3000,
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

  return {
    showNotification: showNewToast,
  };
};
