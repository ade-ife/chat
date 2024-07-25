import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.subscriptions = new Map();
    this.connectPromise = null;
  }

  connect = (token, onConnected, onError) => {
    if (this.connectPromise) {
      return this.connectPromise;
    }

    const socket = new SockJS('http://localhost:8060/websocket');
    this.stompClient = Stomp.over(socket);

    const headers = {
      'X-Authorization': `Bearer ${token}`
    };

    this.connectPromise = new Promise((resolve, reject) => {
      this.stompClient.connect(
        headers,
        () => {
          console.log('Connected to WebSocket');
          onConnected();
          resolve();
        },
        (error) => {
          console.error('Error connecting to WebSocket:', error);
          console.log(JSON.stringify(error, null, 2));
     
          onError(error);
          this.connectPromise = null;
          reject(error);
        }
      );
    });

    return this.connectPromise;
  };

  disconnect = () => {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.disconnect(() => {
        console.log('Disconnected from WebSocket');
      });
    }
    this.connectPromise = null;
  };

  sendMessage = async (senderId, recipientId, content) => {
    await this.ensureConnected();
    console.log(`Sending message from ${senderId} to ${recipientId}: ${content}`);
    const chatMessage = {
      senderId,
      receiverId: recipientId,
      message: content,
    };

    const roomName = await this.getRoomName(senderId, recipientId);
    this.stompClient.send(`/app/chat`, {}, JSON.stringify(chatMessage));
  };

  subscribeToChatTopic = async (userId, otherUserId, onMessageReceived) => {
    await this.ensureConnected();
    console.log(`Subscribing to chat topic for user: ${userId} and otherUserId: ${otherUserId}`);
    const roomName = await this.getRoomName(userId, otherUserId);
    const subscriptionKey = `${userId}-${otherUserId}`;
    if (!this.subscriptions.has(subscriptionKey)) {
     // const subscription = this.stompClient.subscribe(`/topic/chat/${roomName}`, (message) => {
      const subscription = this.stompClient.subscribe(`/user/${userId}/topic/chat/history`, (message) => {
        const receivedMessage = JSON.parse(message.body);
        console.log(`Received message in subscribe to chat topic is`, receivedMessage);
        if (!this.messageAlreadyExists(receivedMessage)) {
          onMessageReceived(receivedMessage);
        }
      });

      this.subscriptions.set(subscriptionKey, subscription);
    }
  };
  
  messageAlreadyExists = (newMessage) => {
    return false;
  };
  
  getChatHistory = async (userId, onHistoryReceived) => {
    await this.ensureConnected();
    console.log(`Fetching chat history for user: ${userId}`);
    this.stompClient.send(`/app/chat/history/${userId}`, {}, JSON.stringify({}));

    this.stompClient.subscribe(`/user/${userId}/topic/chat/history`, (message) => {
      const chatHistory = JSON.parse(message.body);
      console.log('Received message in get chat history:', chatHistory);
      onHistoryReceived(chatHistory);
    });
  };

  getRoomName = async (userId, otherUserId) => {
    console.log(`user id is ${userId} while the other user id is ${otherUserId}`);
    const response = await fetch(`http://localhost:8060/api/getRoomName/${userId}/${otherUserId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log(`room name is ${data.roomName}`);
    return data.roomName;
  };

  ensureConnected = async () => {
    if (!this.stompClient || !this.stompClient.connected) {
      throw new Error('WebSocket is not connected. Please connect first.');
    }
  };
}

export default new WebSocketService();

/*before the new one with justin
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.subscriptions = new Map(); // Store subscriptions to prevent duplicate subscriptions
  }

  connect = (token, onConnected, onError) => {
    const socket = new SockJS(`http://localhost:8060/chat-ws?token=${token}`);
    const stompClient = Stomp.over(socket);
    console.log(`Connecting with token: ${token}`);

    stompClient.connect(
      {},
      () => {
        this.stompClient = stompClient;
        console.log('Connected to WebSocket');
        onConnected();
      },
      (error) => {
        console.error('Error connecting to WebSocket:', error);
        onError(error);
      }
    );
  };

  disconnect = () => {
    if (this.stompClient) {
      this.stompClient.disconnect(() => {
        console.log('Disconnected from WebSocket');
      });
    }
  };

  sendMessage = (senderId, recipientId, content) => {
    console.log(`Sending message from ${senderId} to ${recipientId}: ${content}`);
    if (this.stompClient) {
      const chatMessage = {
        senderId,
        receiverId: recipientId,
        message: content,
      };

      this.getRoomName(senderId, recipientId, (roomName) => {
        this.stompClient.send(`/app/chat`, {}, JSON.stringify(chatMessage));
      });
    }
  };

  subscribeToChatTopic = (userId, otherUserId, onMessageReceived) => {
    console.log(`Subscribing to chat topic for user: ${userId} and otherUserId: ${otherUserId}`);
    if (this.stompClient) {
      this.getRoomName(userId, otherUserId, (roomName) => {
        const subscriptionKey = `${userId}-${otherUserId}`;
        if (!this.subscriptions.has(subscriptionKey)) {
          const subscription = this.stompClient.subscribe(`/topic/chat/${roomName}`, (message) => {
            const receivedMessage = JSON.parse(message.body);
            console.log(`Received message in subscribe to chat topic is`, receivedMessage);
            // Ensure message is not already in state before adding
            if (!this.messageAlreadyExists(receivedMessage)) {
              onMessageReceived(receivedMessage);
            }
          });

          this.subscriptions.set(subscriptionKey, subscription);
        }
      });
    }
  };
  
  messageAlreadyExists = (newMessage) => {
    return false;
   // return this.messages.some(message => message.id === newMessage.id);
  };
  

  getChatHistory = (userId, onHistoryReceived) => {
    console.log(`Fetching chat history for user: ${userId}`);
    if (this.stompClient) {
      this.stompClient.send(`/app/chat/history/${userId}`, {}, JSON.stringify({}));

      this.stompClient.subscribe(`/user/${userId}/topic/chat/history`, (message) => {
        const chatHistory = JSON.parse(message.body);
        console.log('Received message in get chat history:', chatHistory);
        onHistoryReceived(chatHistory);
      });
    }
  };

  getRoomName = (userId, otherUserId, callback) => {
    console.log(`user id is ${userId} while the other user id is ${otherUserId}`);
    // Fetch room name dynamically
    fetch(`http://localhost:8060/api/getRoomName/${userId}/${otherUserId}`)
      .then((response) => response.json())
      .then((data) => {
        console.log(`room name is ${data.roomName}`);
        callback(data.roomName);
      })
      .catch((error) => {
        console.error('Error fetching room name:', error);
      });
  };
}

