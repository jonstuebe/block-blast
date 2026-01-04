import "react-native-gesture-handler";
import { GameProvider } from "./src/context/GameContext";
import { GameScreen } from "./src/screens/GameScreen";

export default function App() {
  return (
    <GameProvider>
      <GameScreen />
    </GameProvider>
  );
}
