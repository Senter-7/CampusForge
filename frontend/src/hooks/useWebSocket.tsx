import { useEffect, useRef, useState, useCallback } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getToken } from '../utils/auth';

interface UseWebSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

export function useWebSocket(options?: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<Client | null>(null);

  const connect = useCallback(() => {
    if (clientRef.current?.connected || clientRef.current?.active) {
      return;
    }

    const token = getToken();
    if (!token) {
      setError('No authentication token found');
      return;
    }

    // Disconnect existing client if any
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }

   const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:8080/ws";
    const socket = new SockJS(WS_URL);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      onConnect: () => {
        setIsConnected(true);
        setError(null);
        // Small delay to ensure STOMP is fully ready
        setTimeout(() => {
          options?.onConnect?.();
        }, 100);
      },
      onDisconnect: () => {
        setIsConnected(false);
        options?.onDisconnect?.();
      },
      onStompError: (frame) => {
        setError(`WebSocket error: ${frame.headers['message'] || 'Unknown error'}`);
        options?.onError?.(frame);
      },
      onWebSocketError: (event) => {
        setError(`WebSocket connection error: ${event.type}`);
        options?.onError?.(event);
      },
    });

    client.activate();
    clientRef.current = client;
  }, [options]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const subscribe = useCallback(
    (destination: string, callback: (message: IMessage) => void) => {
      if (!clientRef.current?.connected) {
        console.error('WebSocket not connected');
        return null;
      }

      return clientRef.current.subscribe(destination, callback);
    },
    []
  );

  const send = useCallback(
    (destination: string, body: any) => {
      if (!clientRef.current?.connected) {
        console.error('WebSocket not connected');
        return;
      }

      clientRef.current.publish({
        destination,
        body: JSON.stringify(body),
      });
    },
    []
  );

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only connect once on mount

  return {
    isConnected,
    error,
    connect,
    disconnect,
    subscribe,
    send,
    client: clientRef.current,
  };
}

