import { ApolloClient, InMemoryCache } from "@apollo/client";
// import { withApollo } from "next-apollo";
import { createWithApollo } from "./createMyApollo";
import { PaginatedPosts } from "../generated/graphql";
import { NextPageContext } from "next";
import { isServer } from "./isServer";

const _client = (ctx: NextPageContext) =>
  new ApolloClient({
    uri: process.env.API_URL || "http://localhost:4000/graphql",
    credentials: "include",
    headers: {
      cookie: (isServer() ? ctx.req?.headers.cookie : undefined) || "",
    },
    cache: new InMemoryCache({
      typePolicies: {
        Agenda: {
          fields: {
            posts: {
              keyArgs: [],
              merge(
                existing: PaginatedPosts | undefined,
                incoming: PaginatedPosts
              ): PaginatedPosts {
                return {
                  ...incoming,
                  posts: [...(existing?.posts || []), ...incoming.posts],
                };
              },
            },
          },
        },
      },
    }),
  });

export const with_MyApollo = createWithApollo(_client);
``;
