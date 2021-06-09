import { Flex, Link, Stack } from "@chakra-ui/layout";
import { Box, Button, Heading, Text } from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import React, { useState } from "react";
import { EditDeleteButtons } from "../components/EditDeleteButtons";
import { Layout } from "../components/Layout";
import { Voting } from "../components/Voting";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

const Index = () => {
  const [variables, setVariables] = useState({
    limit: 10,
    cursor: null as null | string,
  });
  const [{ data, fetching }] = usePostsQuery({
    // pause: isServer(),
    variables,
  });

  // const [posts, setPosts] = useState({});

  // useEffect(() => {
  //   setPosts(data.posts);
  // }, [fetching]);

  // if (!fetching && !data) {
  //   return (
  //     <div>
  //       Query failed due to some Error. No Posts
  //       {error?.message}
  //     </div>
  //   );
  // }
  return (
    <Layout variant="regular">
      {/* <Flex>
        <Heading> Welcome to My_Reddit </Heading>
        <NextLink href="/create-post">
          <Link ml="auto"> Create a Post</Link>
        </NextLink>
      </Flex> 
      <br />*/}
      {!data && fetching ? (
        <div>Loading posts for you</div>
      ) : data?.posts?.posts?.length === 0 ? (
        <div>Welcome - Be the first to Post!</div>
      ) : (
        <Stack spacing={4}>
          {data!.posts?.posts?.map((p) =>
            !p ? null : (
              <Flex key={p._id} p={5} shadow="md" borderWidth="1px">
                <Voting post={p} />
                <Box paddingLeft={5} flex={1}>
                  <NextLink href="/post/[id]" as={`/post/${p._id}`}>
                    <Link>
                      <Heading fontSize="xl">{p.title}</Heading>
                    </Link>
                  </NextLink>
                  <Text> by {p.creator.username}</Text>
                  <Text mt={4}>{p.textSnippet}...</Text>
                </Box>
                <Box ml="auto">
                  <EditDeleteButtons id={p._id} creatorId={p.creator._id} />
                </Box>
              </Flex>
            )
          )}
        </Stack>
      )}
      {data && data.posts?.hasNext ? (
        <Flex>
          <Button
            m="auto"
            my={8}
            variant="solid"
            colorScheme="blackAlpha"
            onClick={() => {
              setVariables({
                limit: variables.limit,
                cursor: data.posts.posts[data.posts.posts.length - 1].createdAt,
              });
            }}
          >
            Load More...
          </Button>
        </Flex>
      ) : null}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: false })(Index);
