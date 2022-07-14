import AACClient from '../classes/AACClient';

interface AACCommand {
  name: string;
  description: string;
  execute: (
    client: AACClient,
    string: string,
    ...args: string[]
  ) => Promise<void>;
}

export default AACCommand;
