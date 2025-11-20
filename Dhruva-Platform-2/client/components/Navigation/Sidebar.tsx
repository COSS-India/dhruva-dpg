import {
  Box,
  Button,
  Divider,
  HStack,
  Image,
  SimpleGrid,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { BiChart } from "react-icons/bi";
import { IoConstructOutline, IoGridOutline } from "react-icons/io5";
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import { RiFlowChart } from "react-icons/ri";

const Sidebar: React.FC = () => {
  const bg = useColorModeValue("light.100", "dark.100");
  const [userRole, setUserRole] = useState<String>("CONSUMER");
  const [isOpen, setNavbar] = useState<Boolean>(false);
  const [number, setNumber] = useState<Number>(0);
  const router = useRouter();
  useEffect(() => {
    setUserRole(localStorage.getItem("user_role"));
    switch (router.pathname.split("/")[1]) {
      case "services":
        setNumber(1);
        break;
      case "models":
        setNumber(3);
        break;
      case "admin":
        setNumber(2);
        break;
      case "pipeline":
        setNumber(5);
        break;
      case "monitoring":
        setNumber(4);
        break;
      default:
        setNumber(0);
        break;
    }
  }, [router.pathname]);

  return (
    <Box
      h="100vh"
      position="fixed"
      background={bg}
      p="4"
      zIndex={50}
      style={{ textAlign: "center" }}
      onMouseEnter={() => {
        if (!isOpen) setNavbar(true);
      }}
      onMouseLeave={() => {
        if (isOpen) setNavbar(false);
      }}
      width={isOpen ? "300px" : "85px"}
      transition="width 0.2s"
      boxShadow={"md"}
    >
      <Box pt="1.5" borderRadius="xl">
        <Box h="4rem" mt={4} justifyContent="flex-start">
          <HStack justifyContent="center" alignItems="center">
            {!isOpen ? (
              <Image
                src="/AI4Inclusion_Logo.svg"
                alt="AI4Inclusion Logo"
                boxSize={24}
                objectFit="contain"
                fallback={
                  <Box
                    boxSize="40px"
                    bg="orange.500"
                    borderRadius="md"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color="white"
                    fontWeight="bold"
                    fontSize="lg"
                  >
                    AI
                  </Box>
                }
              />
            ) : (
              <Image
                src="/AI4Inclusion_Logo.svg"
                alt="AI4Inclusion Logo"
                boxSize={24}
                objectFit="contain"
              />
            )}
          </HStack>
          <Divider />
        </Box>

        <SimpleGrid
          spacingY={4}
          spacingX={1}
          mt="14"
          width={"100%"}
          marginLeft={"0"}
        >
          <Box>
            <Link href={"/services"}>
              <Button
                mb="2"
                ml={isOpen ? 0 : 0}
                h={10}
                w="100%"
                variant={number === 1 ? "solid" : "ghost"}
                background={number === 1 ? "orange.500" : "transperent"}
                color={number === 1 ? "white" : "black"}
                justifyContent="flex-start"
                size="l"
                boxShadow={number === 1 ? "xl" : "none"}
                transition="width 0.2s"
              >
                <Box>
                  <IoGridOutline style={{ marginLeft: 12 }} size={25} />
                </Box>
                {isOpen ? (
                  <Text marginLeft={4} fontWeight={"normal"}>
                    Services
                  </Text>
                ) : (
                  <></>
                )}
              </Button>
            </Link>
          </Box>

          <Box w="100%">
            <Link href={"/models"}>
              <Button
                mb="2"
                ml={isOpen ? 0 : 0}
                h={10}
                w="100%"
                variant={number === 3 ? "solid" : "ghost"}
                background={number === 3 ? "orange.500" : "transperent"}
                color={number === 3 ? "white" : "black"}
                justifyContent="flex-start"
                size="l"
                boxShadow={number === 3 ? "xl" : "none"}
                transition="width 0.2s"
              >
                <Box>
                  <IoConstructOutline style={{ marginLeft: 12 }} size={25} />
                </Box>
                {isOpen ? (
                  <Text marginLeft={4} fontWeight={"normal"}>
                    Models
                  </Text>
                ) : (
                  <></>
                )}
              </Button>
            </Link>
          </Box>
          <Box w="100%">
            <Link href={"/pipeline"}>
              <Button
                mb="2"
                ml={isOpen ? 0 : 0}
                h={10}
                w="100%"
                variant={number === 5 ? "solid" : "ghost"}
                background={number === 5 ? "orange.500" : "transperent"}
                color={number === 5 ? "white" : "black"}
                justifyContent="flex-start"
                size="l"
                boxShadow={number === 5 ? "xl" : "none"}
                transition="width 0.2s"
              >
                <Box>
                  <RiFlowChart style={{ marginLeft: 12 }} size={25} />
                </Box>
                {isOpen ? (
                  <Text marginLeft={4} fontWeight={"normal"}>
                    Pipeline
                  </Text>
                ) : (
                  <></>
                )}
              </Button>
            </Link>
          </Box>
          {/* <Box>
            <Link href={"/billing"}>
              <Button
                mb="2"
                ml={isOpen ? 0 : 0}
                h={10}
                w="100%"
                variant={number === 4 ? "solid" : "ghost"}
                background={number === 4 ? "orange.500" : "transperent"}
                color={number === 4 ? "white" : "black"}
                justifyContent="flex-start"
                size="l"
                boxShadow={number === 4 ? "xl" : "none"}
                transition="width 0.2s"
              >
                <Box>
                  <AiOutlineDollarCircle style={{ marginLeft: 12 }} size={25} />
                </Box>
                {isOpen ? (
                  <Text marginLeft={4} fontWeight={"normal"}>
                    Billing
                  </Text>
                ) : (
                  <></>
                )}
              </Button>
            </Link>
          </Box> */}
          {userRole === "ADMIN" ? (
            <Box>
              <Link href={"/monitoring"}>
                <Button
                  mb="2"
                  ml={isOpen ? 0 : 0}
                  h={10}
                  variant={number === 4 ? "solid" : "ghost"}
                  background={number === 4 ? "orange.500" : "transperent"}
                  color={number === 4 ? "white" : "black"}
                  size="l"
                  boxShadow={number === 4 ? "xl" : "none"}
                  w={"100%"}
                  justifyContent="flex-start"
                >
                  <Box>
                    <BiChart style={{ marginLeft: 12 }} size={25} />
                  </Box>
                  {isOpen ? (
                    <Text marginLeft={4} fontWeight={"normal"}>
                      Monitoring
                    </Text>
                  ) : (
                    <></>
                  )}
                </Button>
              </Link>
            </Box>
          ) : (
            <></>
          )}

          {userRole === "ADMIN" ? (
            <Box>
              <Link href="/admin">
                <Button
                  mb="2"
                  ml={isOpen ? 0 : 0}
                  h={10}
                  w="100%"
                  variant={number === 2 ? "solid" : "ghost"}
                  background={number === 2 ? "orange.500" : "transperent"}
                  color={number === 2 ? "white" : "black"}
                  justifyContent="flex-start"
                  size="l"
                  boxShadow={number === 2 ? "xl" : "none"}
                  transition="width 0.2s"
                >
                  <Box>
                    <MdOutlineAdminPanelSettings
                      style={{ marginLeft: 12, marginRight: 12 }}
                      size={25}
                    />
                  </Box>
                  {isOpen ? <Text fontWeight={"normal"}> Admin</Text> : <></>}
                </Button>
              </Link>
            </Box>
          ) : (
            <></>
          )}
          {/* <Box position={"absolute"} bottom="10">
            <Box>
              <Link href="/profile">
                <Button
                  mb="2"
                  ml={isOpen ? 0 : 0}
                  h={10}
                  w={"100%"}
                  variant={number === 2 ? "solid" : "ghost"}
                  colorScheme={number === 2 ? "primary" : "transperent"}
                  justifyContent="flex-start"
                  size="l"
                  boxShadow={number === 2 ? "xl" : "none"}
                  transition="width 0.2s"
                >
                  <Box>
                    <Avatar style={{ marginLeft: 12 }} size="sm" />
                  </Box>
                  {isOpen ? (
                    <Text marginLeft={4} fontWeight={"normal"}>
                      Profile
                    </Text>
                  ) : (
                    <></>
                  )}
                </Button>
              </Link>
            </Box>
          </Box> */}
        </SimpleGrid>
      </Box>
    </Box>
  );
};

export default Sidebar;
