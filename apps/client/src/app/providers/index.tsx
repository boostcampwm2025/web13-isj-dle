import { ActionProvider } from "@src/features/actions";
import { PhaserProvider } from "@src/shared/lib/phaser/model/PhaserProvider";
import { WebSocketProvider } from "@src/shared/lib/websocket";

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
