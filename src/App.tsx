import { RouterProvider } from 'react-router-dom'
import { router } from '@app/routing/AppRouter'

function App() {
  return <RouterProvider router={router} />
}

export default App
