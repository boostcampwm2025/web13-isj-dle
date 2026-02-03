import { authApi } from "@entities/auth";
import { Banner, GitHub } from "@shared/assets";

const LoginPage = () => {
  const loginWithGithub = () => authApi.loginWithGithub();

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-100 via-blue-100 to-indigo-100">
      <div className="w-full">
        <Banner className="w-full" />
      </div>

      <div className="mx-auto mt-10 flex max-w-md flex-col items-center text-center">
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-gray-900">로그인이 필요합니다</h1>
        <p className="mb-8 text-sm text-gray-700">GitHub 계정으로 간편하게 시작하세요</p>

        <button
          onClick={loginWithGithub}
          className="flex items-center gap-3 rounded-full bg-gray-900 px-7 py-3.5 font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-gray-800 active:scale-[0.98]"
        >
          <GitHub className="h-5 w-5" />
          GitHub로 로그인
        </button>

        <p className="mt-6 text-xs text-gray-600">로그인 시 서비스 이용에 필요한 최소 정보만 사용합니다</p>
      </div>
    </div>
  );
};

export default LoginPage;
