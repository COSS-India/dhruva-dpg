import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  Grid,
  GridItem,
  Progress,
  Select,
  SimpleGrid,
  Stack,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { apiInstance, dhruvaAPI } from "../../api/apiConfig";
import { lang2label } from "../../config/config";
import { getWordCount } from "../../utils/utils";
import {
  PipelineInput,
  PipelineOutput,
  ULCATaskType,
} from "../Feedback/FeedbackTypes";

interface LanguageConfig {
  sourceLanguage: string;
  targetLanguage: string;
}

interface Props {
  languages: LanguageConfig[];
  serviceId: string;
}

const XLITTry: React.FC<Props> = (props) => {
  const [language, setLanguage] = useState(
    JSON.stringify({
      sourceLanguage: "en",
      targetLanguage: "hi",
    })
  );
  const [tltText, setTltText] = useState("");
  const [transliteratedText, settransliteratedText] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [requestWordCount, setRequestWordCount] = useState(0);
  const [responseWordCount, setResponseWordCount] = useState(0);
  const [requestTime, setRequestTime] = useState("");
  const [pipelineInput, setPipelineInput] = useState<
    PipelineInput | undefined
  >();
  const [pipelineOutput, setPipelineOutput] = useState<
    PipelineOutput | undefined
  >();
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const getTransliteration = (source: string) => {
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

    // Validate language configuration
    let languageConfig;
    try {
      languageConfig = JSON.parse(language);
      if (!languageConfig.sourceLanguage || !languageConfig.targetLanguage) {
        throw new Error("Invalid language configuration");
      }
    } catch (e) {
      const errorMsg = "Invalid language configuration";
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

    setError(null);
    setFetched(false);
    setFetching(true);

    apiInstance
      .post(
        dhruvaAPI.xlitInference + `?serviceId=${props.serviceId}`,
        {
          input: [
            {
              source: source,
            },
          ],
          config: {
            serviceId: props.serviceId,
            language: {
              sourceLanguage: languageConfig.sourceLanguage,
              sourceScriptCode: "",
              targetLanguage: languageConfig.targetLanguage,
              targetScriptCode: "",
            },
            isSentence: true,
            numSuggestions: 5,
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

        if (!response.data["output"][0] || !response.data["output"][0]["target"]) {
          throw new Error("Invalid response format: missing target transliteration");
        }

        if (!Array.isArray(response.data["output"][0]["target"]) || response.data["output"][0]["target"].length === 0) {
          throw new Error("Invalid response format: target transliteration is empty");
        }

        var output = response.data["output"][0]["target"][0];
        setPipelineInput({
          pipelineTasks: [
            {
              config: {
                serviceId: props.serviceId,
                language: {
                  sourceLanguage: languageConfig.sourceLanguage,
                  sourceScriptCode: "",
                  targetLanguage: languageConfig.targetLanguage,
                  targetScriptCode: "",
                },
                isSentence: true,
                numSuggestions: 5,
              },
              taskType: ULCATaskType.TRANSLITERATION,
            },
          ],
          inputData: {
            input: [{ source: source }],
          },
        });
        setPipelineOutput({
          pipelineResponse: [
            {
              taskType: ULCATaskType.TRANSLITERATION,
              output: response.data["output"],
            },
          ],
        });
        settransliteratedText(output);
        setFetching(false);
        setFetched(true);
        setRequestWordCount(getWordCount(source));
        setResponseWordCount(getWordCount(output));
        setRequestTime(response.headers["request-duration"]);
        setError(null);
      })
      .catch((error) => {
        console.error("Transliteration inference error:", error);
        let errorMessage = "Failed to process transliteration request";

        if (error.response) {
          // Server responded with error status
          const status = error.response.status;
          const errorData = error.response.data;

          // Handle 422 (Unprocessable Entity) specifically - usually validation errors
          if (status === 422) {
            if (errorData?.detail) {
              // Pydantic validation errors
              if (Array.isArray(errorData.detail)) {
                const validationErrors = errorData.detail.map((err: any) => {
                  const field = err.loc ? err.loc.join(".") : "field";
                  return `${field}: ${err.msg || "Invalid value"}`;
                }).join(", ");
                errorMessage = `Validation error: ${validationErrors}`;
              } else if (errorData.detail.message) {
                errorMessage = errorData.detail.message;
              } else if (typeof errorData.detail === "string") {
                errorMessage = errorData.detail;
              } else {
                errorMessage = "Invalid request format. Please check your input.";
              }
            } else if (errorData?.message) {
              errorMessage = errorData.message;
            } else {
              errorMessage = "Invalid request format. Please check your input and language configuration.";
            }
          } else if (errorData?.detail?.message) {
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
          title: "Transliteration Error",
          description: errorMessage,
          status: "error",
          duration: 8000,
          isClosable: true,
        });
        setFetching(false);
        setFetched(false);
        settransliteratedText(""); // Clear transliterated text on error
      });
  };

  const clearIO = () => {
    setTltText("");
    settransliteratedText("");
  };

  useEffect(() => {
    const initialLanguageConfig = props.languages[0];
    setLanguage(JSON.stringify(initialLanguageConfig));
  }, []);

  return (
    <Grid templateRows="repeat(3)" gap={5}>
      <GridItem>
        <Stack direction={"row"}>
          <Stack direction={"row"}>
            <Text className="dview-service-try-option-title">Languages:</Text>

            <Select
              onChange={(e) => {
                clearIO();
                setLanguage(e.target.value);
              }}
            >
              {props.languages.map((languageConfig: LanguageConfig) => {
                return (
                  <option
                    key={JSON.stringify(languageConfig)}
                    value={JSON.stringify(languageConfig)}
                  >
                    {lang2label[languageConfig.sourceLanguage]} -{"> "}
                    {lang2label[languageConfig.targetLanguage]}
                  </option>
                );
              })}
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
              <StatLabel>Word Count</StatLabel>
              <StatNumber>{requestWordCount}</StatNumber>
              <StatHelpText>Request</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Word Count</StatLabel>
              <StatNumber>{responseWordCount}</StatNumber>
              <StatHelpText>Response</StatHelpText>
            </Stat>
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
        <Stack>
          <Textarea
            value={tltText}
            onChange={(e) => {
              setTltText(e.target.value);
            }}
            w={"auto"}
            resize="none"
            h={200}
            placeholder="Type in Source Language Here..."
          />
          <Textarea
            readOnly
            value={transliteratedText}
            w={"auto"}
            resize="none"
            h={200}
            placeholder="View Transliteration Here..."
          />
          <Button
            isDisabled={!tltText?.trim()}
            onClick={() => {
              if(tltText.length!=0){
              getTransliteration(tltText);
            }}
          }
          >
            Transliterate
          </Button>
          {/* {fetched && (
            <FeedbackModal
              pipelineInput={pipelineInput}
              pipelineOutput={pipelineOutput}
              taskType={ULCATaskType.TRANSLATION}
            />
          )} */}
        </Stack>
      </GridItem>
    </Grid>
  );
};

export default XLITTry;
