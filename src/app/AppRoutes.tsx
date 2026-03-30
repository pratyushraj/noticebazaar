import { Routes } from "react-router-dom";
import { SessionContextProvider } from "@/contexts/SessionContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import AddToHomeScreen from "@/components/mobile/AddToHomeScreen";
import { PublicRoutes } from "./routes/publicRoutes";
import { ClientRoutes } from "./routes/clientRoutes";
import { CreatorRoutes } from "./routes/creatorRoutes";
import { BrandRoutes } from "./routes/brandRoutes";

export default function AppRoutes() {
  return (
    <SessionContextProvider>
      <SidebarProvider>
        <Routes>
          <PublicRoutes />
          <ClientRoutes />
          <CreatorRoutes />
          <BrandRoutes />
        </Routes>
        <AddToHomeScreen />
      </SidebarProvider>
    </SessionContextProvider>
  );
}
