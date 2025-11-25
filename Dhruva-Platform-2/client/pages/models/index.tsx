import {
  Box,
  Button,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Select,
  Stack,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { IoSearchOutline } from "react-icons/io5";
import {taskOptions, languageOptions} from "../../components/Utils/Options"
import useMediaQuery from "../../hooks/useMediaQuery";
import ContentLayout from "../../components/Layouts/ContentLayout";
import { useState, useEffect } from "react";
import Head from "next/head";
import { listModels } from "../../api/modelAPI";
import { useQuery } from "@tanstack/react-query";
import ModelsTable from "../../components/Models/ModelsTable";
import NotFound from "../../components/Utils/NotFound";
import ModelsList from "../../components/Mobile/Models/ModelsList";

export default function Models() {
  const { data: models } = useQuery(["models"], listModels);
  const [hide, togglehide] = useState<boolean>(true);
  const [sourceLang, setSourceLanguage] = useState<string>("");
  const [targetLang, setTargetLanguage] = useState<string>("");
  const [task, setTask] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchedModels, setSearchedModels] = useState<ModelList[]>([]);
  const [hideTarget, setHideTarget] = useState<boolean>(true);
  const smallscreen = useMediaQuery("(max-width: 1080px)");
  const [seed, setSeed] = useState<number>(0);

  // Unified function to apply both filters and search together
  const applyFiltersAndSearch = (
    modelsData: ModelList[],
    search: string,
    taskFilter: string,
    sourceLangFilter: string,
    targetLangFilter: string
  ) => {
    if (!modelsData) return [];

    let filtered = modelsData;

    // Apply task filter
    if (taskFilter !== "") {
      filtered = filtered.filter((model) =>
        model.task?.includes(taskFilter)
      );
    }

    // Apply language filters
    // Note: Models API returns languages as array of strings like ["en", "hi", "en-hi"]
    // Format: "source-target" for pairs, or just "source" for single language
    if (sourceLangFilter !== "" || targetLangFilter !== "") {
      filtered = filtered.filter((model) => {
        // Check if model has languages array
        if (!model.languages || !Array.isArray(model.languages)) {
          return false;
        }

        // If both filters are set, we need to find a language string that matches both
        // Format: "source-target"
        if (sourceLangFilter !== "" && targetLangFilter !== "") {
          const expectedPair = `${sourceLangFilter}-${targetLangFilter}`;
          return model.languages.some(
            (lang: string) => lang === expectedPair
          );
        }

        // If only source language filter is set
        // Match strings that start with "source" or "source-"
        if (sourceLangFilter !== "" && targetLangFilter === "") {
          return model.languages.some(
            (lang: string) => 
              lang === sourceLangFilter || 
              lang.startsWith(`${sourceLangFilter}-`)
          );
        }

        // If only target language filter is set
        // Match strings that end with "-target" or contain the target language
        if (sourceLangFilter === "" && targetLangFilter !== "") {
          return model.languages.some(
            (lang: string) => 
              lang.endsWith(`-${targetLangFilter}`) ||
              (lang.includes('-') && lang.split('-')[1] === targetLangFilter)
          );
        }

        return true;
      });
    }

    // Apply search filter
    if (search !== "") {
      filtered = filtered.filter((model) =>
        model.name?.toLowerCase().includes(search?.toLowerCase())
      );
    }

    return filtered;
  };

  const clearFilters = () => {
    setTask("");
    setSeed(Math.random());
    setSourceLanguage("");
    setTargetLanguage("");
    setSearchTerm("");
    if (models) {
      setSearchedModels(models);
    }
  };

  const searchToggler = (event: any) => {
    setSearchTerm(event.target.value);
  };

  const sourceLangToggler = (event: any) => {
    setSourceLanguage(event.target.value);
  };

  const targetLangToggler = (event: any) => {
    setTargetLanguage(event.target.value);
  };

  const taskToggler = (event: any) => {
    const value = event.target.value;
    
    setTask(value);
    // Clear target language if task is not translation
    if (value !== "translation" && targetLang !== "") {
      setTargetLanguage("");
    }
  };

  useEffect(() => {
    if (models) {
      setSearchedModels(models);
      togglehide(false);
    }
  }, [models]);

  useEffect(() => {
    if (task === "translation") {
      setHideTarget(false);
    } else {
      setHideTarget(true);
    }
  }, [task]);

  useEffect(() => {
    if (models) {
      const filtered = applyFiltersAndSearch(
        models,
        searchTerm,
        task,
        sourceLang,
        task === "translation" ? targetLang : ""
      );
      setSearchedModels(filtered);
    }
  }, [sourceLang, targetLang, task, searchTerm, models]);

  return (
    <>
      <Head>
        <title>Models Registry</title>
      </Head>
      <ContentLayout>
        <Box bg="light.100" ml={smallscreen ? "1rem" : "0rem"} key={seed}>
          {/* Searchbar */}
          <Stack background={"gray.50"} direction={['column','column','column','column', 'row']}>
          <InputGroup
                width={smallscreen ? "90vw" : "30rem"}
                background={"white"}
              >
                <InputLeftElement
                  color="gray.600"
                  pointerEvents="none"
                  children={<IoSearchOutline />}
                />
                <Input
                  borderRadius={0}
                  color="gray.600"
                  value={searchTerm}
                  onChange={searchToggler}
                  placeholder="Search for Models"
                  pr={searchTerm ? "2.5rem" : "0.5rem"}
                />
                {searchTerm && (
                  <InputRightElement width="2.5rem">
                    <IconButton
                      aria-label="Clear search"
                      icon={<CloseIcon />}
                      size="xs"
                      variant="ghost"
                      onClick={() => {
                        setSearchTerm("");
                        if (models) {
                          const filtered = applyFiltersAndSearch(
                            models,
                            "",
                            task,
                            sourceLang,
                            task === "translation" ? targetLang : ""
                          );
                          setSearchedModels(filtered);
                        }
                      }}
                    />
                  </InputRightElement>
                )}
              </InputGroup>
              <Box position="relative" width={smallscreen ? "90vw" : "20rem"} gap={2}>
                <Select
                  value={task}
                  width="100%"
                  background={"white"}
                  borderRadius={0}
                  color="gray.600"
                  onChange={taskToggler}
                  pr={task ? "3.5rem" : "2.5rem"}
                >
                  <option hidden defaultChecked>
                    Select Task Type
                  </option>
                  {taskOptions}
                </Select>
                {task && (
                  <IconButton
                    aria-label="Clear task filter"
                    icon={<CloseIcon />}
                    size="xs"
                    variant="ghost"
                    position="absolute"
                    right="4rem"
                    top="50%"
                    transform="translateY(-50%)"
                    zIndex={10}
                    height="1.5rem"
                    minW="1.5rem"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTask("");
                      if (models) {
                        const filtered = applyFiltersAndSearch(
                          models,
                          searchTerm,
                          "",
                          sourceLang,
                          ""
                        );
                        setSearchedModels(filtered);
                      }
                    }}
                  />
                )}
              </Box>
              <Stack
                direction="row"
                width={smallscreen ? "90vw" : "30rem"}
                spacing={0}
              >
                <Box position="relative" flex="1">
                  <Select
                    value={sourceLang}
                    background={"white"}
                    borderRadius={0}
                    color="gray.600"
                    onChange={sourceLangToggler}
                    pr={sourceLang ? "3.5rem" : "2.5rem"}
                  >
                    <option hidden defaultChecked>
                      Source Language
                    </option>
                    {languageOptions}
                  </Select>
                  {sourceLang && (
                    <IconButton
                      aria-label="Clear source language filter"
                      icon={<CloseIcon />}
                      size="xs"
                      variant="ghost"
                      position="absolute"
                      right="4rem"
                      top="50%"
                      transform="translateY(-50%)"
                      zIndex={10}
                      height="1.5rem"
                      minW="1.5rem"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSourceLanguage("");
                        if (models) {
                          const filtered = applyFiltersAndSearch(
                            models,
                            searchTerm,
                            task,
                            "",
                            task === "translation" ? targetLang : ""
                          );
                          setSearchedModels(filtered);
                        }
                      }}
                    />
                  )}
                </Box>
                {!hideTarget && (
                  <Box position="relative" flex="1">
                    <Select
                      value={targetLang}
                      background={"white"}
                      borderRadius={0}
                      color="gray.600"
                      onChange={targetLangToggler}
                      pr={targetLang ? "3.5rem" : "2.5rem"}
                    >
                      <option hidden defaultChecked>
                        Target Language
                      </option>
                      {languageOptions}
                    </Select>
                    {targetLang && (
                      <IconButton
                        aria-label="Clear target language filter"
                        icon={<CloseIcon />}
                        size="xs"
                        variant="ghost"
                        position="absolute"
                        right="4rem"
                        top="50%"
                        transform="translateY(-50%)"
                        zIndex={10}
                        height="1.5rem"
                        minW="1.5rem"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTargetLanguage("");
                          if (models) {
                            const filtered = applyFiltersAndSearch(
                              models,
                              searchTerm,
                              task,
                              sourceLang,
                              ""
                            );
                            setSearchedModels(filtered);
                          }
                        }}
                      />
                    )}
                  </Box>
                )}
              </Stack>
              <Button
                width={smallscreen ? "90vw" : "8rem"}
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
          </Stack>
        </Box>
        <br />
        {searchedModels?
        searchedModels.length !== 0?
        smallscreen? <ModelsList data={searchedModels}/>:<ModelsTable data = {searchedModels}/>
        :<NotFound hide={hide}/>
        :<></>
      }
      </ContentLayout>
    </>
  );
}
