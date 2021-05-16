import { withUrqlClient } from "next-urql";
import { NavBar } from "../components/NavBar";
import { createUrqlClient } from "../utils/createUrqlClient";
import { usePostsQuery } from "../generated/graphql";
import { isServer } from "../utils/isServer";

const Index = () => {
  const [{ data }] = usePostsQuery({
    pause: isServer(),
  });
  return (
    <>
      <NavBar />
      <div>hello world </div>
      <br />
      {!data ? (
        <div>loading</div>
      ) : (
        data.posts.map((p) => <div key={p._id}>{p.title}</div>)
      )}
    </>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
