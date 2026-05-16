import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export const useAssets = (filters: any = {}) => {
  return useQuery({
    queryKey: ['assets', filters],
    queryFn: async () => {
      const { data } = await axios.get('/api/assets', { params: filters });
      return data;
    },
  });
};

export const useAsset = (id: string) => {
  return useQuery({
    queryKey: ['asset', id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/assets/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newAsset: any) => {
      const { data } = await axios.post('/api/assets', newAsset);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};
