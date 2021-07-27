import { Box, Flex, Button } from "@chakra-ui/react";
import { Formik, Form } from "formik";
// import { withUrqlClient } from "next-urql";
import React, { useState } from "react";
import { useForgotPasswordMutation } from "../generated/graphql";
import { InputField } from "../components/InputField";
import { Wrapper } from "../components/Wrapper";
import { with_MyApollo } from "../utils/createApolloClient";
// import { createUrqlClient } from "../utils/createUrqlClient";

const ForgotPassword: React.FC<{}> = ({}) => {
  const [forgotPass] = useForgotPasswordMutation();
  const [complete, setComplete] = useState(false);
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ email: "" }}
        onSubmit={async (values) => {
          await forgotPass({ variables: { ...values } });
          setComplete(true);
        }}
      >
        {({ isSubmitting }) =>
          complete ? (
            <Box> Link sent to your email! </Box>
          ) : (
            <Form>
              <InputField name="email" label="Email"></InputField>
              <Flex>
                <Button
                  mt={4}
                  type="submit"
                  isLoading={isSubmitting}
                  colorScheme="blackAlpha"
                >
                  Get Reset Link
                </Button>
              </Flex>
            </Form>
          )
        }
      </Formik>
    </Wrapper>
  );
};

export default with_MyApollo({ ssr: false })(ForgotPassword); //withUrqlClient(createUrqlClient)(ForgotPassword);
