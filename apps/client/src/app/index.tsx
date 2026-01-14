import Providers from "./providers";
import "./styles/index.css";

import PhaserLayout from "@shared/lib/phaser/ui/PhaserLayout";
import { VideoConference } from "@widgets/video-conference";

function App() {
  return (
    <Providers>
      <PhaserLayout>
        <VideoConference />
        {/* UI 레이어 추가 (HUD, Menu 등) */}
      </PhaserLayout>
    </Providers>
  );
}

export default App;
