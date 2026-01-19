import { MuteAllButton } from "./MuteAllButton";
import { Users } from "lucide-react";

const HostSidebar = () => {
  return (
    <div className="flex h-full w-full flex-col gap-4">
      {/* 참가자 관리 섹션 */}
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-700">참가자 관리</h3>
        </div>
        <div className="flex flex-col gap-3">
          <MuteAllButton />
        </div>
      </section>
    </div>
  );
};

export default HostSidebar;
