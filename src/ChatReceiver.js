import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from './WebSocketProvider';

const ChatReceiver = React.memo(({ senderId, receiverId, token }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatContainerRef = useRef(null);
  const { sendMessage, subscribeToChatTopic, getChatHistory, isConnected } = useWebSocket();

  const setupChat = useCallback(async () => {
    try {
      await subscribeToChatTopic(receiverId, senderId, (message) => {
        setMessages(prevMessages => [...prevMessages, message]);
      });

      setLoading(true);
      const history = await getChatHistory(receiverId);
      console.log(`Chat history for receiver:`, history);
      setMessages(prevMessages => {
        const newMessages = history.filter(msg => !prevMessages.some(prevMsg => prevMsg.id === msg.id));
        return [...prevMessages, ...newMessages];
      });
      setLoading(false);
    } catch (err) {
      console.error('Error setting up chat:', err);
      setError('Failed to set up chat.');
      setLoading(false);
    }
  }, [senderId, receiverId, subscribeToChatTopic, getChatHistory]);

  useEffect(() => {
    setupChat();
  }, [setupChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = useCallback(() => {
    if (inputMessage.trim() !== '' && isConnected) {
      sendMessage(receiverId, senderId, inputMessage.trim());
      setInputMessage('');
    }
  }, [inputMessage, isConnected, senderId, receiverId, sendMessage]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  return (
    <div>
      <h3>Receiver: {receiverId}</h3>
      {loading && <p>Loading chat...</p>}
      {error && <p>{error}</p>}
      <div ref={chatContainerRef} style={{ height: '300px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
        {messages.map((message, index) => (
          <div key={index} style={{ marginBottom: '5px' }}>
            <strong>{message.senderId === receiverId ? 'You' : 'Sender'}:</strong> {message.message}
          </div>
        ))}
      </div>
      <div>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage();
            }
          }}
          style={{ width: '70%', marginRight: '10px' }}
        />
        <button onClick={handleSendMessage} disabled={!isConnected}>Send</button>
      </div>
    </div>
  );
});

export default ChatReceiver;
/** 
import React, { useState, useEffect, useRef } from 'react';
import WebSocketService from './WebSocketService';

const ChatReceiver = ({ senderId, receiverId }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    const token = 'eyJhbGciOiJIUzI1NiIsInppcCI6IkdaSVAifQ.H4sIAAAAAAAA_y2OSw-CMBCE_4rZMyEgwQcnjeFAFDBYY-KF1FKliW0JLYbG-N9dH8f5ZnZnniCMgQQadgcPBLWQhPNwEQTLWTj1gI_dH0Q_QBnTg7JZgzcXrcSVMu5LapRaSaGsUz7TEj_RwbZb7jCVB2NRkkYSGZuSZO6UngsMKCo5ug_BrO4n2gjZcoXcuu7DsYfjMA8Gw_tv2zSOUBpnLJf1rdcDLoPN8UDKPK3qfVmR9Q5eb9NepZPQAAAA.L4sEM9Kz-NLRyuFsih9EUSSPcxxQApVE54l3rtEvGsE';
    setLoading(true);
    WebSocketService.connect(
      token,
      () => {
        WebSocketService.subscribeToChatTopic(receiverId, senderId, (message) => {
          setMessages((prevMessages) => [...prevMessages, message]);
        });

        WebSocketService.getChatHistory(receiverId, senderId, (history) => {
          setMessages(history);
          setLoading(false);
        });
      },
      (error) => {
        console.error('WebSocket connection error:', error);
        setError('Failed to connect to the chat server.');
        setLoading(false);
      }
    );

    return () => {
      WebSocketService.disconnect();
    };
  }, [senderId, receiverId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (inputMessage.trim() !== '') {
      const message = {
        senderId: receiverId,
        receiverId: senderId,
        message: inputMessage.trim(),
        timestamp: new Date().toISOString(),
      };
      WebSocketService.sendMessage(receiverId, senderId, inputMessage.trim());
      setMessages((prevMessages) => [...prevMessages, message]);
      setInputMessage('');
    }
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  return (
    <div>
      <h3>Receiver: {receiverId}</h3>
      {loading && <p>Loading chat...</p>}
      {error && <p>{error}</p>}
      <div ref={chatContainerRef}>
        {messages.map((message, index) => (
          <div key={index}>
            <strong>{message.senderId === receiverId ? 'You' : 'Sender'}:</strong> {message.message}
          </div>
        ))}
      </div>
      <div>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              sendMessage();
            }
          }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatReceiver;
*/