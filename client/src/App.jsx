import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './app/routes.jsx';
import { AuthProvider } from './features/auth/AuthProvider.jsx';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
