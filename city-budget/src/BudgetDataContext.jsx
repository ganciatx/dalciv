import { createContext, useContext } from "react";

const BudgetDataContext = createContext(null);

export function BudgetDataProvider({ data, children }) {
  return (
    <BudgetDataContext.Provider value={data}>{children}</BudgetDataContext.Provider>
  );
}

export function useBudgetData() {
  const data = useContext(BudgetDataContext);
  if (!data) {
    throw new Error("Budget data is not loaded yet");
  }
  return data;
}
