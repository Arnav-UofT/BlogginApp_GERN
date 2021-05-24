import { Box, Flex, Link } from "@chakra-ui/layout";
import React, { useEffect } from "react";
import NextLink from "next/link";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { Button } from "@chakra-ui/button";
interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
  const [{ fetching: logoutFetch }, logout] = useLogoutMutation();
  const [{ data, fetching }] = useMeQuery();
  let body = null;
  useEffect(() => {
    console.log("data", data);
  }, [data]);
  if (fetching) {
  } else if (data?.me) {
    body = (
      <Flex>
        <Box mr={2}>{data.me.username}</Box>
        <Button
          variant="link"
          onClick={() => {
            logout();
          }}
          isLoading={logoutFetch}
        >
          logout
        </Button>
      </Flex>
    );
  } else {
    body = (
      <>
        <NextLink href="/login">
          <Link mr={4}>login</Link>
        </NextLink>
        <NextLink href="/register">
          <Link>register</Link>
        </NextLink>
      </>
    );
  }

  return (
    <Flex zIndex={1} position="sticky" top={0} bg="#9DECF9" p={4}>
      <Box ml={"auto"}>{body}</Box>
    </Flex>
  );
};
