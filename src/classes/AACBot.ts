import {
  Browser,
  BrowserContext,
  chromium,
  LaunchOptions,
  Page,
} from 'playwright';
import { EventEmitter } from 'events';
import PublicRooms from '../constants/rooms.enum';
import OwnAACUser from '../interfaces/OwnAACUser.interface';
import startTyping from '../scripts/startTyping';
import stopTyping from '../scripts/stopTyping';
import sendMessage from '../scripts/sendMessage';
import { setTimeout } from 'timers/promises';
import AACNavigator from './AACNavigator';

class AACBot {
  private aacNavigator!: AACNavigator;
  private user!: any;
  private browser!: Browser;
  private launchOptions!: LaunchOptions;
  private context!: BrowserContext;
  private page!: Page;
  private emitter: EventEmitter;

  constructor() {
    this.launchOptions = {
      headless: false,
    };
    this.emitter = new EventEmitter();
  }

  async init(): Promise<void> {
    this.browser = await chromium.launch(this.launchOptions);
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();

    this.aacNavigator = new AACNavigator(this.page, this.emitter);
    this.user = await this.aacNavigator.login();

    await this.#addSocketEventHandlers();
    await this.aacNavigator.joinChat(PublicRooms.Mensa);
  }

  async startTyping(userId: number): Promise<void> {
    await this.page.evaluate(startTyping, userId);
  }

  async stopTyping(userId: number): Promise<void> {
    await this.page.evaluate(stopTyping, userId);
  }

  async sendMessage(message: string): Promise<void> {
    await this.startTyping(this.user.userid);
    await setTimeout(85 * message.length);
    await this.stopTyping(this.user.userid);
    await this.page.evaluate(sendMessage, message);
  }

  async #addSocketEventHandlers(): Promise<void> {
    this.emitter.on('socketIncomingEvent', async (event) => {
      console.log(event);
    });
    this.emitter.on('socketOutgoingEvent', async (event) => {
      //console.log(event);
    });
  }
}

export default AACBot;
