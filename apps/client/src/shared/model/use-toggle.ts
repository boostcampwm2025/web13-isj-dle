import { useCallback, useState } from "react";

export const useToggle = (initialValue = false) => {
  const [isOpen, setIsOpen] = useState(initialValue);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    toggle,
    open,
    close,
    setIsOpen,
  };
};
