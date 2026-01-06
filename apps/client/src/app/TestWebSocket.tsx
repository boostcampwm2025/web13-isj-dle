import { useWebSocket } from "./providers/use-websocket";

export const TestWebSocket = () => {
  const { socket, isConnected } = useWebSocket();

  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        background: isConnected ? "green" : "red",
        color: "white",
        padding: "10px",
        borderRadius: "5px",
        fontFamily: "monospace",
        fontSize: "12px",
        zIndex: 1000,
      }}
    >
      <div>Socket ID: {socket?.id || "Not connected"}</div>
      <div>Status: {isConnected ? "✅ Connected" : "❌ Disconnected"}</div>
    </div>
  );
};
