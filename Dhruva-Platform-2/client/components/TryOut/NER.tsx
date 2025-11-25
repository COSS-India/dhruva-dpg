import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Stack,
  Text,
  Select,
  Button,
  Textarea,
  Progress,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Box,
  useToast,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { IndicTransliterate } from "@ai4bharat/indic-transliterate";
import { dhruvaAPI, apiInstance } from "../../api/apiConfig";
import { lang2label, tag2Color } from "../../config/config";
import React from "react";
import { FeedbackModal } from "../Feedback/Feedback";
import { PipelineInput, PipelineOutput } from "../Feedback/FeedbackTypes";

interface LanguageConfig {
  sourceLanguage: string;
  targetLanguage: string;
}

interface Props {
  languages: LanguageConfig[];
  serviceId: string;
}

const NERTry: React.FC<Props> = (props) => {
  const [languages, setLanguages] = useState<string[]>([]);
  const [language, setLanguage] = useState("hi");
  const [fetching, setFetching] = useState(false);
  const [tltText, setTltText] = useState("");
  const [fetched, setFetched] = useState(false);
  const [requestTime, setRequestTime] = useState("");
  const [nerTokens, setNERTokens] = useState<{ [key: string]: string }>({});
  const [pipelineInput, setPipelineInput] = useState<
    PipelineInput | undefined
  >();
  const [pipelineOutput, setPipelineOutput] = useState<
    PipelineOutput | undefined
  >();
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const getNEROutput = (source: string) => {
    // Validate input
    if (!source || source.trim() === "") {
      const errorMsg = "Text input is required";
      setError(errorMsg);
      toast({
        title: "Validation Error",
        description: errorMsg,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setFetching(false);
      setFetched(false);
      return;
    }

    if (!props.serviceId) {
      const errorMsg = "Service ID is missing";
      setError(errorMsg);
      toast({
        title: "Configuration Error",
        description: errorMsg,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setFetching(false);
      setFetched(false);
      return;
    }

    if (!language) {
      const errorMsg = "Please select a language";
      setError(errorMsg);
      toast({
        title: "Validation Error",
        description: errorMsg,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setFetching(false);
      setFetched(false);
      return;
    }

    setError(null);
    setFetched(false);
    setFetching(true);

    apiInstance
      .post(
        dhruvaAPI.nerInference + `?serviceId=${props.serviceId}`,
        {
          input: [
            {
              source: source,
            },
          ],
          config: {
            language: {
              sourceLanguage: language,
            },
            serviceId: props.serviceId,
          },
          controlConfig: {
            dataTracking: true,
          },
        },
        {
          headers: {
            accept: "application/json",
            authorization: process.env.NEXT_PUBLIC_API_KEY,
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        // Validate response structure
        if (!response.data || !response.data["output"] || !Array.isArray(response.data["output"]) || response.data["output"].length === 0) {
          throw new Error("Invalid response format: missing output data");
        }

        if (!response.data["output"][0] || !response.data["output"][0]["nerPrediction"]) {
          throw new Error("Invalid response format: missing NER prediction data");
        }

        const tokens = response.data["output"][0]["nerPrediction"];
        
        // Validate tokens structure
        if (!Array.isArray(tokens)) {
          throw new Error("Invalid response format: NER prediction is not an array");
        }

        const tokenDictionary: { [key: string]: string } = {};
        const currentTokens = tltText.split(" ");
        currentTokens.forEach((token: any) => {
          tokenDictionary[token] = "O";
        });
        tokens.forEach((token: any) => {
          if (token && token["token"] && token["tag"]) {
            tokenDictionary[token["token"]] = token["tag"];
          }
        });
        setRequestTime(response.headers["request-duration"]);
        setNERTokens(tokenDictionary);
        setFetching(false);
        setFetched(true);
        setError(null);
      })
      .catch((error) => {
        console.error("NER inference error:", error);
        let errorMessage = "Failed to process NER request";

        if (error.response) {
          // Server responded with error status
          const status = error.response.status;
          const errorData = error.response.data;

          if (errorData?.detail?.message) {
            errorMessage = errorData.detail.message;
          } else if (errorData?.detail?.kind) {
            errorMessage = `${errorData.detail.kind}: ${errorData.detail.message || "Request failed"}`;
          } else if (errorData?.message) {
            errorMessage = errorData.message;
          } else {
            errorMessage = `Server error (${status}): ${error.response.statusText || "Unknown error"}`;
          }
        } else if (error.request) {
          // Request was made but no response received
          errorMessage = "No response from server. Please check your connection.";
        } else {
          // Error setting up the request
          errorMessage = error.message || "Failed to setup request";
        }

        setError(errorMessage);
        toast({
          title: "NER Error",
          description: errorMessage,
          status: "error",
          duration: 8000,
          isClosable: true,
        });
        setFetching(false);
        setFetched(false);
        setNERTokens({}); // Clear NER tokens on error
      });
  };

  useEffect(() => {
    const uniqueSourceLanguages: any = Array.from(
      new Set(
        props.languages.map(
          (language: LanguageConfig) => language.sourceLanguage
        )
      )
    );
    setLanguages(uniqueSourceLanguages);
    setLanguage(uniqueSourceLanguages[0]);
  }, []);

  const renderTransliterateComponent = () => {
    return (
      <IndicTransliterate
        renderComponent={(props) => (
          <Textarea resize="none" h={200} {...props} />
        )}
        onChangeText={(text: string) => {
          setTltText(text);
        }}
        value={tltText}
        placeholder="Type your text here for NER Inference..."
        lang={language}
        onChange={undefined}
        onBlur={undefined}
        onKeyDown={undefined}
        enabled={language !== "en"}
      />
    );
  };

  return (
    <Grid templateRows="repeat(3)" gap={5}>
      <GridItem>
        <Stack direction={"column"}>
          <Stack direction={"row"}>
            <Text className="dview-service-try-option-title">
              Select Language:
            </Text>
            <Select
              onChange={(e) => {
                setLanguage(e.target.value);
              }}
            >
              {languages.map((language) => (
                <option key={language} value={language}>
                  {lang2label[language]}
                </option>
              ))}
            </Select>
          </Stack>
        </Stack>
      </GridItem>
      <GridItem>
        {error && (
          <Alert status="error" borderRadius="md" mb={4}>
            <AlertIcon />
            <AlertTitle mr={2}>Error:</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {fetching ? <Progress size="xs" isIndeterminate /> : <></>}
      </GridItem>
      {fetched ? (
        <GridItem>
          <SimpleGrid
            p="1rem"
            w="100%"
            h="auto"
            bg="orange.100"
            borderRadius={15}
            columns={2}
            spacingX="40px"
            spacingY="20px"
          >
            <Stat>
              <StatLabel>Response Time</StatLabel>
              <StatNumber>{Number(requestTime) / 1000}</StatNumber>
              <StatHelpText>seconds</StatHelpText>
            </Stat>
          </SimpleGrid>
        </GridItem>
      ) : (
        <></>
      )}
      <GridItem>
        <Stack spacing={5}>
          {renderTransliterateComponent()}
          <Box
            p="1rem"
            borderRadius={15}
            bg={"gray.100"}
            resize="none"
            minH={200}
          >
            {Object.entries(nerTokens).map(([token, tag], idx) => {
              // Get colors for the tag, default to gray if tag not found
              const colors = tag2Color[tag] || ["#e0e0e0", "#808080"];
              return (
                <span
                  key={idx}
                  style={{
                    padding: 3,
                    backgroundColor: colors[0],
                    borderRadius: 15,
                    lineHeight: 1.8,
                    marginRight: 3,
                  }}
                >
                  {token}{" "}
                  <span
                    style={{
                      padding: 3,
                      backgroundColor: colors[1],
                      borderRadius: 15,
                      color: "white",
                    }}
                  >
                    {tag}
                  </span>
                </span>
              );
            })}
          </Box>
          <Stack direction={"column"} gap={5}>
            <Button
           isDisabled={!tltText?.trim()}
            onClick={() => {
              if(tltText.length!=0){
                getNEROutput(tltText);
              }}
            }
            >
              Generate
            </Button>
            {/* {fetched && (
              <FeedbackModal
                pipelineInput={pipelineInput}
                pipelineOutput={pipelineOutput}

              />
            )} */}
          </Stack>
        </Stack>
      </GridItem>
    </Grid>
  );
};

export default NERTry;
