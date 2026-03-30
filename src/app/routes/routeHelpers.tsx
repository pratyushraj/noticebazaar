import { lazy, useEffect } from "react";
import { Navigate, useParams, useSearchParams } from "react-router-dom";

const CreatorDashboard = lazy(() => import("@/pages/CreatorDashboard"));

export const ContractReadyRedirect = () => {
  const { token } = useParams<{ token: string }>();
  return <Navigate to={`/contract-ready/${token}`} replace />;
};

export const CreatorContractDashboardRoute = () => {
  const { dealId } = useParams<{ dealId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", "collabs");
    next.set("subtab", "active");
    if (dealId) next.set("dealId", dealId);
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [dealId, searchParams, setSearchParams]);

  return <CreatorDashboard />;
};
