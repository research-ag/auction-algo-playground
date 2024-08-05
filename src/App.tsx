import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import "@fontsource/inter";

import Root from "@fe/components/root";

const App = () => {
  return (
    <CssVarsProvider defaultMode="light">
      <CssBaseline />
      <Root />
    </CssVarsProvider>
  );
};

export default App;
