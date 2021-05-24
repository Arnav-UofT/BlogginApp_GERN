import { dedupExchange, fetchExchange, gql, stringifyVariables } from "urql";
import { cacheExchange, Resolver } from "@urql/exchange-graphcache";
import { bUpQuery } from "./bUpQuery";
import {
  LogoutMutation,
  MeQuery,
  MeDocument,
  LoginMutation,
  RegisterMutation,
  VoteMutationVariables,
} from "../generated/graphql";
import { pipe, tap } from "wonka";
import { Exchange } from "urql";
import Router from "next/router";
import { isServer } from "./isServer";

const errorExchange: Exchange =
  ({ forward }) =>
  (ops$) => {
    return pipe(
      forward(ops$),
      tap(({ error }) => {
        if (error?.message.includes("Not Loggen In")) {
          Router.replace("/login");
        }
      })
    );
  };

const cursorPagination = (): //offsetArgument: cursorArgument = "cursor"
Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;
    // console.log(entityKey, fieldName);
    const allFields = cache.inspectFields(entityKey);
    // console.log(allFields);
    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);
    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }
    // console.log(cache);
    // how to decide when to update cache
    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
    const isCached = cache.resolve(
      cache.resolveFieldByKey(entityKey, fieldKey) as string,
      "posts"
    );
    info.partial = !isCached;
    const results: string[] = [];
    let hasNext = true;
    fieldInfos.forEach((fi) => {
      const key = cache.resolveFieldByKey(entityKey, fi.fieldKey) as string;
      const data = cache.resolve(key, "posts") as string[];
      const _hasNext = cache.resolve(key, "hasNext");
      if (!_hasNext) {
        hasNext = _hasNext as boolean;
      }
      results.push(...data);
    });
    // console.log({ hasNext, posts: result });
    return { __typename: "PaginatedPosts", posts: results, hasNext };
  };
};

export const createUrqlClient = (ssrExchange: any, ctx: any) => {
  let cookie = "";
  if (isServer()) {
    cookie = ctx?.req?.headers?.cookie;
  }

  return {
    url: "http://localhost:4000/graphql",
    fetchOptions: {
      credentials: "include" as const,
      headers: cookie
        ? {
            cookie,
          }
        : undefined,
    },
    exchanges: [
      dedupExchange,
      cacheExchange({
        updates: {
          Mutation: {
            vote: (_result, _args, cache, _info) => {
              const { postId, value } = _args as VoteMutationVariables;
              const data = cache.readFragment(
                gql`
                  fragment getPoints on Post {
                    points
                    _id
                    voteStatus
                  }
                `,
                { id: postId }
              ); // Data or null

              if (data) {
                if (data.voteStatus === value) {
                  return;
                }
                const newPoints =
                  (data.points as number) + (!data.voteStatus ? 1 : 2) * value;
                cache.writeFragment(
                  gql`
                    fragment updatePoints on Post {
                      points
                      voteStatus
                    }
                  `,
                  { id: postId, points: newPoints, voteStatus: value }
                );
              }
            },
            createPost: (_result, _args, cache, _info) => {
              // 1 option is put post on top
              // 2nd invalidate the query then it resest the whole thing
              // 3rd invalidate by insoecting the fields of cache (like cursorpagin)
              const allFields = cache.inspectFields("Query");
              const fieldInfos = allFields.filter(
                (info) => info.fieldName === "posts"
              );
              fieldInfos.forEach((fi) => {
                cache.invalidate("Query", "posts", fi.arguments || {});
              });
              //  this option 2
              // cache.invalidate("Query", "posts", {
              //   limit: 10,
              //   cursor: null,
              // });
            },
            logout: (_result, _args, cache, _info) => {
              bUpQuery<LogoutMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                () => ({ me: null })
              );
            },
            login: (_result, _args, cache, _info) => {
              bUpQuery<LoginMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                (result, query) => {
                  if (result.login.errors) {
                    return query;
                  } else {
                    return { me: result.login.user };
                  }
                }
              );
            },
            register: (_result, _args, cache, _info) => {
              bUpQuery<RegisterMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                (result, query) => {
                  if (result.register.errors) {
                    return query;
                  } else {
                    return { me: result.register.user };
                  }
                }
              );
            },
          },
        },
        keys: {
          PaginatedPosts: () => null,
        },
        resolvers: {
          Query: {
            posts: cursorPagination(),
          },
        },
      }),
      errorExchange,
      ssrExchange,
      fetchExchange,
    ],
  };
};
