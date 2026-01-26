import { requestRetrospectiveTemplate } from "../api/retrospective_template.api";

import { useState } from "react";
import toast from "react-hot-toast";

import type { RetrospectiveTemplate } from "@shared/types";

export const useRetrospectiveTemplate = () => {
  const [template, setTemplate] = useState<RetrospectiveTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTemplate = async () => {
    setError(null);
    setTemplate(null);
    try {
      const response = await requestRetrospectiveTemplate();
      setTemplate(response.template);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    }
  };

  const resetTemplate = () => {
    setTemplate(null);
    setError(null);
  };

  const handleCopy = () => {
    if (template) {
      navigator.clipboard.writeText(template.content.trim());
      toast("템플릿 내용이 복사되었습니다!", { icon: "📋" });
    }
  };

  return { handleTemplate, template, error, resetTemplate, handleCopy };
};
