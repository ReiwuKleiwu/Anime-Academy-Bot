// @ts-nocheck

function getSocketObject(): void {
  window.io.Socket.prototype.o_emit =
    window.io.Socket.prototype.o_emit || window.io.Socket.prototype.emit;
  window.io.Socket.prototype.emit = function (eventName, ...args) {
    if (!window.socket) {
      window.socket = this;
    }

    return this.o_emit(eventName, ...args);
  };
}

export default getSocketObject;
