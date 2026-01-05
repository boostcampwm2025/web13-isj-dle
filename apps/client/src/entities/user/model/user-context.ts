import type { UserContextType } from "./user.types";

import { createContext } from "react";

export const UserContext = createContext<UserContextType | undefined>(undefined);
