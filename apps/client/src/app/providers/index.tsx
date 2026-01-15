import { ActionProvider } from "@features/actions";
import { PhaserProvider } from "@features/game";
import { WebSocketProvider } from "@features/socket";

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
