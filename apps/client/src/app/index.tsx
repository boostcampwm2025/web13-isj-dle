import Providers from "./providers";
import "./styles/index.css";

import { RoomPage } from "@pages/room";
import { Toast } from "@shared/ui";

const App = () => {
  return (
    <Providers>
      <Toast />
      <RoomPage />
    </Providers>
  );
};

export default App;
