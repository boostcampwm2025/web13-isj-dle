import Providers from "./providers";
import "./styles/index.css";

import PhaserLayout from "@shared/lib/phaser/ui/PhaserLayout";
import { BottomNav } from "@widgets/bottom-nav";
import { Sidebar } from "@widgets/sidebar";

function App() {
  return (
    <Providers>
      <PhaserLayout>
        <Sidebar />
        <BottomNav />
        {/* UI 레이어 추가 (HUD, Menu 등) */}
      </PhaserLayout>
    </Providers>
  );
}

export default App;
