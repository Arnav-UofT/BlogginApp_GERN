import DataLoader from "dataloader";
import { Updoot } from "../entities/Updoot";

// take input keys and returns objects reffered by those keys
// keys -> [{postid, userids}, {postid, userid}, ...]
// send back updoots
export const createVoteLoader = () =>
  new DataLoader<{ postId: number; userId: number }, Updoot | null>(
    async (keys) => {
      const votes = await Updoot.findByIds(keys as any);

      const upddotIdsToVote: Record<string, Updoot> = {};
      votes.forEach((u) => {
        upddotIdsToVote[`${u.userId}|${u.postId}`] = u;
      });

      return keys.map((key) => upddotIdsToVote[`${key.userId}|${key.postId}`]);
    }
  );
