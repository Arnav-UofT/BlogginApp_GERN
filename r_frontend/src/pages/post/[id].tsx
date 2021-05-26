import { Text } from "@chakra-ui/layout";
import { Heading, Box } from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import React, { useEffect } from "react";
import { Layout } from "../../components/Layout";
import { createUrqlClient } from "../../utils/createUrqlClient";
import { useGetPostFromUrl } from "../../utils/useGetPostFromUrl";
import { EditDeleteButtons } from "../../components/EditDeleteButtons";

const Post = ({}) => {
  const [{ data, error }] = useGetPostFromUrl();

  if (error) {
    {
      console.log(error.message);
    }
  }
  if (!data?.post) {
    return (
      <Layout>
        <Text>Post Not Found !!</Text>
      </Layout>
    );
  }
  return (
    <Layout>
      <Heading mb={4}>{data.post.title}</Heading>
      <Box mb={4}>{data.post.text}</Box>
      <EditDeleteButtons id={data.post._id} creatorId={data.post.creator._id} />
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Post);
