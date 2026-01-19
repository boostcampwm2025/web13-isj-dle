import { MuteAllButton } from "./MuteAllButton";

const HostSidebar = () => {
  return (
    <div className="flex h-full w-full flex-col gap-4 p-2">
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-gray-600">참가자 관리</h3>
        <MuteAllButton />
      </section>
    </div>
  );
};

export default HostSidebar;