export default new WebSocketService();

*/
/* 

import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

class WebSocketService {
  constructor() {
    this.stompClient = null;
  }

  connect = (token, onConnected, onError) => {
    const socket = new SockJS(`http://localhost:8060/chat-ws?token=${token}`);
    const stompClient = Stomp.over(socket);
    console.log(`Connecting with token: ${token}`);

    stompClient.connect(
      {},
      () => {
        this.stompClient = stompClient;
        console.log('Connected to WebSocket');
        onConnected();
      },
      (error) => {
        console.error('Error connecting to WebSocket:', error);
        onError(error);
      }
    );
  };

  disconnect = () => {
    if (this.stompClient) {
      this.stompClient.disconnect(() => {
        console.log('Disconnected from WebSocket');
      });
    }
  };

  sendMessage = (senderId, recipientId, content) => {
    console.log(`Sending message from ${senderId} to ${recipientId}: ${content}`);
    if (this.stompClient) {
      const chatMessage = {
        senderId,
        receiverId: recipientId,
        message: content,
      };
      this.stompClient.send('/app/chat', {}, JSON.stringify(chatMessage));
    }
  };

  subscribeToChatTopic = (userId, onMessageReceived) => {
    console.log(`Subscribing to chat topic for user: ${userId}`);
    if (this.stompClient) {
      this.stompClient.subscribe(`/user/${userId}/topic/chat`, (message) => {
        const receivedMessage = JSON.parse(message.body);
        onMessageReceived(receivedMessage);
      });
    }
  };

  getChatHistory = (userId, onHistoryReceived) => {
    console.log(`Fetching chat history for user: ${userId}`);
    
    if (this.stompClient) {
        // Sending a message to the /app/chat/history/{userId} endpoint
        this.stompClient.send(`/app/chat/history/${userId}`, {}, JSON.stringify({}));
  
        // Subscribing to the /user/{userId}/topic/chat/history endpoint
     //   this.stompClient.subscribe(`/user/${userId}/topic/chat/history`, (message) => {
        this.stompClient.subscribe(`/topic/chat/history/room1`, (message) => {
            console.log(`Received message on /user/${userId}/topic/chat/history: ${message.body}`);
            const chatHistory = JSON.parse(message.body);
            console.log('inside chat history');
            console.log(`chat history is ${JSON.stringify(chatHistory)}`);
            onHistoryReceived(chatHistory);
        });
    }
}
 onHistoryReceived = (chatHistory) => {
  console.log("Chat history received: ", chatHistory);
  // Update the UI or handle the chat history as needed
};

  
}

export default new WebSocketService();
*/



