interface OwnAACUser {
  activityPoints: number;
  activityPointsToday: number;
  academyPoints: number;
  currentAvatar: string;
  username: string;
  chatname: string;
  houseData: any;
  isBabo: boolean | null;
  isSubscriber: boolean | null;
  isVip: boolean | null;
  kayos: number;
  premium: boolean | null;
  profileImg: string | null;
  rank: number;
  role: string;
  schoolRank: number;
  userId: number;
}

export default OwnAACUser;
