// @ts-nocheck

function stopTyping(id: number): void {
  console.log('Stop typing');
  window.socket.emit('stopTyping', id);
}

export default stopTyping;
