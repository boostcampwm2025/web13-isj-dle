import { UserProvider } from "@src/entities/user/model/UserProvider";
import { ActionProvider } from "@src/features/actions";
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
          <ActionProvider>
            <BottomNavProvider>
              <PhaserProvider>{children}</PhaserProvider>
            </BottomNavProvider>
          </ActionProvider>
        </SidebarProvider>
      </WebSocketProvider>
    </UserProvider>
  );
};

export default Providers;
