// @ts-nocheck

function sendMessage(message: string): void {
  window.socket.emit('newChatLine', { chatLine: message });
}

export default sendMessage;
