import { useState } from 'react';

interface FileData {
  uri: string;
  fileName?: string;
  headers?: Record<string, string>;
}

export const useFileReader = () => {
  const [visible, setVisible] = useState(false);
  const [fileData, setFileData] = useState<FileData | null>(null);

  const openFile = (data: FileData) => {
    setFileData(data);
    setVisible(true);
  };

  const closeFile = () => {
    setVisible(false);
    setFileData(null);
  };

  return {
    visible,
    fileData,
    openFile,
    closeFile,
  };
}; 