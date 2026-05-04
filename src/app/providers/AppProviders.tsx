import type { PropsWithChildren } from 'react'
import { ApplicationProvider, createDefaultApplication } from '@app/application'
import {
    configureAuthSessionStore,
    configureInvoicingStore,
} from '@app/state'

const application = createDefaultApplication()

configureAuthSessionStore(application.authContext)
configureInvoicingStore(application.invoicing)

export const AppProviders = ({ children }: PropsWithChildren) => {
    return <ApplicationProvider application={application}>{children}</ApplicationProvider>
}
