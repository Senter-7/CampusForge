import { useEffect, useRef, useState, useCallback } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getToken, isTokenValid } from '../utils/auth';

interface UseWebSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
}

export function useWebSocket(options?: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<Client | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionsRef = useRef<Map<string, any>>(new Map());
  const optionsRef = useRef(options);
  const shouldReconnectRef = useRef(true);

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const getWebSocketUrl = useCallback(() => {
    // Get base URL from environment or construct from backend URL
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api';
    const wsUrl = import.meta.env.VITE_WS_URL;
    
    if (wsUrl) {
      return wsUrl;
    }
    
    // Construct WebSocket URL from backend URL
    // Remove /api suffix if present, and convert http/https to ws/wss
    let baseUrl = backendUrl.replace('/api', '');
    
    // In production, use wss:// (secure WebSocket)
    if (baseUrl.startsWith('https://')) {
      baseUrl = baseUrl.replace('https://', 'wss://');
    } else if (baseUrl.startsWith('http://')) {
      baseUrl = baseUrl.replace('http://', 'ws://');
    }
    
    // For SockJS, we use http/https, not ws/wss
    // SockJS will handle the protocol upgrade
    const sockjsUrl = baseUrl.replace('wss://', 'https://').replace('ws://', 'http://');
    return `${sockjsUrl}/ws`;
  }, []);

  const calculateReconnectDelay = useCallback((attempt: number): number => {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
    const baseDelay = 1000;
    const maxDelay = 30000;
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 1000;
    return delay + jitter;
  }, []);

  const reconnect = useCallback(() => {
    const maxAttempts = optionsRef.current?.maxReconnectAttempts ?? 10;
    const autoReconnect = optionsRef.current?.autoReconnect ?? true;

    if (!autoReconnect || !shouldReconnectRef.current) {
      return;
    }

    if (reconnectAttemptsRef.current >= maxAttempts) {
      setError(`Failed to reconnect after ${maxAttempts} attempts`);
      return;
    }

    const delay = calculateReconnectDelay(reconnectAttemptsRef.current);
    reconnectAttemptsRef.current += 1;

    reconnectTimeoutRef.current = setTimeout(() => {
      if (shouldReconnectRef.current) {
        connect();
      }
    }, delay);
  }, []);

  const connect = useCallback(() => {
    // Don't connect if already connected or connecting
    if (clientRef.current?.connected || clientRef.current?.active) {
      return;
    }

    const token = getToken();
    if (!token) {
      setError('No authentication token found');
      return;
    }

    // Check if token is valid
    if (!isTokenValid()) {
      setError('Authentication token expired. Please refresh the page.');
      return;
    }

    // Disconnect existing client if any
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }

    try {
      const WS_URL = getWebSocketUrl();
      const socket = new SockJS(WS_URL);
      
      const client = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 0, // We handle reconnection manually
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        onConnect: () => {
          setIsConnected(true);
          setError(null);
          reconnectAttemptsRef.current = 0; // Reset on successful connection
          
          // Re-subscribe to all previous subscriptions
          subscriptionsRef.current.forEach((subscription, destination) => {
            if (subscription && typeof subscription.callback === 'function') {
              const newSubscription = clientRef.current?.subscribe(destination, subscription.callback);
              if (newSubscription) {
                subscriptionsRef.current.set(destination, {
                  ...subscription,
                  subscription: newSubscription,
                });
              }
            }
          });
          
          // Small delay to ensure STOMP is fully ready
          setTimeout(() => {
            optionsRef.current?.onConnect?.();
          }, 100);
        },
        onDisconnect: () => {
          setIsConnected(false);
          optionsRef.current?.onDisconnect?.();
          
          // Attempt to reconnect if enabled
          if (shouldReconnectRef.current) {
            reconnect();
          }
        },
        onStompError: (frame) => {
          const errorMessage = frame.headers['message'] || 'Unknown error';
          setError(`WebSocket error: ${errorMessage}`);
          
          // If authentication error, don't reconnect
          if (errorMessage.includes('Invalid') || errorMessage.includes('expired') || errorMessage.includes('Authorization')) {
            shouldReconnectRef.current = false;
            setError('Authentication failed. Please refresh the page.');
          } else {
            optionsRef.current?.onError?.(frame);
            // Attempt to reconnect for other errors
            if (shouldReconnectRef.current) {
              reconnect();
            }
          }
        },
        onWebSocketError: (event) => {
          setError(`WebSocket connection error: ${event.type}`);
          optionsRef.current?.onError?.(event);
          
          // Attempt to reconnect
          if (shouldReconnectRef.current) {
            reconnect();
          }
        },
      });

      client.activate();
      clientRef.current = client;
    } catch (err) {
      setError(`Failed to create WebSocket connection: ${err}`);
      reconnect();
    }
  }, [getWebSocketUrl, reconnect]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
      setIsConnected(false);
    }
    
    subscriptionsRef.current.clear();
  }, []);

  const subscribe = useCallback(
    (destination: string, callback: (message: IMessage) => void) => {
      if (!clientRef.current?.connected) {
        // Store subscription for later re-subscription
        subscriptionsRef.current.set(destination, { callback });
        console.warn('WebSocket not connected. Subscription will be active once connected.');
        return null;
      }

      // Unsubscribe from existing subscription if any
      const existing = subscriptionsRef.current.get(destination);
      if (existing?.subscription) {
        existing.subscription.unsubscribe();
      }

      const subscription = clientRef.current.subscribe(destination, callback);
      
      if (subscription) {
        subscriptionsRef.current.set(destination, { callback, subscription });
      }
      
      return subscription;
    },
    []
  );

  const send = useCallback(
    (destination: string, body: any) => {
      if (!clientRef.current?.connected) {
        console.error('WebSocket not connected. Message not sent:', destination);
        return;
      }

      try {
        clientRef.current.publish({
          destination,
          body: JSON.stringify(body),
        });
      } catch (err) {
        console.error('Failed to send WebSocket message:', err);
        setError('Failed to send message');
      }
    },
    []
  );

  // Handle token refresh - reconnect with new token
  useEffect(() => {
    const handleTokenRefresh = () => {
      if (clientRef.current && isConnected) {
        // Reconnect with new token
        disconnect();
        setTimeout(() => {
          shouldReconnectRef.current = true;
          connect();
        }, 500);
      }
    };

    window.addEventListener('storage', (e) => {
      if (e.key === 'token' && e.newValue) {
        handleTokenRefresh();
      }
    });

    return () => {
      window.removeEventListener('storage', handleTokenRefresh);
    };
  }, [isConnected, connect, disconnect]);

  // Handle visibility change - reconnect when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected && shouldReconnectRef.current) {
        const token = getToken();
        if (token && isTokenValid()) {
          connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isConnected, connect]);

  // Initial connection
  useEffect(() => {
    shouldReconnectRef.current = true;
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

