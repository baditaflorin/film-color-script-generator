/// <reference types="vite/client" />

interface Window {
  __filmColorScriptSmoke?: {
    loadEngine: () => Promise<void>;
    runDemo: () => void;
  };
}
