import { Box, Flex, Heading, Link } from "@chakra-ui/layout";
import React from "react";
import NextLink from "next/link";
import { Button } from "@chakra-ui/button";
import { isServer } from "../utils/isServer";
// import { useRouter } from "next/router";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { useApolloClient } from "@apollo/client";

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
  // const router = useRouter();
  const [logout, { loading: logoutFetch }] = useLogoutMutation();
  const apolloClient = useApolloClient();
  const { data, loading } = useMeQuery({
    skip: isServer(),
  });

  let body = null;
  // useEffect(() => {
  //   console.log("data", data);
  // }, [data]);
  if (loading) {
  } else if (data?.me) {
    body = (
      <Flex align="center">
        <NextLink href="/create-post">
          <Button as={Link} mr={4} variant="link" color="blackAlpha">
            Create Post
          </Button>
        </NextLink>
        <Box mr={2}>{data.me.username}</Box>
        <Button
          variant="link"
          onClick={async () => {
            await logout();
            await apolloClient.resetStore();
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
    <Flex zIndex={1} position="sticky" top={0} p={4} bg="cyan.200">
      {" "}
      {/*bg="#9DECF9 " >*/}
      <Flex flex={1} align="center" maxW={800} m="auto">
        <NextLink href="/">
          <Link>
            <Heading>Welcome</Heading>
          </Link>
        </NextLink>
        <Box ml={"auto"}>{body}</Box>
      </Flex>
    </Flex>
  );
};
