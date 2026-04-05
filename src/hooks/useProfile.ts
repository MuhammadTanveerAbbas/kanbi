'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch('/api/profile')
      if (!res.ok) throw new Error('Failed to fetch profile')
      return res.json()
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

export function useUsage() {
  return useQuery({
    queryKey: ['usage'],
    queryFn: async () => {
      const res = await fetch('/api/usage')
      if (!res.ok) throw new Error('Failed to fetch usage')
      return res.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useTaskStats() {
  return useQuery({
    queryKey: ['task-stats'],
    queryFn: async () => {
      const res = await fetch('/api/task-stats')
      if (!res.ok) throw new Error('Failed to fetch task stats')
      return res.json()
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (full_name: string) => {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name }),
      })
      if (!res.ok) throw new Error('Failed to update profile')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}
