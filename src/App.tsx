import "./App.css";
import AppRoutes from "./routes";
import { ChessAppearanceProvider } from "./context/ChessAppearanceContext";

export default function App() {
  return (
    <ChessAppearanceProvider>
      <AppRoutes />
    </ChessAppearanceProvider>
  );
}
