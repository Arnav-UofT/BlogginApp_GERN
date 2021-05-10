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

const main = async () => {
  const orm = await MikroORM.init(mConfig);
  await orm.getMigrator().up();

  const app = express();
  app.listen(4000, () => {
    console.log("Server Reddi :) on port 4k");
  });

  const apolloSever = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: () => ({ em: orm.em }),
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
