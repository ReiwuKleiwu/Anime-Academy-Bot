import AACEvent from '../interfaces/AACEvent.interface';

module.exports = {
  name: 'updateChatLines',
  once: false,
  async execute(event: AACEvent) {
    const { client, data } = event;
    const message = data.chatLine;
    const isJoinMessage = message.match(/(?:.*) hat den Ort \w+ betreten./g);

    if (!isJoinMessage || !(data.user === 'System')) return;

    const userMatch = message.match(/(.*) hat den Ort \w+ betreten./);

    if (!userMatch) return;

    const user = userMatch[1];

    if (user === client.user.chatname) return;

    await client.sendMessage(`Hallo ${user}!`);
  },
};
