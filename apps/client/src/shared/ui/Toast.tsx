import { Toaster } from "react-hot-toast";

import { TOAST_DURATION } from "@shared/config";

export const Toast = () => {
  return (
    <Toaster
      position="bottom-right"
      containerStyle={{
        right: 90,
        bottom: 20,
      }}
      toastOptions={{
        duration: TOAST_DURATION,
        style: {
          background: "#ffffff",
          color: "#1f2937",
          border: "1px solid #e5e7eb",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          fontSize: "14px",
        },
      }}
    />
  );
};
