import { Fragment } from "react/jsx-runtime";

import { useVideoConferenceModeStore } from "@entities/video-conference-mode";
import { useActionStore } from "@features/actions";
import { ACTION_KEY_ORDER, type ActionKey, DIVIDER_INDEX } from "@shared/config";

import { useBottomNavStore } from "../model/bottom-nav.store";
import { useBottomNav } from "../model/use-bottom-nav";

const BottomNav = () => {
  const actions = useActionStore((state) => state.actions);
  const { mode, setMode } = useVideoConferenceModeStore();
  useBottomNav(mode, setMode);
  const bottomNavigation = useBottomNavStore((state) => state.bottomNavigation);

  const orderedKeys: ActionKey[] = [...bottomNavigation].sort(
    (a: ActionKey, b: ActionKey) => ACTION_KEY_ORDER[a] - ACTION_KEY_ORDER[b],
  );

  return (
    <div className="pointer-events-auto absolute bottom-12 left-1/2 z-40 flex -translate-x-1/2 flex-row gap-2 rounded-3xl bg-gray-900 p-2 opacity-90">
      {orderedKeys.map((key, index) => {
        const hook = actions[key];
        if (!hook) return null;
        const { title, icon, handleClick } = hook;

        return (
          <Fragment key={key}>
            {ACTION_KEY_ORDER[key] > DIVIDER_INDEX && ACTION_KEY_ORDER[orderedKeys[index - 1]] <= DIVIDER_INDEX && (
              <div className="my-auto h-6 w-px bg-gray-600" />
            )}
            <div className="group relative">
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
          </Fragment>
        );
      })}
    </div>
  );
};

export default BottomNav;
