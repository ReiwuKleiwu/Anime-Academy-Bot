import EventEmitter from 'events';
import {
  Browser,
  BrowserContext,
  chromium,
  LaunchOptions,
  Page,
} from 'playwright';
import { setTimeout } from 'timers/promises';
import PublicRooms from '../constants/rooms.enum';
import AACCommand from '../interfaces/AACCommand.interface';
import OwnAACUser from '../interfaces/OwnAACUser.interface';
import sendMessage from '../scripts/sendMessage';
import startTyping from '../scripts/startTyping';
import stopTyping from '../scripts/stopTyping';
import AACNavigator from './AACNavigator';

class AACClient extends EventEmitter {
  private aacNavigator!: AACNavigator;
  private browser!: Browser;
  private launchOptions!: LaunchOptions;
  private context!: BrowserContext;
  private page!: Page;
  private user!: OwnAACUser;
  public commands!: Map<string, AACCommand>;

  constructor() {
    super();

    this.launchOptions = {
      headless: false,
    };
  }

  async init(): Promise<void> {
    this.browser = await chromium.launch(this.launchOptions);
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();

    this.aacNavigator = new AACNavigator(this.page, this);
    await this.aacNavigator.login();
    this.user = await this.aacNavigator.aacDataService.getOwnUser();

    await this.aacNavigator.joinChat(PublicRooms.Mensa);
    this.emit('ready', {
      client: this,
      name: 'ready',
      data: this.user,
    });
  }

  async startTyping(userId: number): Promise<void> {
    await this.page.evaluate(startTyping, userId);
  }

  async stopTyping(userId: number): Promise<void> {
    await this.page.evaluate(stopTyping, userId);
  }

  async sendMessage(message: string): Promise<void> {
    await this.startTyping(this.user.userId);
    await setTimeout(85 * message.length);
    await this.stopTyping(this.user.userId);
    await this.page.evaluate(sendMessage, message);
  }
}

export default AACClient;
