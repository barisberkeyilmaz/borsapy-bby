"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { screenerApi, ScreenerRequest, ScreenerResult } from "@/lib/api";

export function useTemplates() {
  return useQuery({
    queryKey: ["screener", "templates"],
    queryFn: screenerApi.getTemplates,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTemplateResults(templateName: string | null) {
  return useQuery({
    queryKey: ["screener", "results", templateName],
    queryFn: () => screenerApi.runTemplate(templateName!),
    enabled: !!templateName,
    refetchInterval: 60 * 1000, // Poll every 60 seconds
  });
}

export function useCriteria() {
  return useQuery({
    queryKey: ["screener", "criteria"],
    queryFn: screenerApi.getCriteria,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useSectors() {
  return useQuery({
    queryKey: ["screener", "sectors"],
    queryFn: screenerApi.getSectors,
    staleTime: 10 * 60 * 1000,
  });
}

export function useIndices() {
  return useQuery({
    queryKey: ["screener", "indices"],
    queryFn: screenerApi.getIndices,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCustomScreener() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ScreenerRequest) => screenerApi.runCustom(request),
    onSuccess: (data) => {
      queryClient.setQueryData(["screener", "results", "custom"], data);
    },
  });
}
