import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

const WebSocketContext = createContext(null);

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children, token }) => {
  const stompClientRef = useRef(null);
  const subscriptionsRef = useRef(new Map());
  const connectPromiseRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      return Promise.resolve();
    }

    if (connectPromiseRef.current) {
      return connectPromiseRef.current;
    }

    const socket = new SockJS('http://localhost:8060/websocket');
    stompClientRef.current = Stomp.over(socket);

    const headers = {
      'X-Authorization': `Bearer ${token}`
    };

    connectPromiseRef.current = new Promise((resolve, reject) => {
      stompClientRef.current.connect(
        headers,
        () => {
          console.log('Connected to WebSocket');
          setIsConnected(true);
          resolve();
        },
        (error) => {
          console.error('Error connecting to WebSocket:', error);
          setIsConnected(false);
          reject(error);
        }
      );
    });

    return connectPromiseRef.current;
  }, [token]);

  const disconnect = useCallback(() => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.disconnect(() => {
        console.log('Disconnected from WebSocket');
        setIsConnected(false);
      });
    }
    subscriptionsRef.current.clear();
  }, []);

  const sendMessage = useCallback(async (senderId, recipientId, content) => {
    await connect();
    console.log(`Sending message from ${senderId} to ${recipientId}: ${content}`);
    const chatMessage = {
      senderId,
      receiverId: recipientId,
      message: content,
    };

    const roomName = await getRoomName(senderId, recipientId);
    stompClientRef.current.send(`/app/chat`, {}, JSON.stringify(chatMessage));
  }, [connect]);

  const subscribeToChatTopic = useCallback(async (userId, otherUserId, onMessageReceived) => {
    await connect();
    const roomName = await getRoomName(userId, otherUserId);
    const subscriptionKey = `${userId}-${otherUserId}`;
    if (!subscriptionsRef.current.has(subscriptionKey)) {
      const subscription = stompClientRef.current.subscribe(`/topic/chat/${roomName}`, (message) => {
        const receivedMessage = JSON.parse(message.body);
        console.log(`Received message in subscribe to chat topic:`, receivedMessage);
        onMessageReceived(receivedMessage);
      });

      subscriptionsRef.current.set(subscriptionKey, subscription);
    }
  }, [connect]);

  const getChatHistory = useCallback(async (userId) => {
    await connect();
    console.log(`Fetching chat history for user: ${userId}`);
    
    return new Promise((resolve) => {
      const subscriptionKey = `history-${userId}`;
      let subscription;
      
      const timeoutId = setTimeout(() => {
        console.log('Chat history request timed out');
        if (subscription) {
          subscription.unsubscribe();
        }
        resolve([]);
      }, 20000);  // 20 seconds timeout

      subscription = stompClientRef.current.subscribe(`/user/${userId}/topic/chat/history`, (message) => {
       // clearTimeout(timeoutId);
      console.log("JJJJJJJJJJKKKKKLKLLLLLLLLL")
       // console.log("subscribed "+ Date.now()+" userId - "+userId)
        const chatHistory = JSON.parse(message.body);
        console.log('Received chat history:', chatHistory);
       // subscription.unsubscribe();
        resolve(chatHistory);
      });

      subscriptionsRef.current.set(subscriptionKey, subscription);

      stompClientRef.current.send(`/app/chat/history/${userId}`, {}, JSON.stringify({}));
    });
  }, );

  const getRoomName = useCallback(async (userId, otherUserId) => {
    console.log(`Getting room name for users ${userId} and ${otherUserId}`);
    const response = await fetch(`http://localhost:8060/api/getRoomName/${userId}/${otherUserId}`, {
      headers: {
        'X-Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log(`Room name is ${data.roomName}`);
    return data.roomName;
  }, [token]);

  useEffect(() => {
    if (!token) {
      console.error("No token provided to WebSocketProvider");
    } else {
      connect();
    }

    return () => {
      disconnect();
      connectPromiseRef.current = null;
    };
  }, [token, connect, disconnect]);

  const value = {
    sendMessage,
    subscribeToChatTopic,
    getChatHistory,
    getRoomName,
    isConnected,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;
/*
import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import SockJsClient from 'react-stomp';

const WebSocketContext = createContext(null);

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children, token }) => {
  const clientRef = useRef(null);
  const topicsRef = useRef(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const hasConnectedRef = useRef(false);

  const sendMessage = useCallback((destination, body) => {
    if (isConnected && clientRef.current) {
      clientRef.current.sendMessage(destination, JSON.stringify(body));
    } else {
      console.error("WebSocket is not connected");
    }
  }, [isConnected]);

  const subscribeToTopic = useCallback((topic) => {
    topicsRef.current.add(topic);
    if (clientRef.current && clientRef.current.connected) {
      clientRef.current.subscribe(topic);
    }
  }, []);

  const unsubscribeFromTopic = useCallback((topic) => {
    topicsRef.current.delete(topic);
    if (clientRef.current && clientRef.current.connected) {
      clientRef.current.unsubscribe(topic);
    }
  }, []);

  const value = {
    sendMessage,
    subscribeToTopic,
    unsubscribeFromTopic,
    isConnected,
  };

  useEffect(() => {
    if (!token) {
      console.error("No token provided to WebSocketProvider");
    }
  }, [token]);

  const handleConnect = useCallback(() => {
    if (!hasConnectedRef.current) {
      console.log("Connected to WebSocket");
      setIsConnected(true);
      hasConnectedRef.current = true;
    }
  }, []);

  return (
    <WebSocketContext.Provider value={value}>
      <SockJsClient
        url='http://localhost:8060/websocket'
        topics={Array.from(topicsRef.current)}
        onConnect={handleConnect}
        onDisconnect={() => {
          console.log("Disconnected from WebSocket");
          setIsConnected(false);
          hasConnectedRef.current = false;
        }}
        onMessage={(msg, topic) => {
          console.log(`Received message on topic ${topic}:`, msg);
        }}
        onStompError={(frame) => {
          console.error('Broker reported error: ' + frame.headers['message']);
          console.error('Additional details: ' + frame.body);
        }}
        headers={{
          'X-Authorization': `Bearer ${token}`
        }}
        ref={clientRef}
      />
      {children}
    </WebSocketContext.Provider>
  );
};
*/