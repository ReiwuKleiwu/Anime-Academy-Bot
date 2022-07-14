import path from 'path';
import fs from 'fs';
import AACClient from './classes/AACClient';

const AnimeAcademyClient = new AACClient();

async function main(): Promise<void> {
  //Load Commandhandlers
  AnimeAcademyClient.commands = new Map();
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    AnimeAcademyClient.commands.set(command.name, command);
  }

  // Load Eventhandlers
  const eventsPath = path.join(__dirname, 'events');
  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
      AnimeAcademyClient.once(event.name, (...args) => event.execute(...args));
    } else {
      AnimeAcademyClient.on(event.name, (...args) => event.execute(...args));
    }
  }

  await AnimeAcademyClient.init();
}

main();
