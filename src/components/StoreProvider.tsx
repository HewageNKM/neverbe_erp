// StoreProvider is no longer needed - Redux is initialized in main.tsx
// This file is kept for backward compatibility if components still import it
import { ReactNode } from "react";

const StoreProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

export default StoreProvider;
