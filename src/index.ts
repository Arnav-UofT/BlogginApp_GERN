import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import mConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import redis from "redis";
import session from "express-session";
import connectRedis from "connect-redis";
import { MyContext } from "./types";

const main = async () => {
  const orm = await MikroORM.init(mConfig);
  await orm.getMigrator().up();

  const app = express();
  app.listen(4000, () => {
    console.log("Server Reddi :) on port 4k");
  });

  const RedisStore = connectRedis(session);
  const redisClient = redis.createClient();
  app.use(
    session({
      name: "qid",
      store: new RedisStore({
        client: redisClient,
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
    context: ({ req, res }): MyContext => ({ em: orm.em, req, res }),
  });

  apolloSever.applyMiddleware({ app });
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
