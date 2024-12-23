import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import Frame from "./components/Frame";
import { ThemeProvider, createTheme } from "@mui/material";
import Products from "./pages/Products";
import Profile from "./pages/Profile";
import Warehouse from "./pages/Warehouse";
import Login from "./pages/Login";

const App = () => {
  const theme = createTheme({
    typography: {
      fontFamily: ["Poppins", "sans-serif"].join("."),
      palette: {
        red: "#8E0000",
      },
    },
  });
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login title="Login" />} />
          <Route
            path="*"
            element={
              <Frame>
                <Routes>
                  <Route path="/home" element={<Home />} />
                  <Route path="/kamars" element={<Products />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/kos" element={<Warehouse />} />
                </Routes>
              </Frame>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
