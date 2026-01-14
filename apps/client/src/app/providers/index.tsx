import { ActionProvider } from "@features/actions";
import { PhaserProvider } from "@shared/lib/phaser";
import { WebSocketProvider } from "@shared/lib/websocket";

interface ProviderProps {
  children?: React.ReactNode;
}

const Providers = ({ children }: ProviderProps) => {
  return (
    <WebSocketProvider>
      <ActionProvider>
        <PhaserProvider>{children}</PhaserProvider>
      </ActionProvider>
    </WebSocketProvider>
  );
};

export default Providers;
