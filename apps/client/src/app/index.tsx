import { TestWebSocket } from "./TestWebSocket";
import { PhaserProvider } from "./providers/PhaserProvider";
import { WebSocketProvider } from "./providers/WebSocketProvider";
import "./styles/index.css";

function App() {
  return (
    <WebSocketProvider>
      <PhaserProvider>
        <TestWebSocket />
        {/* 향후 UI 레이어 추가 (HUD, Menu 등) */}
      </PhaserProvider>
    </WebSocketProvider>
  );
}

export default App;
