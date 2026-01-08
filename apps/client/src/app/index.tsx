import { Sidebar } from "../widgets/sidebar";
import Providers from "./providers";
import "./styles/index.css";

import PhaserLayout from "@src/shared/lib/phaser/ui/PhaserLayout";

function App() {
  return (
    <Providers>
      <PhaserLayout>
        <Sidebar />
        {/* UI 레이어 추가 (HUD, Menu 등) */}
      </PhaserLayout>
    </Providers>
  );
}

export default App;
