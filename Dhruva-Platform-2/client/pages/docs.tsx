import { Box, Container, Heading, Text } from "@chakra-ui/react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { NextPage } from "next";
import { useMemo } from "react";
import type { SwaggerUIProps } from "swagger-ui-react";

const SwaggerUI = dynamic<SwaggerUIProps>(() => import("swagger-ui-react"), {
  ssr: false,
});

const DocsPage: NextPage = () => {
  const swaggerOptions = useMemo<SwaggerUIProps>(
    () => ({
      url: "/openapi.json",
      docExpansion: "none",
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      persistAuthorization: true,
    }),
    []
  );

  return (
    <>
      <Head>
        <title>Dhruva API Documentation</title>
      </Head>
      <Container maxW="6xl" py={10}>
        <Heading as="h1" size="lg" mb={2}>
          Dhruva API Documentation
        </Heading>
        <Text color="gray.500" mb={8}>
          Explore and test the Dhruva API directly from this interactive Swagger
          UI powered page.
        </Text>
        <Box bg="white" borderRadius="lg" boxShadow="md" p={4}>
          <SwaggerUI {...swaggerOptions} />
        </Box>
      </Container>
    </>
  );
};

export default DocsPage;

