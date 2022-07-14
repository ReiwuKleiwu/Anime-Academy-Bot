import AACClient from '../classes/AACClient';

module.exports = {
  name: 'ping',
  description: 'Ping!',
  async execute(client: AACClient, message: string, ...args: string[]) {
    await client.sendMessage('pong!');
  },
};
