import { useBottomNavStore } from "../model/bottom-nav.store";

import { useAction } from "@features/actions";

const BottomNav = () => {
  const { getHookByKey } = useAction();
  const bottomNavigation = useBottomNavStore((state) => state.bottomNavigation);

  return (
    <div className="pointer-events-auto fixed bottom-12 left-1/2 flex -translate-x-1/2 flex-row gap-2 rounded-3xl bg-gray-900 p-2 opacity-90">
      {bottomNavigation.map((key) => {
        const { title, icon, handleClick } = getHookByKey(key);

        return (
          <div key={key} className="group relative">
            <button
              className="flex h-8 w-8 items-center justify-center rounded-2xl bg-gray-700 hover:bg-gray-300 [&>svg]:h-5 [&>svg]:w-5"
              onClick={handleClick}
            >
              {icon}
            </button>

            <div className="pointer-events-none absolute bottom-12 left-1/2 -translate-x-1/2 rounded-md bg-black px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-90 after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-6 after:border-transparent after:border-t-black">
              {title}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BottomNav;
