import type { PropsWithChildren } from "react";

import type { ApplicationServices } from "./Application";
import { ApplicationContext } from "./ApplicationContextStore";

interface ApplicationProviderProps extends PropsWithChildren {
    application: ApplicationServices;
}

export const ApplicationProvider = ({
    application,
    children,
}: ApplicationProviderProps) => (
    <ApplicationContext.Provider value={{ ...application }}>
        {children}
    </ApplicationContext.Provider>
);
