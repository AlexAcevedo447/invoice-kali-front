import { createContext } from "react";

import type { ApplicationServices } from "./Application";

export const ApplicationContext = createContext<ApplicationServices | null>(
  null,
);
