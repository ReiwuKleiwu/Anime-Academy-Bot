import { Page, Response, Request } from 'playwright';
import OwnAACUser from '../interfaces/OwnAACUser.interface';
import AACClient from './AACClient';

class AACDataService {
  private page: Page;
  private aacClient: AACClient;

  constructor(page: Page, emitter: AACClient) {
    this.page = page;
    this.aacClient = emitter;
  }

  async decodeSocketResponseData(): Promise<void> {
    const handler = async (response: Response) => {
      if (!(response.status() === 200)) return;
      if (!response.url().includes('socket.io')) return;

      const responseText = await response.text();

      const socketEvents = responseText.split('42[');

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

          this.aacClient.emit(eventName, {
            client: this.aacClient,
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

  async decodeSocketRequestData(): Promise<void> {
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

          // this.aacClient.emit(eventName, {
          //   client: this.aacClient,
          //   data: eventDataJson.data,
          // });
        } catch (error) {
          console.log(error);
          console.log(eventData);
        }
      });
    };

    this.page.on('request', handler);
  }

  async getOwnUser(): Promise<OwnAACUser> {
    const userData = await this.page.request.get(
      'https://www.anime.academy/data/Ownusername'
    );
    const userJson = await userData.json();

    return {
      activityPoints: userJson.activitypoints,
      activityPointsToday: userJson.activitypoints_today,
      academyPoints: userJson.aps,
      currentAvatar: userJson.currentava,
      username: userJson.festerusername,
      chatname: userJson.username,
      houseData: userJson.houseData,
      isBabo: userJson.isBabo,
      isSubscriber: userJson.isSubscriber,
      isVip: userJson.isVip,
      kayos: userJson.kayos,
      premium: userJson.premium,
      profileImg: userJson.profileimg,
      rank: userJson.rank,
      role: userJson.roll,
      schoolRank: userJson.schoolrank,
      userId: userJson.userid,
    };
  }
}

export default AACDataService;
