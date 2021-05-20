import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { usePostsQuery } from "../generated/graphql";
import { isServer } from "../utils/isServer";
import { Layout } from "../components/Layout";
import NextLink from "next/link";
import { Flex, Link, Stack } from "@chakra-ui/layout";
import React, { useState } from "react";
import { Box, Button, Heading, Text } from "@chakra-ui/react";

const Index = () => {
  const [variables, setVariables] = useState({
    limit: 10,
    cursor: null as null | string,
  });
  const [{ data, fetching }] = usePostsQuery({
    // pause: isServer(),
    variables,
  });

  if (!fetching && !data) {
    return <div>Query failed due to some Error. No Posts.</div>;
  }
  return (
    <Layout variant="regular">
      <Flex>
        <Heading> Welcome to My_Reddit </Heading>
        <NextLink href="/create-post">
          <Link ml="auto"> Create a Post</Link>
        </NextLink>
      </Flex>
      <br />
      {!data && fetching ? (
        <div>Loading posts for you</div>
      ) : (
        <Stack spacing={4}>
          {data!.posts.posts.map((p) => (
            <Box key={p._id} p={5} shadow="md" borderWidth="1px">
              <Heading fontSize="xl">{p.title}</Heading>
              <Text mt={4}>{p.textSnippet}...</Text>
            </Box>
          ))}
        </Stack>
      )}
      {data && data.posts.hasNext ? (
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

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
