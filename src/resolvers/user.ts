import { User } from "../entities/User";
import { MyContext } from "src/types";
import {
  Resolver,
  Mutation,
  Arg,
  InputType,
  Field,
  Ctx,
  ObjectType,
} from "type-graphql";
import argon2 from "argon2";

@InputType()
class UserPassInput {
  @Field()
  username: string;
  @Field()
  password: string;
}

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
  async register(
    @Arg("options") options: UserPassInput,
    @Ctx() { em }: MyContext
  ): Promise<UserRes> {
    if (options.username.length < 3) {
      return {
        errors: [
          {
            field: "username",
            message: "Username needs at least 3 chars",
          },
        ],
      };
    }
    if (options.password.length < 3) {
      return {
        errors: [
          {
            field: "password",
            message: "Password needs at least 3 chars",
          },
        ],
      };
    }

    const hashedpass = await argon2.hash(options.password);
    const user = em.create(User, {
      username: options.username,
      password: hashedpass,
    });
    try {
      await em.persistAndFlush(user);
    } catch (err) {
      if (err.code === "23505") {
        return {
          errors: [
            {
              field: "username",
              message: "This username is taken! :)",
            },
          ],
        };
      }
      console.log("message: ", err.message);
    }
    return { user };
  }

  @Mutation(() => UserRes)
  async login(
    @Arg("options") options: UserPassInput,
    @Ctx() { em }: MyContext
  ): Promise<UserRes> {
    const user = await em.findOne(User, { username: options.username });
    if (!user) {
      return {
        errors: [
          {
            field: "username",
            message: "Username does not exist",
          },
        ],
      };
    }

    const validpass = await argon2.verify(user.password, options.password);
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

    return { user };
  }
}
