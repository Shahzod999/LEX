import { createContext, useContext } from 'react';

// Define the shape of the auth context
type AuthContextType = {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
};

// Create the context with a default value
export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

// Create a hook to use the auth context
export const useAuth = () => useContext(AuthContext); 