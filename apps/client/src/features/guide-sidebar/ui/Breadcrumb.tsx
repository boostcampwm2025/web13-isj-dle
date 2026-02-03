import { TITLE_ICON_SIZE } from "../model/space.constants";
import { ChevronLeft } from "lucide-react";

interface BreadcrumbProps {
  currentPath: string;
  goPath: (path: string) => void;
  goBack: () => void;
}

const Breadcrumb = ({ currentPath, goPath, goBack }: BreadcrumbProps) => {
  const parts = currentPath.split("/");

  return (
    <div className="mb-3 flex w-full flex-wrap gap-x-1 text-lg font-medium text-gray-600">
      <button
        className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
          parts.length === 1 ? "" : "hover:bg-blue-100 hover:text-blue-800"
        } `}
        disabled={parts.length === 1}
        onClick={goBack}
      >
        <ChevronLeft size={TITLE_ICON_SIZE} />
      </button>
      {parts.map((part, index) => (
        <>
          <button
            className={index === parts.length - 1 ? "" : "hover:text-blue-800 hover:underline"}
            disabled={index === parts.length - 1}
            onClick={() => goPath(parts.slice(0, index + 1).join("/"))}
          >
            {part}
          </button>
          {index < parts.length - 1 && <span>/</span>}
        </>
      ))}
    </div>
  );
};

export default Breadcrumb;
