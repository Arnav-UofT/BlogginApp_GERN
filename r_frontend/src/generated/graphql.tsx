import gql from "graphql-tag";
import * as Urql from "urql";
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]: Maybe<T[SubKey]> };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type Mutation = {
  __typename?: "Mutation";
  createPost: Post;
  updatePost: Post;
  deletePost: Scalars["Boolean"];
  register: UserRes;
  login: UserRes;
  logout: Scalars["Boolean"];
};

export type MutationCreatePostArgs = {
  title: Scalars["String"];
};

export type MutationUpdatePostArgs = {
  title?: Maybe<Scalars["String"]>;
  id: Scalars["Float"];
};

export type MutationDeletePostArgs = {
  id: Scalars["Float"];
};

export type MutationRegisterArgs = {
  options: UserPassInput;
};

export type MutationLoginArgs = {
  options: UserPassInput;
};

export type Post = {
  __typename?: "Post";
  _id: Scalars["Float"];
  createdAt: Scalars["String"];
  updatedAt: Scalars["String"];
  title: Scalars["String"];
};

export type Query = {
  __typename?: "Query";
  hello: Scalars["String"];
  posts: Array<Post>;
  post?: Maybe<Post>;
  me?: Maybe<User>;
};

export type QueryPostArgs = {
  id: Scalars["Int"];
};

export type User = {
  __typename?: "User";
  _id: Scalars["Float"];
  createdAt: Scalars["String"];
  updatedAt: Scalars["String"];
  username: Scalars["String"];
};

export type UserError = {
  __typename?: "UserError";
  field: Scalars["String"];
  message: Scalars["String"];
};

export type UserPassInput = {
  username: Scalars["String"];
  password: Scalars["String"];
};

export type UserRes = {
  __typename?: "UserRes";
  errors?: Maybe<Array<UserError>>;
  user?: Maybe<User>;
};

export type RegUserFragment = { __typename?: "User" } & Pick<
  User,
  "_id" | "username"
>;

export type LoginMutationVariables = Exact<{
  options: UserPassInput;
}>;

export type LoginMutation = { __typename?: "Mutation" } & {
  login: { __typename?: "UserRes" } & {
    errors?: Maybe<
      Array<{ __typename?: "UserError" } & Pick<UserError, "field" | "message">>
    >;
    user?: Maybe<{ __typename?: "User" } & RegUserFragment>;
  };
};

export type LogoutMutationVariables = Exact<{ [key: string]: never }>;

export type LogoutMutation = { __typename?: "Mutation" } & Pick<
  Mutation,
  "logout"
>;

export type RegisterMutationVariables = Exact<{
  username: Scalars["String"];
  password: Scalars["String"];
}>;

export type RegisterMutation = { __typename?: "Mutation" } & {
  register: { __typename?: "UserRes" } & {
    errors?: Maybe<
      Array<{ __typename?: "UserError" } & Pick<UserError, "field" | "message">>
    >;
    user?: Maybe<{ __typename?: "User" } & RegUserFragment>;
  };
};

export type MeQueryVariables = Exact<{ [key: string]: never }>;

export type MeQuery = { __typename?: "Query" } & {
  me?: Maybe<{ __typename?: "User" } & RegUserFragment>;
};

export type PostsQueryVariables = Exact<{ [key: string]: never }>;

export type PostsQuery = { __typename?: "Query" } & {
  posts: Array<
    { __typename?: "Post" } & Pick<
      Post,
      "title" | "_id" | "createdAt" | "updatedAt"
    >
  >;
};

export const RegUserFragmentDoc = gql`
  fragment RegUser on User {
    _id
    username
  }
`;
export const LoginDocument = gql`
  mutation Login($options: UserPassInput!) {
    login(options: $options) {
      errors {
        field
        message
      }
      user {
        ...RegUser
      }
    }
  }
  ${RegUserFragmentDoc}
`;

export function useLoginMutation() {
  return Urql.useMutation<LoginMutation, LoginMutationVariables>(LoginDocument);
}
export const LogoutDocument = gql`
  mutation Logout {
    logout
  }
`;

export function useLogoutMutation() {
  return Urql.useMutation<LogoutMutation, LogoutMutationVariables>(
    LogoutDocument
  );
}
export const RegisterDocument = gql`
  mutation Register($username: String!, $password: String!) {
    register(options: { username: $username, password: $password }) {
      errors {
        field
        message
      }
      user {
        ...RegUser
      }
    }
  }
  ${RegUserFragmentDoc}
`;

export function useRegisterMutation() {
  return Urql.useMutation<RegisterMutation, RegisterMutationVariables>(
    RegisterDocument
  );
}
export const MeDocument = gql`
  query Me {
    me {
      ...RegUser
    }
  }
  ${RegUserFragmentDoc}
`;

export function useMeQuery(
  options: Omit<Urql.UseQueryArgs<MeQueryVariables>, "query"> = {}
) {
  return Urql.useQuery<MeQuery>({ query: MeDocument, ...options });
}
export const PostsDocument = gql`
  query Posts {
    posts {
      title
      _id
      createdAt
      updatedAt
    }
  }
`;

export function usePostsQuery(
  options: Omit<Urql.UseQueryArgs<PostsQueryVariables>, "query"> = {}
) {
  return Urql.useQuery<PostsQuery>({ query: PostsDocument, ...options });
}