//comment//

/*
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

class WebSocketService {
  constructor() {
    this.stompClient = null;
  }

  connect = (token, onConnected, onError) => {
    const socket = new SockJS(`http://localhost:8060/chat-ws?token=${token}`);
    const stompClient = Stomp.over(socket);
    console.log(token)

    stompClient.connect(
      {},
      () => {
        this.stompClient = stompClient;
        onConnected();
      },
      onError,
    );
  };

  disconnect = () => {
    if (this.stompClient) {
      this.stompClient.disconnect();
    }
  };

  sendMessage = (senderId, recipientId, content) => {
    console.log(`in send message, sender is ${senderId} while receiver is ${recipientId}`);
    if (this.stompClient) {
      const chatMessage = {
        senderId: senderId,
        receiverId: recipientId,
        message: content,
      };
      this.stompClient.send(`/app/chat`, {}, JSON.stringify(chatMessage));
      console.log(`Sent message from ${senderId} to ${recipientId}: ${content}`);
    }
  };

 
  subscribeToChatTopic = (senderId, recipientId, onMessageReceived) => {
    console.log(`in subscribe to chat topic, sender is ${senderId} while receiver is ${recipientId}`);
    if (this.stompClient) {
      //this.stompClient.subscribe(`/user/${senderId}/topic/chat`, (message) => {
        this.stompClient.subscribe(`/${senderId}/topic/chat`, (message) => {
        const receivedMessage = JSON.parse(message.body);
        onMessageReceived(receivedMessage);
      });
    }
  };

  getChatHistory = (userId, onHistoryReceived) => {
    console.log(`in get chat history, user ID is ${userId}`);
    if (this.stompClient) {
      this.stompClient.send(`/app/chat/history`, {}, JSON.stringify(userId));
   //   this.stompClient.subscribe(`/user/${userId}/topic/chat/history`, (message) => {
    this.stompClient.subscribe(`${userId}/topic/chat/history`, (message) => {
        const chatHistory = JSON.parse(message.body);
        console.log(message);
        onHistoryReceived(chatHistory);
        console.log(`recieved history is ${chatHistory}`);
      });
    }
  };

}

export default new WebSocketService();


 // sendMessage = (senderId, recipientId, content) => {
  //   console.log(`in send message, sender is ${senderId} while recoiver is ${recipientId}`);
  //   if (this.stompClient) {
  //     const chatMessage = {
  //       message: content,
  //     };
  //    this.stompClient.send(`/app/chat/${senderId}/${recipientId}`, {}, JSON.stringify(chatMessage));
  //     console.log(`Sent message from ${senderId} to ${recipientId}: ${content}`);
  //   }
  // };

  // subscribeToChatTopic = (senderId, recipientId, onMessageReceived) => {
  //   console.log(`in subscribe to chat topic, sender is ${senderId} while recoiver is ${recipientId}`);
  //   if (this.stompClient) {
  //    // this.stompClient.subscribe(`/topic/chat/${senderId}${recipientId}`, (message) => {
  //     this.stompClient.subscribe(`/topic/chat/room1`, (message) => {
   
  //    //   console.log(`message is ${message}`);
  //       const receivedMessage = JSON.parse(message.body);
  //      // console.log(`Received message for ${recipientId}: ${JSON.stringify(receivedMessage)}`);
  //       onMessageReceived(receivedMessage);
  //     });
  //   }
  // };
*/

  