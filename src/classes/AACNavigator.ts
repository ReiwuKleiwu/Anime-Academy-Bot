import { Page } from 'playwright';
import config from '../config.json';
import AACDataService from './AACDataService';
import AACClient from './AACClient';
import getSocketObject from '../scripts/getSocketObject';

class AACNavigator {
  private aacClient: AACClient;
  public aacDataService!: AACDataService;
  private email: string;
  private password: string;
  private url: string;
  private page: Page;
  private checkDisconnectInterval!: NodeJS.Timer;
  private currentRoom!: string;

  constructor(page: Page, emitter: AACClient) {
    this.email = config.AACBot.login_credentials.email;
    this.password = config.AACBot.login_credentials.password;
    this.url = 'https://www.anime.academy/';
    this.page = page;
    this.aacClient = emitter;
    this.aacDataService = new AACDataService(this.page, this.aacClient);
  }

  async login(): Promise<void> {
    await this.page.goto(this.url);
    this.page
      .locator('button >> visible=true', {
        hasText: 'Anmelden',
      })
      .click();

    await this.page.locator('input >> nth=0').fill(this.email);
    await this.page.locator('input >> nth=1').fill(this.password);
    await this.page
      .locator('#loginbox >> button', {
        hasText: 'Anmelden',
      })
      .click();
    await this.page
      .locator('a', {
        hasText: 'Zur Academy-Welt',
      })
      .waitFor({
        state: 'visible',
      });
  }

  async joinChat(room = 'Campus'): Promise<void> {
    await this.page
      .locator('a', {
        hasText: 'Zur Academy-Welt',
      })
      .waitFor();
    await this.joinRoom(room);
  }

  async joinRoom(room: string): Promise<void> {
    // @ts-ignore
    await this.page.removeAllListeners('response');
    await this.page.goto(`${this.url}chat?room=${room}`);
    this.currentRoom = room;
    await this.aacDataService.decodeSocketResponseData();
    await this.aacDataService.decodeSocketRequestData();
    await this.page.evaluate(getSocketObject);
    await this.page.keyboard.press('ArrowDown');
    await this.page.locator('#graphicWindow > canvas').waitFor();
    await this.#handleDisconnect();
  }

  async #handleDisconnect() {
    if (this.checkDisconnectInterval) {
      clearInterval(this.checkDisconnectInterval);
    }

    this.checkDisconnectInterval = setInterval(async () => {
      try {
        await this.page
          .locator('button', {
            hasText: 'Verbindung wiederherstellen',
          })
          .waitFor({
            state: 'visible',
            timeout: 1000,
          });

        await this.joinRoom(this.currentRoom);
      } catch (error) {}
    }, 2000);
  }
}

export default AACNavigator;
