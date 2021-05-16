import { User } from "../entities/User";
import { MyContext } from "src/types";
import {
  Resolver,
  Mutation,
  Arg,
  Field,
  Ctx,
  ObjectType,
  Query,
} from "type-graphql";
import argon2 from "argon2";
import { EntityManager } from "@mikro-orm/postgresql";
import { COOKIE_NAME, FORGOT_PASS_KEY } from "../constants";
import { UserPassInput } from "./UserPassInput";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";

@ObjectType()
class UserError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserRes {
  @Field(() => [UserError], { nullable: true })
  errors?: UserError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Mutation(() => UserRes)
  async changePass(
    @Arg("token") token: string,
    @Arg("newPassword") newPass: string,
    @Ctx() { redis, em, req }: MyContext
  ): Promise<UserRes> {
    if (newPass.length < 3) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "Length at least 3 chars",
          },
        ],
      };
    }

    const userId = await redis.get(FORGOT_PASS_KEY + token);
    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "Bad or Expired link",
          },
        ],
      };
    }

    const user = await em.findOne(User, { _id: parseInt(userId) });

    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "User does not Exist",
          },
        ],
      };
    }

    user.password = await argon2.hash(newPass);
    await em.persistAndFlush(user);
    req.session.userId = user._id;
    // link is not valid after chaning once
    await redis.del(FORGOT_PASS_KEY + token);
    // return user to log in after change
    return { user };
  }

  @Mutation(() => Boolean)
  async forgotPass(
    @Arg("email") email: string,
    @Ctx() { em, redis }: MyContext
  ) {
    const user = await em.findOne(User, { email });
    if (!user) {
      // this email is not valid but we dont tell them the email is wrong
      return true;
    }
    const token = v4();
    await redis.set(
      FORGOT_PASS_KEY + token,
      user._id,
      "ex",
      1000 * 60 * 60 * 24
    ); // 1 day

    //'<a href="http://localhost:3000/change-password/token"> reset password </a>'
    sendEmail(
      email + "abc.com",
      `<a href="http://localhost:3000/change-password/${token}"> reset password </a>`
    );

    return true;
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() { em, req }: MyContext) {
    if (!req.session.userId) {
      return null;
    }
    const user = await em.findOne(User, { _id: req.session.userId });
    return user;
  }

  @Mutation(() => UserRes)
  async register(
    @Arg("options") options: UserPassInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserRes> {
    const errors = validateRegister(options);
    if (errors) return { errors };
    const hashedpass = await argon2.hash(options.password);
    // const user = em.create(User, {
    //   username: options.username,
    //   password: hashedpass,
    // });
    let user;
    try {
      const result = await (em as EntityManager)
        .createQueryBuilder(User)
        .getKnexQuery()
        .insert({
          username: options.username,
          password: hashedpass,
          email: options.email,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning("*");
      user = result[0];
      // await em.persistAndFlush(user);
    } catch (err) {
      // err.details.includes("already exists")
      if (err.code === "23505") {
        return {
          errors: [
            {
              field: "usernameOrEmail",
              message: "This username is taken! :)",
            },
          ],
        };
      }
    }
    // registering also makes a cookie
    // logs the new user in
    req.session!.userId = (user as User)._id;
    return { user };
  }

  @Mutation(() => UserRes)
  async login(
    //@Arg("options") options: UserPassInput,
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { em, req }: MyContext
  ): Promise<UserRes> {
    const user = await em.findOne(
      User,
      usernameOrEmail.includes("@")
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail }
    );
    if (!user) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "Username does not exist",
          },
        ],
      };
    }

    const validpass = await argon2.verify(user.password, password);
    if (!validpass) {
      return {
        errors: [
          {
            field: "password",
            message: "Incorrect Password",
          },
        ],
      };
    }

    req.session!.userId = user._id;

    return { user };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }
        resolve(true);
      })
    );
  }
}
