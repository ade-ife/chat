import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from './WebSocketProvider';

const ChatSender = React.memo(({ senderId, receiverId, token }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatContainerRef = useRef(null);
  const { sendMessage, subscribeToChatTopic, getChatHistory, isConnected } = useWebSocket();

  const setupChat = useCallback(async () => {
    try {
      await subscribeToChatTopic(senderId, receiverId, (message) => {
        setMessages(prevMessages => [...prevMessages, message]);
      });

      setLoading(true);
      const history = await getChatHistory(senderId);
      console.log(`Chat history for sender:`, history);
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
      sendMessage(senderId, receiverId, inputMessage.trim());
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
      <h3>Sender: {senderId}</h3>
      {loading && <p>Loading chat...</p>}
      {error && <p>{error}</p>}
      <div ref={chatContainerRef} style={{ height: '300px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
        {messages.map((message, index) => (
          <div key={index} style={{ marginBottom: '5px' }}>
            <strong>{message.senderId === senderId ? 'You' : 'Receiver'}:</strong> {message.message}
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

export default ChatSender;
/** 
import React, { useState, useEffect, useRef } from 'react';
import WebSocketService from './WebSocketService';

const ChatSender = ({ senderId, receiverId }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    const token = 'eyJhbGciOiJIUzI1NiIsInppcCI6IkdaSVAifQ.H4sIAAAAAAAA_y2OSw-CMBCE_4rZMzGIQYGTj6gxPoNiDBdS62pLgBLaJhLjf3d9HOeb2Z15gtQaIrjyAhyQzEDUG_YC1w39wHcAH_Uf9H-Aca5sZZZXurnJirHCoDa1UBWOhETR5aqkR8wascKWQpdFOk_Ok2nqhfqUbweHJFxRoGIlkpsrLSzrbGUuCZq2_kDqQBrlgNXYfJs83yOpW22wzO6NsrQKpsnhuNvM4my_i4_jNbzeFsyvdswAAAA.pX-p3TCrMeyvUA4A6FMCf7z1wTOkv4q01-MQwG9dpB8';
    setLoading(true);
    WebSocketService.connect(
      token,
      () => {
        WebSocketService.subscribeToChatTopic(senderId, receiverId, (message) => {
          setMessages((prevMessages) => [...prevMessages, message]);
        });

        WebSocketService.getChatHistory(senderId, receiverId, (history) => {
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
        senderId: senderId,
        receiverId: receiverId,
        message: inputMessage.trim(),
        timestamp: new Date().toISOString(),
      };
      WebSocketService.sendMessage(senderId, receiverId, inputMessage.trim());
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
      <h3>Sender: {senderId}</h3>
      {loading && <p>Loading chat...</p>}
      {error && <p>{error}</p>}
      <div ref={chatContainerRef}>
        {messages.map((message, index) => (
          <div key={index}>
            <strong>{message.senderId === senderId ? 'You' : 'Receiver'}:</strong> {message.message}
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

export default ChatSender;

*/