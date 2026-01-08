import { UserProvider } from "@src/entities/user/model/UserProvider";
import { PhaserProvider } from "@src/shared/lib/phaser/model/PhaserProvider";
import { WebSocketProvider } from "@src/shared/lib/websocket";
import { SidebarProvider } from "@src/widgets/sidebar";

interface ProviderProps {
  children?: React.ReactNode;
}

const Providers = ({ children }: ProviderProps) => {
  return (
    <UserProvider>
      <WebSocketProvider>
        <SidebarProvider>
          <PhaserProvider>{children}</PhaserProvider>
        </SidebarProvider>
      </WebSocketProvider>
    </UserProvider>
  );
};

export default Providers;
