import { Routes } from "react-router-dom";
import { SessionContextProvider } from "@/contexts/SessionContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import AddToHomeScreen from "@/components/mobile/AddToHomeScreen";
import { PublicRoutes } from "./routes/publicRoutes";
import { SharedRoutes } from "./routes/sharedRoutes";
import { ClientRoutes } from "./routes/clientRoutes";
import { CreatorRoutes } from "./routes/creatorRoutes";
import { BrandRoutes } from "./routes/brandRoutes";
import { AdminRoutes } from "./routes/adminRoutes";
import { AdvisorRoutes } from "./routes/advisorRoutes";
import { ReactivationRoutes } from "./routes/reactivationRoutes";

export default function AppRoutes() {
  return (
    <SessionContextProvider>
      <SidebarProvider>
        <Routes>
          {PublicRoutes()}
          {SharedRoutes()}
          {ClientRoutes()}
          {CreatorRoutes()}
          {BrandRoutes()}
          {AdminRoutes()}
          {AdvisorRoutes()}
          {ReactivationRoutes()}
        </Routes>
        <AddToHomeScreen />
      </SidebarProvider>
    </SessionContextProvider>
  );
}
