import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { usePostsQuery } from "../generated/graphql";
import { isServer } from "../utils/isServer";
import { Layout } from "../components/Layout";
import NextLink from "next/link";
import { Link } from "@chakra-ui/layout";

const Index = () => {
  const [{ data }] = usePostsQuery({
    pause: isServer(),
  });
  console.log(data);
  return (
    <Layout>
      <NextLink href="/create-post">
        <Link> Create a Post</Link>
      </NextLink>
      <br />
      {!data ? (
        <div>loading</div>
      ) : (
        data.posts.map((p) => <div key={p._id}>{p.title}</div>)
      )}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
