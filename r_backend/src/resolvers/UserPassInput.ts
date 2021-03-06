import { InputType, Field } from "type-graphql";

@InputType()
export class UserPassInput {
  @Field()
  username: string;
  @Field()
  password: string;
  @Field()
  email: string;
}
