import React from 'react';
import './App.css';
import ChatSender from './ChatSender';
import ChatReceiver from './ChatReceiver';
import { WebSocketProvider } from './WebSocketProvider';

function App() {
  const senderId = 252;
  const receiverId = 253;
  const senderToken = 'eyJhbGciOiJIUzI1NiIsInppcCI6IkdaSVAifQ.H4sIAAAAAAAA_yWOwQ6CMBBEf8XsmRitUQInjWgiSlCEcCS1VqmxLaGtEY3_7irHeTO7M28QxkAIZ3YHDwS1EI59MpoFhJDAA_5seuCTHlDGtFN2c8abk1biQhkfSmqUmkuhbKeGTEv8RJ2tt7zDVBLFoszj8nArXmmxjpJiPcWAopKj-xDM6nagjZA1V8ht1_w49nAc5oEzvP23kekEpemM5bK6ttrhMlgWxzxNVlm1T7N8sYPPF19IH5zQAAAA.ozzDSo3nPUR2RYmF0RcsNZEoo1Y8wUP1YhcKXHmF1PU';
  const receiverToken = 'eyJhbGciOiJIUzI1NiIsInppcCI6IkdaSVAifQ.H4sIAAAAAAAA_yWOQQuCQBCF_0rMWcIWUvRUVERUGqaXLrGsU7uirri70BL996Y8zGG-92bee4MyBlKoRQsBKG4hXcQsjBLGojAAfA0TiNkEuBDa9fZQ081D9Zy3Fo0dpO5xJRXKudAdPeLOyiN6Mokq2VdMeEGD28zX1c2RoecdktpoIx2fZapRBK0ffpAykEoF4AyO_yS2ZLQabyx29-eoHbWCTXUt8_OuuF_yolyf4PMFIJ2GIMwAAAA.W4ogD17SYrnM9EBTH8QC0KH8NDWDZcUUI1pRhRIFR-E';

  return (
    <div>
      <h1>Chat App</h1>
      <div style={{ display: 'flex' }}>
        <WebSocketProvider token={senderToken}>
          <div style={{ flex: 1 }}>
            <h2>Sender</h2>
            <ChatSender senderId={senderId} receiverId={receiverId} token={senderToken} />
          </div>
        </WebSocketProvider>
        <WebSocketProvider token={receiverToken}>
          <div style={{ flex: 1 }}>
            <h2>Receiver</h2>
            <ChatReceiver senderId={senderId} receiverId={receiverId} token={receiverToken} />
          </div>
        </WebSocketProvider>
      </div>
    </div>
  );
}

export default App;

/*
import React from 'react';
import './App.css';
import ChatSender from './ChatSender';
import ChatReceiver from './ChatReceiver';

function App() {
  const senderId = 252; 
  const receiverId = 253; 

  return (
    <div>
      <h1>Chat App</h1>
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <h2>Sender</h2>
          <ChatSender senderId={senderId} receiverId={receiverId} />
        </div>
        <div style={{ flex: 1 }}>
          <h2>Receiver</h2>
          <ChatReceiver senderId={senderId} receiverId={receiverId} />
        </div>
      </div>
    </div>
  );
}

export default App;
*/