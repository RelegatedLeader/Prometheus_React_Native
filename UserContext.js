import { createContext, useContext } from "react";

// Create a context for user hash
const UserContext = createContext();

// Export a hook to access the user context
export const useUser = () => useContext(UserContext);

// Export the context for the provider
export default UserContext;
