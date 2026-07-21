'use client';

import React, { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useIdentityStore } from '@/store/useIdentityStore';
import toast from 'react-hot-toast';

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const wsRef = useRef<WebSocket | null>(null);
  const addNotification = useIdentityStore(state => state.addNotification);

  useEffect(() => {
    if (!address) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    // Connect to global event bus via WebSocket
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace('http://', 'ws://').replace('https://', 'wss://') || 'ws://127.0.0.1:8001';
    const wsUrl = `${backendUrl}/api/ws/dashboard/${address}`;
    
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log(`[Event Bus] Connected to real-time engine for ${address}`);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'notification' || payload.event === 'notification') {
             addNotification({
               type: 'SYSTEM',
               message: payload.message || payload.data?.message || 'System Notification',
             });
             toast(payload.message || payload.data?.message, { icon: '⚡' });
          } else if (payload.type === 'ping') {
             ws.send(JSON.stringify({ type: 'pong' }));
          }
        } catch (e) {
          console.error('[Event Bus] Error parsing message', e);
        }
      };

      ws.onclose = () => {
        console.log('[Event Bus] Disconnected. Reconnecting in 5s...');
        reconnectTimer = setTimeout(connect, 5000);
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [address, addNotification]);

  return <>{children}</>;
}
