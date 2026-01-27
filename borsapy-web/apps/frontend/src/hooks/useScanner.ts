"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { scannerApi, ScanRequest, ScanResult } from "@/lib/api";

export function usePresets() {
  return useQuery({
    queryKey: ["scanner", "presets"],
    queryFn: scannerApi.getPresets,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useIndicators() {
  return useQuery({
    queryKey: ["scanner", "indicators"],
    queryFn: scannerApi.getIndicators,
    staleTime: 10 * 60 * 1000,
  });
}

export function useUniverses() {
  return useQuery({
    queryKey: ["scanner", "universes"],
    queryFn: scannerApi.getUniverses,
    staleTime: 10 * 60 * 1000,
  });
}

export function useIntervals() {
  return useQuery({
    queryKey: ["scanner", "intervals"],
    queryFn: scannerApi.getIntervals,
    staleTime: 10 * 60 * 1000,
  });
}

export function useScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ScanRequest) => scannerApi.run(request),
    onSuccess: (data: ScanResult, variables: ScanRequest) => {
      // Cache the results with conditions as key
      queryClient.setQueryData(
        ["scanner", "results", variables.conditions.join("|"), variables.universe, variables.interval],
        data
      );
    },
  });
}
