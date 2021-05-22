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
        colorScheme="pink"
        variant="outline"
        aria-label="Upvote"
        icon={<ArrowUpIcon />}
        // isActive="false"
        size="sm"
        isLoading={loadingState === "up-loading"}
        onClick={async () => {
          setLoadingState("up-loading");
          await vote({ postId: post._id, value: 1 });
          setLoadingState("not-loading");
        }}
      />
      <Box>{post.points}</Box>
      <IconButton
        colorScheme="pink"
        variant="outline"
        aria-label="Downvote"
        icon={<ArrowDownIcon />}
        size="sm"
        isLoading={loadingState === "down-loading"}
        onClick={async () => {
          setLoadingState("down-loading");
          await vote({ postId: post._id, value: -1 });
          setLoadingState("not-loading");
        }}
      />
    </Flex>
  );
};
