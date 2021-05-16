import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { COOKIE_NAME, __prod__ } from "./constants";
import {} from "./entities/Post";
import mConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import { MyContext } from "./types";
import cors from "cors";

const main = async () => {
  //sendEmail("test@test.com", "Hi bro :)");

  const orm = await MikroORM.init(mConfig);
  // await orm.em.nativeDelete(User, {});
  await orm.getMigrator().up();

  const app = express();
  app.listen(4000, () => {
    console.log("Server Reddi :) on port 4k");
  });

  const RedisStore = connectRedis(session);
  const redis = new Redis();

  app.use(
    cors({
      origin: "http://localhost:3000",
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

  const apolloSever = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }): MyContext => ({ em: orm.em, req, res, redis }),
  });

  apolloSever.applyMiddleware({
    app,
    cors: false, //{ origin: "http://localhost:3000" },
  });
  // app.get('/', (req, res) => {
  //     res.send("hello")
  // }) // example EXPRESS endpoint

  // ----------------------ORM stuff below
  // const post = orm.em.create(Post, {title: 'First post'})
  // await orm.em.persistAndFlush(post)

  // const posts = await orm.em.find(Post, {})
  // console.log(posts)
  //THIS one is useless LOL await orm.em.nativeInsert(Post, {title: 'Second post'})
};

main().catch((err) => {
  console.error(err);
});
