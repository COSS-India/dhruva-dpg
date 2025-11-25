import { CloseIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Grid,
  GridItem,
  HStack,
  Input,
  Progress,
  Select,
  SimpleGrid,
  Spacer,
  Stack,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import {
  SocketStatus,
  StreamingClient,
} from "@project-sunbird/open-speech-streaming-client";
import React, { useEffect, useState } from "react";
import { FaMicrophone } from "react-icons/fa";
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

const ASRTry: React.FC<Props> = (props) => {
  const [streamingClient, setStreamingClient] = useState(new StreamingClient());

  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);

  const [languages, setLanguages] = useState<string[]>([]);
  const [language, setLanguage] = useState("");
  const [audioText, setAudioText] = useState("");
  const [placeholder, setPlaceHolder] = useState(
    "Start Recording for ASR Inference..."
  );
  const [fetching, setFetching] = useState(false);
  const [recording, setRecording] = useState(false);
  const [sampleRate, setSampleRate] = useState<number>(16000);
  const [recorder, setRecorder] = useState<any>(null);
  const [audioStream, setAudioStream] = useState<any>(null);
  const [fetched, setFetched] = useState(false);
  const [responseWordCount, setResponseWordCount] = useState(0);
  const [requestTime, setRequestTime] = useState("");

  const [inferenceMode, setInferenceMode] = useState("rest");

  const [permission, setPermission] = useState<boolean>(true);
  const [modal, setModal] = useState(<></>);

  const toast = useToast();

  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [pipelineInput, setPipelineInput] = useState<
    PipelineInput | undefined
  >();
  const [pipelineOutput, setPipelineOutput] = useState<
    PipelineOutput | undefined
  >();
  const [error, setError] = useState<string | null>(null);
  const getASROutput = (asrInput: string) => {
    // Validate input
    if (!asrInput || asrInput.trim() === "") {
      const errorMsg = "Audio input is required";
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
        dhruvaAPI.asrInference + `?serviceId=${props.serviceId}`,
        {
          audio: [
            {
              audioContent: asrInput,
            },
          ],
          config: {
            language: {
              sourceLanguage: language,
            },
            serviceId: props.serviceId,
            audioFormat: "wav",
            encoding: "base64",
            samplingRate: sampleRate,
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
        if (!response.data || !response.data.output || !Array.isArray(response.data.output) || response.data.output.length === 0) {
          throw new Error("Invalid response format: missing output data");
        }

        if (!response.data.output[0] || !response.data.output[0].source) {
          throw new Error("Invalid response format: missing source text");
        }

        setPipelineInput({
          pipelineTasks: [
            {
              config: {
                language: {
                  sourceLanguage: language,
                },
                audioFormat: "wav",
                encoding: "base64",
                samplingRate: sampleRate,
              },
              taskType: ULCATaskType.ASR,
            },
          ],
          inputData: {
            audio: [
              {
                audioContent: asrInput,
              },
            ],
          },
        });
        setPipelineOutput({
          pipelineResponse: [
            {
              taskType: ULCATaskType.ASR,
              output: response.data.output,
            },
          ],
        });
        var output = response.data.output[0].source;
        setAudioText(output);
        setResponseWordCount(getWordCount(output));
        setRequestTime(response.headers["request-duration"]);
        setFetching(false);
        setFetched(true);
        setError(null);
      })
      .catch((error) => {
        console.error("ASR inference error:", error);
        let errorMessage = "Failed to process audio";

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
          title: "ASR Error",
          description: errorMessage,
          status: "error",
          duration: 8000,
          isClosable: true,
        });
        setFetching(false);
        setFetched(false);
        setAudioText(""); // Clear audio text on error
      });
  };

  const handleRecording = (blob: any) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      var result = reader.result as string;
      var base64Data = result.split(",")[1];
      var audio = new Audio("data:audio/wav;base64," + base64Data);
      audio.addEventListener("error", () => {
        console.error("Error loading recorded audio");
        toast({
          title: "Audio Error",
          description: "Failed to load recorded audio. Please try recording again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      });
      audio.play();
      getASROutput(base64Data);
      // Note: fetching/fetched states are now managed inside getASROutput
    };
    reader.onerror = () => {
      const errorMsg = "Failed to read audio file";
      setError(errorMsg);
      toast({
        title: "File Read Error",
        description: errorMsg,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setFetching(false);
      setFetched(false);
    };
  };

  const startStreaming = () => {
    setStreamingText("");
    setStreaming(true);
    setFetching(true);
    streamingClient.connect(
      dhruvaAPI.asrStreamingInference,
      props.serviceId,
      process.env.NEXT_PUBLIC_API_KEY,
      language,
      sampleRate,
      [],
      function (action: any, id: any) {
        if (action === SocketStatus.CONNECTED) {
          console.log("Connected");
          streamingClient.startStreaming(function (transcript: string) {
            setStreamingText(transcript);
          });
        } else if (action === SocketStatus.TERMINATED) {
          console.log("Terminated");
        } else {
          console.log("Action: ", action, id);
        }
      }
    );
  };

  const stopStreaming = () => {
    console.log("Streaming Ended.");
    streamingClient.stopStreaming();
    streamingClient.disconnect();
    setStreaming(false);
    setFetching(false);
  };

  const startRecording = () => {
    var AudioContext = window.AudioContext;
    var audioContext = new AudioContext();
    var input = audioContext.createMediaStreamSource(audioStream);
    var Recorder = (window as any).Recorder;
    var newRecorder = new Recorder(input, { numChannels: 1 });
    newRecorder.record();
    setRecorder(newRecorder);
    console.log("Recording Started");
    setRecording(true);
    setFetched(false);
    setFetching(true);
    setPlaceHolder("Recording Audio....");

    // Start the timer
    setTimer(0);
    const interval = setInterval(() => {
      setTimer((prevTimer) => prevTimer + 1);
    }, 1000);

    // Save the interval ID in the state to clear it later
    setTimerInterval(interval);
  };

  const stopRecording = () => {
    console.log("Recording Stopped");
    setRecording(false);
    try {
      if (audioStream && audioStream.getAudioTracks().length > 0) {
        audioStream.getAudioTracks()[0].stop();
      }
      if (recorder) {
        recorder.exportWAV(handleRecording, "audio/wav", 16000);
        recorder.stop();
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
      const errorMsg = "Failed to process recorded audio";
      setError(errorMsg);
      toast({
        title: "Recording Error",
        description: errorMsg,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setFetching(false);
      setFetched(false);
    }
    setPlaceHolder("Start Recording for ASR Inference...");
    // Note: fetching/fetched states are now managed inside getASROutput
    // Clear the timer interval
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  };

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        setAudioStream(stream);
      })
      .catch((e: any) => {
        setPermission(false);
        setModal(
          <Box
            mt="1rem"
            width={"100%"}
            minH={"3rem"}
            border={"1px"}
            borderColor={"gray.300"}
            background={"red.50"}
          >
            <HStack ml="1rem" mr="1rem" mt="0.6rem">
              <Text color={"red.600"}>Required Permissions Denied</Text>
              <Spacer />
              <CloseIcon
                onClick={() => setModal(<></>)}
                color={"red.600"}
                fontSize={"xs"}
              />
            </HStack>
          </Box>
        );
      });
  }, [recording]);

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

  return (
    <>
      <Grid templateRows="repeat(3)" gap={5}>
        <GridItem>
          <Stack direction={"column"}>
            <Stack direction={"row"}>
              <Text className="dview-service-try-option-title">
                Inference Mode:
              </Text>
              <Select
                onChange={(e) => {
                  setInferenceMode(e.target.value);
                }}
              >
                <option value={"rest"}>REST</option>
                <option value={"streaming"}>Streaming</option>
              </Select>
            </Stack>
            <Stack direction={"row"}>
              <Text className="dview-service-try-option-title">
                Select Language:
              </Text>
              <Select
                onChange={(e) => {
                  setLanguage(e.target.value);
                }}
                value={language}
              >
                {languages.map((language) => (
                  <option key={language} value={language}>
                    {lang2label[language]}
                  </option>
                ))}
              </Select>
            </Stack>
            <Stack direction={"row"}>
              <Text className="dview-service-try-option-title">
                Sample Rate:
              </Text>
              <Select
                onChange={(e) => {
                  setSampleRate(Number(e.target.value));
                }}
              >
                <option value={48000}>48000 Hz</option>
                <option value={16000}>16000 Hz</option>
                <option value={8000}>8000 Hz</option>
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
        {inferenceMode === "rest" ? (
          <GridItem>
            <Stack>
              <Textarea
                w={"auto"}
                h={200}
                readOnly
                value={audioText}
                placeholder={placeholder}
              />
              {recording && (
                //@ts-ignore
                <Text color={"gray.300"}>
                  Recording Time : {timer} / 120 seconds
                  {timer >= 120 &&
                    toast({
                      title: "Audio time limit exceeded",
                      status: "warning",
                      duration: 3000,
                      isClosable: true,
                    }) &&
                    stopRecording()}
                </Text>
              )}
              <Stack direction={"row"} gap={5}>
                {recording ? (
                  <Button
                    onClick={() => {
                      stopRecording();
                    }}
                  >
                    <FaMicrophone /> Stop
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      if (permission) {
                        startRecording();
                      }
                    }}
                  >
                    <FaMicrophone size={15} />
                  </Button>
                )}
                <Input
                  variant={"unstyled"}
                  onChangeCapture={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const selectedAudioFile = e.target["files"][0];
                    if (!selectedAudioFile) {
                      return;
                    }
                    const selectedAudioReader = new FileReader();
                    selectedAudioReader.readAsDataURL(selectedAudioFile);
                    selectedAudioReader.onloadend = () => {
                      var base64Data: string =
                        selectedAudioReader.result as string;

                      var audio = new Audio(
                        "data:audio/wav;base64," + base64Data.split(",")[1]
                      );
                      audio.addEventListener("error", () => {
                        console.error("Error loading audio file");
                        toast({
                          title: "Audio Error",
                          description: "Failed to load audio file. The file may be corrupted or in an unsupported format.",
                          status: "error",
                          duration: 5000,
                          isClosable: true,
                        });
                      });
                      audio.play();

                      getASROutput(base64Data.split(",")[1]);
                      // Note: fetching/fetched states are now managed inside getASROutput
                    };
                    e.target.value = null; // Reset file input
                  }}
                  type={"file"}
                />
              </Stack>
            </Stack>
            {/* {pipelineOutput && (
              <FeedbackModal
                pipelineInput={pipelineInput}
                pipelineOutput={pipelineOutput}
                taskType={ULCATaskType.ASR}
              />
            )} */}
          </GridItem>
        ) : (
          <GridItem>
            <Stack gap={5}>
              <Textarea
                w={"auto"}
                h={200}
                readOnly
                value={streamingText}
                placeholder={placeholder}
              />
              <Stack direction={"column"}>
                {streaming ? (
                  <Button
                    onClick={() => {
                      stopStreaming();
                    }}
                  >
                    <FaMicrophone /> Stop
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      startStreaming();
                    }}
                  >
                    <FaMicrophone size={15} />
                  </Button>
                )}
              </Stack>
            </Stack>
          </GridItem>
        )}
      </Grid>
      {modal}
    </>
  );
};

export default ASRTry;
