import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { MikroORM } from "@mikro-orm/core";
import path from "path";
import { User } from "./entities/User";

// console.log('dirName: ', __dirname)
export default {
  entities: [Post, User],
  dbName: "my_reddit",
  type: "postgresql",
  //user: 'arnavgupta',
  //password: 'password',
  // host: 'localhost',
  // port: 5432,
  debug: !__prod__,
  migrations: {
    path: path.join(__dirname, "./migrations"), // path to the folder with migrations
    pattern: /^[\w-]+\d+\.[jt]s$/,
  },
} as Parameters<typeof MikroORM.init>[0];
