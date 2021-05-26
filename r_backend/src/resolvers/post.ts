import { Post } from "../entities/Post";
import {
  Resolver,
  Query,
  Arg,
  Int,
  Mutation,
  Field,
  InputType,
  Ctx,
  UseMiddleware,
  FieldResolver,
  Root,
  ObjectType,
} from "type-graphql";
import { MyContext } from "src/types";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";
import { Updoot } from "../entities/Updoot";
import { User } from "../entities/User";

@InputType()
export class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field()
  hasNext: boolean;
}

@Resolver(Post)
export class PostResolver {
  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string,
    @Ctx() { req }: MyContext
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);
    const extraLimit = realLimit + 1;
    //fetch 1 extra to check if there are more

    const replacements: any[] = [extraLimit];
    if (req.session.userId) {
      replacements.push(req.session.userId);
    }
    let cursorIdx = 3;
    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
      cursorIdx = replacements.length;
    }

    const posts = await getConnection().query(
      `
    SELECT p.*,
    json_build_object(
      '_id', u._id,
      'username', u.username,
      'email', u.email,
      'createdAt', u."createdAt",
      'updatedAt', u."updatedAt"
      ) creator,
      ${
        req.session.userId
          ? '(select value from updoot where "userId" = $2 and "postId" = p._id) "voteStatus"'
          : 'null "voteStatus"'
      }
    FROM post p
    INNER JOIN public.user u ON u._id = p."creatorId"
    ${cursor ? `WHERE p."createdAt" < $${cursorIdx}` : ""}
    ORDER BY p."createdAt" DESC
    limit $1
    `,
      replacements
    );

    // const qB = getConnection() ---- THIS is from query builder
    //   .getRepository(Post)
    //   .createQueryBuilder("p")
    //   .innerJoinAndSelect("p.creator", "u", 'u._id = p."creatorId"')
    //   .orderBy('p."createdAt"', "DESC")
    //   .take(extraLimit);

    // if (cursor) {
    //   // this helps to get data before the cursor value
    //   // Any posts (limited) before the passed data are returned in descending
    //   qB.where('p."createdAt" < :cursor', {
    //     cursor: new Date(parseInt(cursor)),
    //   });
    // }
    // const posts = await qB.getMany();
    // console.log(posts);
    return {
      posts: posts.slice(0, realLimit),
      hasNext: posts.length === extraLimit,
    };
    // return Post.find();
  }

  @Query(() => Post, { nullable: true })
  async post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
    const post = await Post.findOne(id, { relations: ["creator"] });

    // const post = await getConnection()
    //   .createQueryBuilder()
    //   .relation(Post, "creator")
    //   .of(id)
    //   .loadOne();

    // console.log("post", post);

    // const post1 = getConnection()
    // .createQueryBuilder()
    //   .getOne(Post)
    //   .where('_id = :id and "creatorId" = :creatorId', {
    //     id,
    //     creatorId: req.session.userId,
    //   })
    //   .returning("*")
    //   .execute();

    //   `
    // SELECT p.*,
    // json_build_object(
    //   '_id', u._id,
    //   'username', u.username
    //   ) creator
    // FROM post p
    // LEFT JOIN public.user u ON p._id = $1
    // `,
    //   [id]
    // );
    return post;
  }

  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }
  // @FieldResolver(() => String)
  // creator(@Root() root: Post) {
  //   return root.creator;
  // }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const { userId } = req.session;
    const isUpdoot = value !== -1;
    const realVal = isUpdoot ? 1 : -1;
    const updoot = await Updoot.findOne({ where: { userId, postId } });

    // this user already voted this post
    // but wants to change ;)
    if (updoot && updoot.value !== realVal) {
      await getConnection().transaction(async (tm) => {
        tm.query(
          `
          UPDATE updoot
          SET value = $1
          WHERE "postId" = $2 and "userId" = $3;
        `,
          [realVal, postId, userId]
        );
        await tm.query(
          `
          UPDATE post
          SET points = points + $1
          WHERE _id = $2;
        `,
          [2 * realVal, postId]
        );
      });
    } else if (!updoot) {
      // not voted before
      await getConnection().transaction(async (tm) => {
        tm.query(
          `
          INSERT INTO updoot ("userId", "postId", value)
          values ($1, $2, $3);
        `,
          [userId, postId, realVal]
        );
        await tm.query(
          `
          UPDATE post
          SET points = points + $1
          WHERE _id = $2;
        `,
          [realVal, postId]
        );
      });
    }
    return true;
    // 1 - DIRECT await Updoot.insert({ userId, postId, value: realVal });
    //

    // 2 - BUILDER await getConnection().query(
    //   `
    //   START TRANSACTION;
    //   INSERT INTO updoot ("userId", "postId", value)
    //   values (${userId}, ${postId}, ${realVal});
    //   UPDATE post
    //   SET points = points + ${realVal}
    //   WHERE _id = ${postId};
    //   COMMIT;
    // `
    // );

    // await Post.update()
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input") input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    return Post.create({ ...input, creatorId: req.session.userId }).save();
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title") title: string,
    @Arg("text") text: string,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    if (title === "") {
      return null;
    }
    const result = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('_id = :id and "creatorId" = :creatorId', {
        id,
        creatorId: req.session.userId,
      })
      .returning("*")
      .execute();
    // return Post.update(
    //   { _id: id, creatorId: req.session.userId },
    //   { title, text }
    // );
    return result.raw[0];
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    // Option 1 Cascade
    // const post = await Post.findOne(id);
    // if (!post) {
    //   return false;
    // }
    // if (post.creatorId !== req.session.userId) {
    //   throw new Error("Not Authorized to Delete");
    // }
    // await Updoot.delete({ postId: id });
    // await Post.delete({ _id: id });

    await Post.delete({ _id: id, creatorId: req.session.userId });
    return true;
  }
}
