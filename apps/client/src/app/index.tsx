import Providers from "./providers";
import "./styles/index.css";

import { RoomPage } from "@pages/room";

const App = () => {
  return (
    <Providers>
      <RoomPage />
    </Providers>
  );
};

export default App;
