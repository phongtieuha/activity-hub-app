import React, { createContext, useContext, useState } from "react";

interface TabBarContextType {
  tabBarBottom: number;
  setTabBarBottom: (value: number) => void;
}

const TabBarContext = createContext<TabBarContextType | undefined>(undefined);

export const useTabBar = () => {
  const context = useContext(TabBarContext);
  if (!context) {
    throw new Error("useTabBar must be used within a TabBarProvider");
  }
  return context;
};

export const TabBarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tabBarBottom, setTabBarBottom] = useState(0); // default visible
  return (
    <TabBarContext.Provider value={{ tabBarBottom, setTabBarBottom }}>
      {children}
    </TabBarContext.Provider>
  );
};
