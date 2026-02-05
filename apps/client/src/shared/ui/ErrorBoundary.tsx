import { isRouteErrorResponse, useRouteError } from "react-router-dom";

import { Banner } from "@shared/assets";

const ErrorBoundary = () => {
  const error = useRouteError();

  let errorMessage = "알 수 없는 오류가 발생했습니다";
  let errorStack = "";

  if (isRouteErrorResponse(error)) {
    errorMessage = `${error.status} ${error.statusText}`;
    errorStack = error.data?.message || error.data || "";
  } else if (error instanceof Error) {
    errorMessage = error.message;
    errorStack = error.stack || "";
  } else {
    errorMessage = String(error);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4">
      <Banner className="mb-4" />
      <div className="max-w-2xl rounded-lg bg-gray-800 p-6 text-center text-red-300 shadow-xl">
        <div className="mb-4 text-xl font-semibold">페이지 오류가 발생했습니다</div>
        {import.meta.env.VITE_APP_ENV === "development" && (
          <div className="mb-2 text-sm text-gray-400">{errorMessage}</div>
        )}
        {import.meta.env.VITE_APP_ENV === "development" && errorStack && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium">오류 상세 정보</summary>
            <pre className="mt-2 overflow-auto rounded bg-gray-900 p-3 text-start text-xs whitespace-pre-wrap">
              {errorStack}
            </pre>
          </details>
        )}
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          페이지 새로고침
        </button>
      </div>
    </div>
  );
};

export default ErrorBoundary;
