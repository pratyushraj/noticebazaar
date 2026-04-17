import { lazy } from "react";
import { Route } from "react-router-dom";
import ProtectedLayout from "@/components/ProtectedLayout";
import { LazyRoute } from "./routeElements";

const MessagesRoute = lazy(() => import("@/pages/MessagesRoute"));

export const SharedRoutes = () => (
  <>
    <Route
      path="/messages"
      element={
        <LazyRoute>
          <ProtectedLayout allowedRoles={["creator", "brand", "admin", "lawyer", "chartered_accountant", "client"]}>
            <MessagesRoute />
          </ProtectedLayout>
        </LazyRoute>
      }
    />
    <Route
      path="/messages/:conversationId"
      element={
        <LazyRoute>
          <ProtectedLayout allowedRoles={["creator", "brand", "admin", "lawyer", "chartered_accountant", "client"]}>
            <MessagesRoute />
          </ProtectedLayout>
        </LazyRoute>
      }
    />
  </>
);

