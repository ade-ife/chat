import React, { useState, useEffect, useRef } from 'react';
import WebSocketService from './WebSocketService';

const Chat = ({ senderId, recipientId }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    const token = 'eyJhbGciOiJIUzI1NiIsInppcCI6IkdaSVAifQ.H4sIAAAAAAAA_yWOSwvCMBCE_4rsuZT4KLU9KeLBt9iIeJKYrjZgktIkYhH_u2s9zjezO_MG5RzkUMoHRKCEh7yf9tMsTUaMRYCvugNjxv5ASGmD8YuSbq7WqJuQGGvhjJloZXxrYmk1fRLBVytsKYXzhJ_0ttnwZV2w8ng-ZQMKGKGR3KeS3jY965Su0BD3bf3j1IM0LILgsOnaBsmQpGudR325NzbQMpgdC77bzA-X_e7Ap2v4fAHgHzK30AAAAA.oNYzNvXf47snTc-MxP1CePoyyWGDzCN0k_UWjTJg3UM';
    setLoading(true);
    WebSocketService.connect(
      token,
      () => {
        WebSocketService.subscribeToChatTopic(senderId, recipientId, (message) => {
        //  console.log(`Received message in Chat component: ${JSON.stringify(message)}`);
          setMessages((prevMessages) => [...prevMessages, message]);
        });

        WebSocketService.getChatHistory(senderId, recipientId, (history) => {
       //   console.log(`Received chat history in Chat component: ${JSON.stringify(history)}`);
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
  }, [senderId, recipientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (inputMessage.trim() !== '') {
      const message = {
        senderId: senderId,
        receiverId: recipientId,
        message: inputMessage.trim(),
        timestamp: new Date().toISOString(),
      };
      WebSocketService.sendMessage(senderId, recipientId, inputMessage.trim());
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
      <h2>Chat</h2>
      {loading && <p>Loading chat...</p>}
      {error && <p>{error}</p>}
      <div ref={chatContainerRef}>
        {messages.length === 0 ? (
          <p>No messages yet. Start chatting!</p>
        ) : (
          messages.map((message, index) => (
            <div key={index}>
              <strong>{message.senderId === senderId ? 'You' : 'Recipient'}:</strong> {message.message}
            </div>
          ))
        )}
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

export default Chat;