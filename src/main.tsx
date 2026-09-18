import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import { HabitProvider } from './context/HabitContext';
import { UpdateProvider } from './context/UpdateContext';
import { ToastProvider } from './context/ToastContext';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <UpdateProvider>
        <AuthProvider>
          <HabitProvider>
            <App />
          </HabitProvider>
        </AuthProvider>
      </UpdateProvider>
    </ToastProvider>
  </React.StrictMode>
);
