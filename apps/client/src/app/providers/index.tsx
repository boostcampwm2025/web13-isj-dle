import { UserProvider } from "@src/entities/user/model/UserProvider";
import { PhaserProvider } from "@src/shared/lib/phaser/model/PhaserProvider";
import { WebSocketProvider } from "@src/shared/lib/websocket";
import { BottomNavProvider } from "@src/widgets/bottom-nav";
import { SidebarProvider } from "@src/widgets/sidebar";

interface ProviderProps {
  children?: React.ReactNode;
}

const Providers = ({ children }: ProviderProps) => {
  return (
    <UserProvider>
      <WebSocketProvider>
        <SidebarProvider>
          <BottomNavProvider>
            <PhaserProvider>{children}</PhaserProvider>
          </BottomNavProvider>
        </SidebarProvider>
      </WebSocketProvider>
    </UserProvider>
  );
};

export default Providers;
