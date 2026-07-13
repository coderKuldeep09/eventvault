import { Navigate, useParams } from "react-router-dom";
import { getSession, getEventBySlug } from "../lib/store";

/**
 * Guards organiser-only routes.
 *
 * roleRequired: only lets that role through (others get sent home).
 * checkEventOwnership: for routes with a :slug param — also verifies the
 * event actually belongs to the logged-in organiser, so one organiser
 * can't manage another's event just by typing in their slug.
 */
export default function ProtectedRoute({ children, roleRequired, checkEventOwnership = false }) {
  const session = getSession();
  const { slug } = useParams();

  if (!session || !session.role) {
    return <Navigate to={roleRequired === "organiser" ? "/organiser" : "/login"} replace />;
  }

  if (roleRequired && session.role !== roleRequired) {
    return <Navigate to="/" replace />;
  }

  if (checkEventOwnership && slug) {
    const event = getEventBySlug(slug);
    if (!event || event.organiserId !== session.organiserId) {
      return <Navigate to="/organiser/dashboard" replace />;
    }
  }

  return children;
}
