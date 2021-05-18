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
import { COOKIE_NAME, FORGOT_PASS_KEY } from "../constants";
import { UserPassInput } from "./UserPassInput";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";
import { getConnection } from "typeorm";

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
    @Ctx() { redis, req }: MyContext
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

    const userIdparse = parseInt(userId);
    const user = await User.findOne(userId);

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

    await User.update(
      { _id: userIdparse },
      { password: await argon2.hash(newPass) }
    );
    req.session.userId = user._id;
    // link is not valid after chaning once
    await redis.del(FORGOT_PASS_KEY + token);
    // return user to log in after change
    return { user };
  }

  @Mutation(() => Boolean)
  async forgotPass(@Arg("email") email: string, @Ctx() { redis }: MyContext) {
    const user = await User.findOne({ where: { email } });
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
    ); // 1 day in mili

    //'<a href="http://localhost:3000/change-password/token"> reset password </a>'
    sendEmail(
      email,
      `<a href="http://localhost:3000/change-password/${token}"> reset password </a>`
    );

    return true;
  }

  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext) {
    if (!req.session.userId) {
      return null;
    }
    return User.findOne(req.session.userId);
  }

  @Mutation(() => UserRes)
  async register(
    @Arg("options") options: UserPassInput,
    @Ctx() { req }: MyContext
  ): Promise<UserRes> {
    const errors = validateRegister(options);
    if (errors) return { errors };
    const hashedpass = await argon2.hash(options.password);

    let user;
    try {
      // User.create({values go here}).save()
      const result = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          username: options.username,
          password: hashedpass,
          email: options.email,
        })
        .returning("*")
        .execute();

      user = result.raw[0];
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
    req.session.userId = user._id;
    return { user };
  }

  @Mutation(() => UserRes)
  async login(
    //@Arg("options") options: UserPassInput,
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { req }: MyContext
  ): Promise<UserRes> {
    const user = await User.findOne(
      usernameOrEmail.includes("@")
        ? { where: { email: usernameOrEmail } }
        : { where: { username: usernameOrEmail } }
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
