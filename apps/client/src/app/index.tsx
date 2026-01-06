import Sidebar from "../widgets/Sidebar";
import { SidebarProvider } from "../widgets/Sidebar/model/SidebarProvider";
import { PhaserProvider } from "./providers/PhaserProvider";
import "./styles/index.css";

function App() {
  return (
    <PhaserProvider>
      <SidebarProvider>
        <Sidebar />
        {/* UI 레이어 추가 (HUD, Menu 등) */}
      </SidebarProvider>
    </PhaserProvider>
  );
}

export default App;
