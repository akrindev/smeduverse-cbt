import { createContext, useCallback, useContext } from "react";

export const ExamSecurityContext = createContext(null);

export function useExamSecurity() {
  const context = useContext(ExamSecurityContext);
  if (!context) {
    throw new Error(
      "useExamSecurity must be used within ExamSecurityProvider"
    );
  }

  const { allowExit, recordWarning: providerRecordWarning } = context;

  const recordWarning = useCallback(() => {
    return providerRecordWarning();
  }, [providerRecordWarning]);

  return { allowExit, recordWarning };
}

export default useExamSecurity;
