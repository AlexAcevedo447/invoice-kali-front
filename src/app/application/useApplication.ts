import { useContext } from "react";

import type { ApplicationServices } from "./Application";
import { ApplicationContext } from "./ApplicationContextStore";

export const useApplication = (): ApplicationServices => {
  const application = useContext(ApplicationContext);

  if (!application) {
    throw new Error("ApplicationProvider is missing in component tree");
  }

  return application;
};
