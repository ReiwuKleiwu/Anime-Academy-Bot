import AACEvent from '../interfaces/AACEvent.interface';
import config from '../config.json';

module.exports = {
  name: 'updateChatLines',
  once: false,
  execute(event: AACEvent) {
    const { client, data } = event;
    const message = data.chatLine;

    if (!isCommand(message)) return;

    const args = message.slice(config.AACBot.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    try {
      client.commands.get(command)?.execute(client, data, ...args);
    } catch (error) {
      console.log(error);
    }
  },
};

function isCommand(message: string) {
  return message.startsWith(config.AACBot.prefix);
}
