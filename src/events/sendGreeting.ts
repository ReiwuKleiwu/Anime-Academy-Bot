import AACEvent from '../interfaces/AACEvent.interface';

module.exports = {
  name: 'updateChatLines',
  once: false,
  execute(event: AACEvent) {
    const { client, data } = event;
  },
};
