import { ArrowUpIcon, ArrowDownIcon } from "@chakra-ui/icons";
import { Flex, IconButton, Box } from "@chakra-ui/react";
import React, { useState } from "react";
import { RegPostSnipFragment, useVoteMutation } from "../generated/graphql";

interface VotingProps {
  post: RegPostSnipFragment; //PostsQuery['posts']['posts'][0]
}

export const Voting: React.FC<VotingProps> = ({ post }) => {
  const [loadingState, setLoadingState] =
    useState<"up-loading" | "down-loading" | "not-loading">("not-loading");
  const [, vote] = useVoteMutation();
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
          await vote({ postId: post._id, value: 1 });
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
          await vote({ postId: post._id, value: -1 });
          setLoadingState("not-loading");
        }}
      />
    </Flex>
  );
};
