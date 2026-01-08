import { UserProvider } from "../entities/user/model/UserProvider";
import { WebSocketProvider } from "../shared/lib/websocket";
import { Sidebar } from "../widgets/Sidebar";
import { SidebarProvider } from "../widgets/Sidebar/model/SidebarProvider";
import { PhaserProvider } from "./providers/PhaserProvider";
import "./styles/index.css";

function App() {
  return (
    <WebSocketProvider>
      <UserProvider>
        <SidebarProvider>
          <PhaserProvider>
            <Sidebar />
            {/* UI 레이어 추가 (HUD, Menu 등) */}
          </PhaserProvider>
        </SidebarProvider>
      </UserProvider>
    </WebSocketProvider>
  );
}

export default App;
