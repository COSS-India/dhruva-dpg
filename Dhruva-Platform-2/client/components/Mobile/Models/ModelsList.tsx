import { Box } from '@chakra-ui/react'
import React, { FunctionComponent } from 'react'
import ModelCard from './ModelCard'

const ModelsList: FunctionComponent<{data:ModelList[]}> = (props) => {
  
  const searchedModels : ModelList[] = props.data;
  const options = [
  { value: "translation", label: "Translation" },
  { value: "tts", label: "TTS" },
  { value: "asr", label: "ASR" },
  { value: "ner", label: "NER" },
  // { value: "sts", label: "STS" },
  { value: "transliteration", label: "XLIT" }
];

const getLabel = (value) => {
  const option = options.find((opt) => opt.value === value);
  return option ? option.label : null; 
};
  return (
    <Box>
    {Object.entries(searchedModels).map(([id, modelData]) => (
      <ModelCard
        key={id}
        name={modelData.name}
        modelId={modelData.modelId}
        version={modelData.version}
        taskType={getLabel(modelData.task)}
      />
    ))}
  </Box>
  )
}

export default ModelsList