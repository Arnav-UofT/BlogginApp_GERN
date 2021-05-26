import DataLoader from "dataloader";
import { User } from "../entities/User";

// take input keys and returns objects reffered by those keys
export const createUserLoader = () =>
  new DataLoader<number, User>(async (keys) => {
    const users = await User.findByIds(keys as number[]);

    const userIdtoUser: Record<number, User> = {};
    users.forEach((u) => {
      userIdtoUser[u._id] = u;
    });

    return keys.map((key) => userIdtoUser[key]);
  });
