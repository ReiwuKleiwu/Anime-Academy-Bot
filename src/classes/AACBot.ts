import {
  Browser,
  BrowserContext,
  chromium,
  LaunchOptions,
  Page,
  Request,
  Response,
} from 'playwright';
import { EventEmitter } from 'events';
import config from '../config.json';
import PublicRooms from '../constants/rooms.enum';
import getSocketObject from '../scripts/getSocketObject';
import OwnAACUser from '../interfaces/OwnAACUser.interface';
import startTyping from '../scripts/startTyping';
import stopTyping from '../scripts/stopTyping';
import sendMessage from '../scripts/sendMessage';
import { setTimeout } from 'timers/promises';

class AACBot {
  private email: string;
  private password: string;
  private user!: OwnAACUser;
  private url: string;
  private browser!: Browser;
  private launchOptions!: LaunchOptions;
  private context!: BrowserContext;
  private page!: Page;
  private emitter: EventEmitter;
  private currentRoom!: string;
  private checkDisconnectInterval!: NodeJS.Timer;

  constructor() {
    this.email = config.AACBot.login_credentials.email;
    this.password = config.AACBot.login_credentials.password;
    this.url = 'https://www.anime.academy/';
    this.launchOptions = {
      headless: false,
    };
    this.emitter = new EventEmitter();
  }

  async init(): Promise<void> {
    this.browser = await chromium.launch(this.launchOptions);
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();

    await this.#addSocketEventHandlers();

    await this.page.goto(this.url);
    await this.login();
    await this.joinChat(PublicRooms.Mensa);
  }

  async login(): Promise<void> {
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
      .waitFor();

    await this.getOwnUser();
  }

  async joinChat(room = 'Campus'): Promise<void> {
    await this.page
      .locator('a', {
        hasText: 'Zur Academy-Welt',
      })
      .waitFor();
    await this.joinRoom(room, () => {});
  }

  async joinRoom(
    room: string,
    callback: (...args: any[]) => any,
    ...args: any[]
  ): Promise<void> {
    // @ts-ignore
    await this.page.removeAllListeners('response');
    await this.page.goto(`${this.url}chat?room=${room}`);
    this.currentRoom = room;
    await this.#decodeSocketResponseData();
    await this.#decodeSocketRequestData();
    await this.page.evaluate(getSocketObject);
    await this.page.keyboard.press('ArrowDown');
    await this.page.locator('#graphicWindow > canvas').waitFor();
    await this.#handleDisconnect();
    await callback.apply(this, [...args]);
    await this.sendMessage(
      'sdljdkjsdföldjkgdfgökljdsfgöldfkgjdsfgölfkjsdfgölkj'
    );
  }

  async getOwnUser(): Promise<void> {
    const userData = await this.page.request.get(
      'https://www.anime.academy/data/Ownusername'
    );
    const userJson = await userData.json();

    this.user = {
      activityPoints: userJson.activitypoints,
      activityPointsToday: userJson.activitypoints_today,
      ap: userJson.aps,
      currentAvatar: userJson.currentava,
      username: userJson.festerusername,
      chatname: userJson.username,
      isBabo: userJson.isBabo,
      isSubscriber: userJson.isSubscriber,
      isVip: userJson.isVip,
      kayos: userJson.kayos,
      premium: userJson.premium,
      profileimg: userJson.profileimg,
      rank: userJson.rank,
      role: userJson.roll,
      schoolrank: userJson.schoolrank,
      userid: userJson.userid,
    };
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
      //console.log(event);
    });
    this.emitter.on('socketOutgoingEvent', async (event) => {
      //console.log(event);
    });
  }

  async #decodeSocketResponseData() {
    const handler = async (response: Response) => {
      if (!(response.status() === 200)) return;
      if (!response.url().includes('socket.io')) return;

      const responseText = await response.text();

      const socketEvents = responseText.split('42');

      if (!socketEvents) return;

      socketEvents.map((event) => {
        const eventNameMatch = event.match(/"(\w+)",(?:\d+|\{.*\}|\[.*\])\]/);
        const eventDataMatch = event.match(/"\w+",(\d+|\{.*\}|\[.*\])\]/);
        if (!eventNameMatch || !eventDataMatch) return;

        const eventName = eventNameMatch[1];
        const eventData = eventDataMatch[1];

        try {
          const eventDataJsonFormat = `{"data": ${eventData}}`;
          const eventDataJson = JSON.parse(eventDataJsonFormat);

          this.emitter.emit('socketIncomingEvent', {
            event: eventName,
            data: eventDataJson.data,
          });
        } catch (error) {
          console.log(error);
          console.log(eventData);
        }
      });
    };

    this.page.on('response', handler);
  }

  async #decodeSocketRequestData(): Promise<void> {
    const handler = async (request: Request): Promise<void> => {
      if (!request.url().includes('socket.io')) return;
      if (!(request.method() === 'POST')) return;

      const requestData = request.postData();

      if (!requestData) return;

      const socketEvents = requestData.match(
        /\["\w+",(?:\d+|\{.*\}|\[.*\]|true|false|undefined|null)\]/g
      );

      if (!socketEvents) return;

      socketEvents.map((event): void => {
        const eventNameMatch = event.match(
          /\["(\w+)",(?:\d+|\{.*\}|\[.*\]|true|false|undefined|null)\]/
        );
        const eventDataMatch = event.match(
          /\["\w+",(\d+|\{.*\}|\[.*\]|true|false|undefined|null)\]/
        );

        if (!eventNameMatch || !eventDataMatch) return;

        const eventName = eventNameMatch[1];
        const eventData = eventDataMatch[1];

        try {
          const eventDataJsonFormat = `{"data": ${eventData}}`;
          const eventDataJson = JSON.parse(eventDataJsonFormat);

          this.emitter.emit('socketOutgoingEvent', {
            event: eventName,
            data: eventDataJson.data,
          });
        } catch (error) {
          console.log(error);
          console.log(eventData);
        }
      });
    };

    this.page.on('request', handler);
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

        await this.joinRoom(this.currentRoom, () => {
          console.log(`Joining ${this.currentRoom} because of disconnect!`);
        });
      } catch (error) {}
    }, 2000);
  }
}

export default AACBot;
