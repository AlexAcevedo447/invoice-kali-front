import type { PropsWithChildren } from 'react'
import { ApplicationProvider } from '../application/ApplicationContext';
import { createDefaultApplication } from '../application/Application';
import { configureAuthSessionStore } from '../state/authSessionStore';
import { configureInvoicingStore } from '../state/invoicingStore';
import { GlobalToastProvider } from '../../shared/ui/GlobalToast';

const application = createDefaultApplication()

configureAuthSessionStore(application.authContext)
configureInvoicingStore(application.invoicing)

export const AppProviders = ({ children }: PropsWithChildren) => {
    return (
        <GlobalToastProvider>
            <ApplicationProvider application={application}>{children}</ApplicationProvider>
        </GlobalToastProvider>
    );
}
