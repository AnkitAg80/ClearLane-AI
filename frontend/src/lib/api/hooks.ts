import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './endpoints';
import { qk } from './queryKeys';
import { useFilterStore } from '../../stores/useFilterStore';
import type { OfficerBudget } from '../../types/api';

// Derived filter object for react-query
export function useActiveFilters() {
  const { station, minSupport, query, selectedH3 } = useFilterStore();
  return {
    station: station || undefined,
    min_support: minSupport > 0 ? minSupport / 100 : undefined,
    query: query || undefined,
    h3: selectedH3 || undefined,
  };
}

export function useOverview() {
  return useQuery({
    queryKey: qk.overview,
    queryFn: api.overview,
  });
}

export function useHealth() {
  return useQuery({
    queryKey: qk.health,
    queryFn: api.health,
  });
}

export function useConfig() {
  return useQuery({
    queryKey: qk.config,
    queryFn: api.config,
  });
}

export function useMapData() {
  const filters = useActiveFilters();
  return useQuery({
    queryKey: qk.map(filters),
    queryFn: () => api.map(filters),
    placeholderData: (prev) => prev,
  });
}

export function useHotspots() {
  const filters = useActiveFilters();
  return useQuery({
    queryKey: qk.hotspots(filters),
    queryFn: () => api.hotspots(filters),
    placeholderData: (prev) => prev,
  });
}

export function useHotspotDetail(h3: string | null) {
  return useQuery({
    queryKey: qk.hotspot(h3 || ''),
    queryFn: () => api.hotspotDetail(h3!),
    enabled: !!h3,
  });
}

export function useDeployment() {
  return useQuery({
    queryKey: qk.deployment,
    queryFn: api.deployment,
  });
}

export function useIntelligence() {
  const filters = useActiveFilters();
  return useQuery({
    queryKey: qk.intelligence(filters),
    queryFn: () => api.intelligence(filters),
    placeholderData: (prev) => prev,
  });
}

export function useTimeline() {
  const filters = useActiveFilters();
  return useQuery({
    queryKey: qk.timeline(filters),
    queryFn: () => api.timeline(filters),
    placeholderData: (prev) => prev,
  });
}

export function useMissions() {
  const filters = useActiveFilters();
  return useQuery({
    queryKey: qk.missions(filters),
    queryFn: () => api.missions(filters),
    placeholderData: (prev) => prev,
  });
}

export function useEvidence() {
  return useQuery({
    queryKey: qk.evidence,
    queryFn: api.evidence,
  });
}

export function useArtifacts() {
  return useQuery({
    queryKey: qk.artifacts,
    queryFn: api.artifacts,
    refetchInterval: 30000,
  });
}

export function useFeatureImportance() {
  return useQuery({
    queryKey: qk.featureImportance,
    queryFn: api.featureImportance,
  });
}

export function useOptimizeMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (budget: OfficerBudget) => api.optimize(budget),
    onSuccess: () => {
      // Invalidate all dependent queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['overview'] });
      queryClient.invalidateQueries({ queryKey: ['map'] });
      queryClient.invalidateQueries({ queryKey: ['hotspots'] });
      queryClient.invalidateQueries({ queryKey: ['deployment'] });
      queryClient.invalidateQueries({ queryKey: ['intelligence'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });
}
