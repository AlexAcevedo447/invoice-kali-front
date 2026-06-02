import App from '@/App.tsx'
import { AppProviders } from '@app/providers/AppProviders.tsx'

export const AppBootstrap = () => {
    return (
        <AppProviders>
            <App />
        </AppProviders>
    )
}
