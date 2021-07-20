import "reflect-metadata";
import { COOKIE_NAME, __prod__ } from "./constants";
import { Post } from "./entities/Post";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import cors from "cors";
import { createConnection } from "typeorm";
import { User } from "./entities/User";
import path from "path";
import { Updoot } from "./entities/Updoot";
import { createUserLoader } from "./utils/createUserLoader";
import { createVoteLoader } from "./utils/createVoteLoader";

const main = async () => {
  const conn = await createConnection({
    type: "postgres",
    database: "testdb",
    username: "postgres",
    password: "postgres",
    host: process.env.DB_HOST || "localhost",
    logging: true,
    synchronize: true,
    entities: [Post, User, Updoot],
    migrations: [path.join(__dirname, "./migrations/*")],
  });

  const apolloSever = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    // batch and cache multiple user loading request into one request
    context: ({ req, res }) => ({
      req,
      res,
      redis,
      userLoader: createUserLoader(),
      voteLoader: createVoteLoader(),
    }),
  });
  await apolloSever.start();
  // await Post.delete({});
  await conn.runMigrations();
  const app = express();
  app.listen(process.env.PORT || 4000, () => {
    console.log("Server Ready :) on port:4000");
  });

  const RedisStore = connectRedis(session);
  const redis = new Redis({
    host: process.env.REDIS_HOST || "localhost",
  });

  app.use(
    cors({
      origin: process.env.ORIGIN || "http://localhost:3000",
      credentials: true,
    })
  );

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTouch: true,
        disableTTL: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
        httpOnly: true,
        sameSite: "lax", //csrf
        secure: __prod__, // cookie only in https
      },
      saveUninitialized: false,
      secret: "somerandomsecret",
      resave: false,
    })
  );

  apolloSever.applyMiddleware({
    app,
    cors: {
      origin: process.env.ORIGIN || "http://localhost:3000",
      credentials: true,
    }, //false, //{ origin: "http://localhost:3000" },
  });
};

main().catch((err) => {
  console.error(err);
});
