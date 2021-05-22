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
  Info,
} from "type-graphql";
import { MyContext } from "src/types";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";
import { Updoot } from "../entities/Updoot";

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
    @Arg("cursor", () => String, { nullable: true }) cursor: string
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);
    const extraLimit = realLimit + 1;
    //fetch 1 extra to check if there are more

    const replacement: any[] = [extraLimit];
    if (cursor) {
      replacement.push(new Date(parseInt(cursor)));
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
      ) creator
    FROM post p
    INNER JOIN public.user u ON u._id = p."creatorId"
    ${cursor ? `WHERE p."createdAt" < $2` : ""}
    ORDER BY p."createdAt" DESC
    limit $1
    `,
      replacement
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
  post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
    return Post.findOne(id);
  }

  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }

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
    // await Updoot.insert({ userId, postId, value: realVal });

    await getConnection().query(
      `
      START TRANSACTION;
      INSERT INTO updoot ("userId", "postId", value)
      values (${userId}, ${postId}, ${realVal});
      UPDATE post
      SET points = points + ${realVal}
      WHERE _id = ${postId};
      COMMIT;
    `
    );

    // await Post.update()
    return true;
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
  async updatePost(
    @Arg("id") id: number,
    @Arg("title", () => String, { nullable: true }) title: string
  ): Promise<Post | null> {
    const post = await Post.findOne(id);
    if (!post) {
      return null;
    }
    if (typeof title !== "undefined") {
      await Post.update({ _id: id }, { title });
    }
    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(@Arg("id") id: number): Promise<boolean> {
    await Post.delete(id);
    return true;
  }
}
