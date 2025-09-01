import { createContext, useContext, useState, useEffect } from "react";

type DemoContextType = {
  demo: boolean;
  setDemo: (value: boolean) => void;
};

const DemoContext = createContext<DemoContextType>({
  demo: false,
  setDemo: () => {},
});

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [demo, setDemoState] = useState<boolean>(() => {
    return localStorage.getItem("demo") === "true";
  });

  useEffect(() => {
    localStorage.setItem("demo", demo ? "true" : "false");
  }, [demo]);

  const setDemo = (value: boolean) => {
    setDemoState(value);
  };

  return (
    <DemoContext.Provider value={{ demo, setDemo }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  return useContext(DemoContext);
}
