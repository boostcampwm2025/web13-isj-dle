import { BreakoutPanel } from "./BreakoutPanel";
import { MuteAllButton } from "./MuteAllButton";
import { Blocks, Users } from "lucide-react";

export const HostSidebar = () => {
  return (
    <div className="flex h-full w-full flex-col gap-4">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-700">참가자 관리</h3>
        </div>
        <div className="flex flex-col gap-3">
          <MuteAllButton />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Blocks className="h-4 w-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-700">책상 나누기</h3>
        </div>
        <BreakoutPanel />
      </section>
    </div>
  );
};
