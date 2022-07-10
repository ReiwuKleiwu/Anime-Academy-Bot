import AACBot from './classes/AACBot';

const AnimeAcademyBot = new AACBot();

async function main(): Promise<void> {
  await AnimeAcademyBot.init();
}

main();
