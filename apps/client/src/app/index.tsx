import Sidebar from "../widgets/Sidebar";
import { SidebarProvider } from "../widgets/Sidebar/model/SidebarProvider";
import { PhaserProvider } from "./providers/PhaserProvider";
import "./styles/index.css";

function App() {
  return (
    <SidebarProvider>
      <PhaserProvider>
        <Sidebar />
        {/* UI 레이어 추가 (HUD, Menu 등) */}
      </PhaserProvider>
    </SidebarProvider>
  );
}

export default App;
