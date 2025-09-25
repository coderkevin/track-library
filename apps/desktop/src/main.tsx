import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import "./demos/ipc";
// If you want use Node.js, the`nodeIntegration` needs to be enabled in the Main process.
// import './demos/node'

import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";

function Root() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? "dark" : "light",
        },
      }),
    [prefersDarkMode]
  );
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

postMessage({ payload: "removeLoading" }, "*");
