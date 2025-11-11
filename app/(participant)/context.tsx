import { ActivityResponseDto } from "@/__generated-client/http-client-integration";
import React, { createContext, ReactNode, useContext, useState } from "react";

interface ParticipantContextType {
  activityDetails: ActivityResponseDto | undefined;
  setActivityDetails: (details: ActivityResponseDto | undefined) => void;
}

const ParticipantContext = createContext<ParticipantContextType | undefined>(
  undefined
);

export const ParticipantProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [activityDetails, setActivityDetails] = useState<
    ActivityResponseDto | undefined
  >(undefined);

  return (
    <ParticipantContext.Provider
      value={{
        activityDetails,
        setActivityDetails,
      }}
    >
      {children}
    </ParticipantContext.Provider>
  );
};

export const useParticipantContext = () => {
  const context = useContext(ParticipantContext);
  if (context === undefined) {
    throw new Error(
      "useParticipantContext must be used within a ParticipantProvider"
    );
  }
  return context;
};
