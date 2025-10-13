import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { ExpenseTable } from "./pages/monthly-table";

function App() {
  const [count, setCount] = useState(0);
  const [apiMessage, setApiMessage] = useState<string>("");

  useEffect(() => {
    async function fetchBackend() {
      try {
        const response = await fetch("http://localhost:3000/");
        const text = await response.text();
        setApiMessage(text);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setApiMessage(`Error: ${message}`);
      }
    }
    fetchBackend();
  }, []);

  return (
    <>
      <ExpenseTable />
    </>
  );
}

export default App;
