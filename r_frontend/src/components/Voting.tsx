import { ApolloCache } from "@apollo/client";
import { ArrowUpIcon, ArrowDownIcon } from "@chakra-ui/icons";
import { Flex, IconButton, Box } from "@chakra-ui/react";
import gql from "graphql-tag";
import React, { useState } from "react";
import { VoteMutation } from "../generated/graphql";
import { RegPostSnipFragment, useVoteMutation } from "../generated/grapqhl";

interface VotingProps {
  post: RegPostSnipFragment; //PostsQuery['posts']['posts'][0]
}
const updateAfterVote = (
  value: number,
  postId: number,
  cache: ApolloCache<VoteMutation>
) => {
  const data = cache.readFragment<{
    id: number;
    points: number;
    voteStatus: number | null;
  }>({
    id: "Post:" + postId,
    fragment: gql`
      fragment getPoints on Post {
        points
        _id
        voteStatus
      }
    `,
  });
  if (data) {
    if (data.voteStatus === value) {
      return;
    }
    const newPoints =
      (data.points as number) + (!data.voteStatus ? 1 : 2) * value;
    cache.writeFragment({
      id: "Post:" + postId,
      fragment: gql`
        fragment __ on Post {
          points
          voteStatus
        }
      `,
      data: { points: newPoints, voteStatus: value },
    });
  }
};
export const Voting: React.FC<VotingProps> = ({ post }) => {
  const [loadingState, setLoadingState] = useState<
    "up-loading" | "down-loading" | "not-loading"
  >("not-loading");
  const [vote] = useVoteMutation();
  return (
    <Flex direction="column" align="center" justifyContent="center">
      <IconButton
        variant={post.voteStatus === 1 ? "solid" : "outline"}
        aria-label="Upvote"
        icon={<ArrowUpIcon />}
        size="sm"
        isLoading={loadingState === "up-loading"}
        colorScheme={post.voteStatus === 1 ? "green" : "#2A4365"}
        onClick={async () => {
          setLoadingState("up-loading");
          await vote({
            variables: { postId: post._id, value: 1 },
            update: (cache) => updateAfterVote(1, post._id, cache),
          });
          setLoadingState("not-loading");
        }}
      />
      <Box>{post.points}</Box>
      <IconButton
        variant={post.voteStatus === -1 ? "solid" : "outline"}
        aria-label="Downvote"
        icon={<ArrowDownIcon />}
        size="sm"
        isLoading={loadingState === "down-loading"}
        colorScheme={post.voteStatus === -1 ? "pink" : "#2A4365"}
        onClick={async () => {
          setLoadingState("down-loading");
          await vote({
            variables: { postId: post._id, value: -1 },
            update: (cache) => updateAfterVote(-1, post._id, cache),
          });
          setLoadingState("not-loading");
        }}
      />
    </Flex>
  );
};
