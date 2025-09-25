import React from 'react';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './components/AppRoutes.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';

function App() {
  console.log("App.jsx: App component has started to render.");
  // Odstranili jsme nadbytečný <BrowserRouter> odtud,
  // protože hlavní router je již v souboru `main.jsx`.
  return (
    <AuthProvider>
      <Toaster position="top-center" reverseOrder={false} />
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;

