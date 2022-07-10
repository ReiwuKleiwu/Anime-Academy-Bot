// @ts-nocheck

function startTyping(id: number): void {
  console.log('Start typing');
  window.socket.emit('isTyping', id);
}

export default startTyping;
