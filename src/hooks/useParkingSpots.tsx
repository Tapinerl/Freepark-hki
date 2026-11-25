import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { fetchPublishedParking, ParkingQuery } from "@/api/parking";
import { ApiError, isCancellation } from "@/api/client";
import { Pagination, ParkingSpot } from "@/types/parking";

export type ParkingStatus = "idle" | "loading" | "success" | "error";

const ParkingContext = createContext<{
  spots: ParkingSpot[];
  savedSpots: ParkingSpot[];
  status: ParkingStatus;
  error: string;
  pageError: string;
  pagination: Pagination | null;
  loadingMore: boolean;
  search: (query: ParkingQuery) => Promise<void>;
  retry: () => void;
  loadMore: () => void;
  cancel: () => void;
  getSpot: (id: string) => ParkingSpot | undefined;
  toggleFavorite: (id: string) => void;
} | null>(null);
export function ParkingProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<ParkingSpot[]>([]);
  const [favorites, setFavorites] = useState<Record<string, ParkingSpot>>({});
  const [status, setStatus] = useState<ParkingStatus>("idle");
  const [error, setError] = useState("");
  const [pageError, setPageError] = useState("");
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const queryRef = useRef<ParkingQuery | null>(null);
  const request = useRef<{ generation: number; controller: AbortController | null }>({ generation: 0, controller: null });
  const cancelRequest = useCallback(() => {
    request.current.generation++;
    request.current.controller?.abort();
    request.current.controller = null;
  }, []);
  useEffect(() => cancelRequest, [cancelRequest]);

  const search = useCallback(async (query: ParkingQuery) => {
    cancelRequest();
    queryRef.current = { ...query, offset: 0 };
    const generation = request.current.generation;
    const controller = new AbortController();
    request.current.controller = controller;
    setStatus("loading"); setError(""); setPageError(""); setLoadingMore(false);
    setResults([]); setPagination(null);
    try {
      const page = await fetchPublishedParking(queryRef.current, controller.signal);
      if (generation !== request.current.generation) return;
      setResults(page.data); setPagination(page.pagination); setStatus("success");
      // Update saved snapshots only on an exact backend ID match.
      setFavorites((current) => Object.fromEntries(Object.entries(current).map(([id, saved]) => [id, page.data.find((spot) => spot.id === id) ?? saved])));
    } catch (failure) {
      if (generation !== request.current.generation || isCancellation(failure)) return;
      setStatus("error");
      setError(failure instanceof ApiError ? failure.message : "Parking data couldn't be loaded. Please retry.");
    } finally {
      if (generation === request.current.generation) request.current.controller = null;
    }
  }, [cancelRequest]);
  const retry = useCallback(() => { if (queryRef.current) void search(queryRef.current); }, [search]);
  const cancel = useCallback(() => {
    cancelRequest(); setResults([]); setPagination(null); setStatus("idle"); setError(""); setPageError(""); setLoadingMore(false);
  }, [cancelRequest]);
  const loadMore = useCallback(async () => {
    if (!queryRef.current || !pagination || request.current.controller || results.length >= pagination.total || results.length > 10000) return;
    const generation = request.current.generation;
    const controller = new AbortController();
    request.current.controller = controller;
    setLoadingMore(true); setPageError("");
    try {
      const page = await fetchPublishedParking({ ...queryRef.current, offset: results.length }, controller.signal);
      if (generation !== request.current.generation) return;
      // Pages can shift if coverage changes between requests. Ask for a refresh
      // instead of silently duplicating or dropping locations.
      if (page.data.some((spot) => results.some((old) => old.id === spot.id)) || page.pagination.total !== pagination.total) {
        throw new ApiError("Parking coverage changed during paging. Search again to refresh the results.");
      }
      setResults((current) => [...current, ...page.data]); setPagination(page.pagination);
      setFavorites((current) => Object.fromEntries(Object.entries(current).map(([id, saved]) => [id, page.data.find((spot) => spot.id === id) ?? saved])));
    } catch (failure) {
      if (generation !== request.current.generation || isCancellation(failure)) return;
      setPageError(failure instanceof ApiError ? failure.message : "More parking data couldn't be loaded. Please retry.");
    } finally {
      if (generation === request.current.generation) { request.current.controller = null; setLoadingMore(false); }
    }
  }, [pagination, results]);
  const spots = useMemo(() => results.map((spot) => ({ ...spot, isFavorite: Boolean(favorites[spot.id]) })), [results, favorites]);
  const savedSpots = useMemo(() => Object.values(favorites).map((spot) => ({ ...spot, isFavorite: true })), [favorites]);
  function toggleFavorite(id: string) {
    const spot = spots.find((item) => item.id === id);
    setFavorites((current) => {
      if (current[id]) { const next = { ...current }; delete next[id]; return next; }
      // Old placeholder IDs and unknown/deep-linked IDs are never remapped.
      return spot ? { ...current, [id]: spot } : current;
    });
  }
  return (
    <ParkingContext.Provider value={{ spots, savedSpots, status, error, pageError, pagination, loadingMore, search, retry, loadMore, cancel, toggleFavorite, getSpot: (id) => spots.find((spot) => spot.id === id) ?? savedSpots.find((spot) => spot.id === id) }}>
      {children}
    </ParkingContext.Provider>
  );
}
export function useParkingSpots() {
  const value = useContext(ParkingContext);
  if (!value)
    throw new Error("useParkingSpots must be used inside ParkingProvider");
  return value;
}
