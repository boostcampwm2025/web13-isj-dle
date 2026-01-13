import Providers from "./providers";
import "./styles/index.css";

import PhaserLayout from "@shared/lib/phaser/ui/PhaserLayout";
import { BottomNav } from "@widgets/bottom-nav";
import { Sidebar } from "@widgets/sidebar";
import { VideoRoomWidget } from "@widgets/video-conference/ui/VideoRoomWidget";

function App() {
  return (
    <Providers>
      <PhaserLayout>
        <Sidebar />
        <BottomNav />
        {/* UI 레이어 추가 (HUD, Menu 등) */}
      </PhaserLayout>
      <VideoRoomWidget />
    </Providers>
  );
}

export default App;
