import Providers from "./providers";
import "./styles/index.css";

import { TimerStopwatchNotifier } from "@features/timer-stopwatch-sidebar";
import { RoomPage } from "@pages/room";
import { Toast } from "@shared/ui";

const App = () => {
  return (
    <Providers>
      <Toast />
      <TimerStopwatchNotifier />
      <RoomPage />
    </Providers>
  );
};

export default App;
