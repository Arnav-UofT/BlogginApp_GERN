import { dedupExchange, fetchExchange, stringifyVariables } from "urql";
import { cacheExchange, Resolver } from "@urql/exchange-graphcache";
import { bUpQuery } from "./bUpQuery";
import {
  LogoutMutation,
  MeQuery,
  MeDocument,
  LoginMutation,
  RegisterMutation,
} from "../generated/graphql";
import { pipe, tap } from "wonka";
import { Exchange } from "urql";
import Router from "next/router";

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
  // const compareArgs = (
  //   fieldArgs: Variables,
  //   connectionArgs: Variables
  // ): boolean => {
  //   for (const key in connectionArgs) {
  //     if (key === cursorArgument || key === limitArgument) {
  //       continue;
  //     } else if (!(key in fieldArgs)) {
  //       return false;
  //     }

  //     const argA = fieldArgs[key];
  //     const argB = connectionArgs[key];

  //     if (
  //       typeof argA !== typeof argB || typeof argA !== 'object'
  //         ? argA !== argB
  //         : stringifyVariables(argA) !== stringifyVariables(argB)
  //     ) {
  //       return false;
  //     }
  //   }

  //   for (const key in fieldArgs) {
  //     if (key === cursorArgument || key === limitArgument) {
  //       continue;
  //     }
  //     if (!(key in connectionArgs)) return false;
  //   }

  //   return true;
  // };

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
      cache.resolve(entityKey, fieldKey) as string,
      "posts"
    );
    // console.log(
    //   "fieldKey: ",
    //   fieldKey,
    //   "infos: ",
    //   fieldInfos,
    //   "entitykey: ",
    //   entityKey
    // );
    info.partial = !isCached;
    const result: string[] = [];
    let hasNext = true;
    fieldInfos.forEach((fi) => {
      const key = cache.resolve(entityKey, fi.fieldKey) as string;
      const data = cache.resolve(key, "posts");
      const _hasNext = cache.resolve(key, "hasNext");
      if (!_hasNext) {
        hasNext = _hasNext as boolean;
      }
      result.push(...(data as string[]));
    });
    // console.log({ hasNext, posts: result });
    return { hasNext, posts: result, __typename: "PaginatedPosts" };

    // const visited = new Set();
    // let result: NullArray<string> = [];
    // let prevOffset: number | null = null;

    // for (let i = 0; i < size; i++) {
    //   const { fieldKey, arguments: args } = fieldInfos[i];
    //   if (args === null || !compareArgs(fieldArgs, args)) {
    //     continue;
    //   }

    //   const links = cache.resolve(entityKey, fieldKey) as string[];
    //   const currentOffset = args[cursorArgument];

    //   if (
    //     links === null ||
    //     links.length === 0 ||
    //     typeof currentOffset !== 'number'
    //   ) {
    //     continue;
    //   }

    //   const tempResult: NullArray<string> = [];

    //   for (let j = 0; j < links.length; j++) {
    //     const link = links[j];
    //     if (visited.has(link)) continue;
    //     tempResult.push(link);
    //     visited.add(link);
    //   }

    //   if (
    //     (!prevOffset || currentOffset > prevOffset) ===
    //     (mergeMode === 'after')
    //   ) {
    //     result = [...result, ...tempResult];
    //   } else {
    //     result = [...tempResult, ...result];
    //   }

    //   prevOffset = currentOffset;
    // }

    // const hasCurrentPage = cache.resolve(entityKey, fieldName, fieldArgs);
    // if (hasCurrentPage) {
    //   return result;
    // } else if (!(info as any).store.schema) {
    //   return undefined;
    // } else {
    //   info.partial = true;
    //   return result;
    // }
  };
};

export const createUrqlClient = (ssrExchange: any) => ({
  url: "http://localhost:4000/graphql",
  fetchOptions: {
    credentials: "include" as const,
  },
  exchanges: [
    dedupExchange,
    cacheExchange({
      updates: {
        Mutation: {
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
});
