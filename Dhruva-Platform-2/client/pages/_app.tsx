import { Box, ChakraProvider, Grid, GridItem } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import Script from "next/script";
import React, { useEffect, useState } from "react";
import Navbar from "../components/Navigation/Navbar";
import NavbarMobile from "../components/Navigation/NavbarMobile";
import Sidebar from "../components/Navigation/Sidebar";
import useMediaQuery from "../hooks/useMediaQuery";
import "../styles/global.css";
import { customTheme } from "../themes/index";

interface ContentLayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<ContentLayoutProps> = ({ children }) => {
  const [isblur, setblur] = useState<Boolean>(false);
  const smallscreen = useMediaQuery("(max-width: 1080px)");
  return (
    <>
      <Grid
        overflowX={"hidden"}
        templateAreas={`"nav main"`}
        gridTemplateColumns={"95px 1fr"}
      >
        {smallscreen ? (
          <></>
        ) : (
          <GridItem>
            <Box
              onMouseEnter={() => setblur(true)}
              onMouseLeave={() => setblur(false)}
            >
              <Sidebar />
            </Box>
          </GridItem>
        )}

        <GridItem style={isblur ? { opacity: 0.3 } : { opacity: 1 }}>
          {smallscreen ? <NavbarMobile /> : <Navbar />}
          {children}
        </GridItem>
      </Grid>
    </>
  );
};

export default function App({ Component, pageProps, ...appProps }: AppProps) {
  const isLayoutNeeded = [
    "/home",
    "/services",
    "/services/view",
    "/models",
    "/models/view",
    "/billing",
    "/profile",
    "/admin",
    "/pipeline",
    "/monitoring",
  ].includes(appProps.router.pathname);

  const [queryClient] = useState(() => new QueryClient());
  const LayoutComponent = isLayoutNeeded ? Layout : React.Fragment;
  const router = useRouter();

  const Logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("current_page");
    localStorage.removeItem("email");
    router.push("/");
  };

  useEffect(() => {
    const user_id = localStorage.getItem("user_id");
    if (user_id === null) {
      Logout();
    }
  }, []);

  return (
    <ChakraProvider theme={customTheme}>
      <QueryClientProvider client={queryClient}>
        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
        <LayoutComponent>
          <Script
            type="text/javascript"
            src="https://ai4bharat.github.io/Recorderjs/lib/recorder.js"
          />
          <Component {...pageProps} />
        </LayoutComponent>
      </QueryClientProvider>
    </ChakraProvider>
  );
}
