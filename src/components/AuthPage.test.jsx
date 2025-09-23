import React from 'react';
import { render, screen } from '@testing-library/react';
import AuthPage from './AuthPage';

// Mock pro i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

test('renders login and registration buttons', () => {
  render(<AuthPage />);
  
  const loginButton = screen.getByText(/auth.login/i);
  const registerButton = screen.getByText(/auth.register/i);
  
  expect(loginButton).toBeInTheDocument();
  expect(registerButton).toBeInTheDocument();
});
