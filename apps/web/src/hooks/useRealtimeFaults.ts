import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socket } from '../lib/socket';
import { toast } from 'react-hot-toast';

export const useRealtimeFaults = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    socket.on('fault:new', (data: any) => {
      toast.error(`New Critical Fault: ${data.asset_tag}`, {
        duration: 5000,
        position: 'top-right',
      });
      queryClient.invalidateQueries({ queryKey: ['faults'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    });

    socket.on('fault:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['faults'] });
    });

    return () => {
      socket.off('fault:new');
      socket.off('fault:updated');
    };
  }, [queryClient]);
};
