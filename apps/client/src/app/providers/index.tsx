import { ActionProvider } from "@features/actions";
import { PhaserProvider } from "@features/game";
import { WebSocketProvider } from "@features/socket";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface ProviderProps {
  children?: React.ReactNode;
}

const queryClient = new QueryClient();

const Providers = ({ children }: ProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <ActionProvider>
          <PhaserProvider>{children}</PhaserProvider>
        </ActionProvider>
      </WebSocketProvider>
    </QueryClientProvider>
  );
};

export default Providers;
