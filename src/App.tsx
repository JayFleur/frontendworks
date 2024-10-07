import React, { useState, useEffect } from 'react';
import { Hexagon } from 'lucide-react';
import PlayerForm from './components/PlayerForm';
import WaitingRoom from './components/WaitingRoom';
import BanPhase from './components/BanPhase';
import Results from './components/Results';

type GameState = 'player1Submit' | 'player2Submit' | 'bothBan' | 'results';
type PlayerDecks = [string, string, string];

interface GameData {
  state: GameState;
  player1Decks: PlayerDecks;
  player2Decks: PlayerDecks;
  player1BannedDeck: string;
  player2BannedDeck: string;
}

const App: React.FC = () => {
  const [gameData, setGameData] = useState<GameData>({
    state: 'player1Submit',
    player1Decks: ['', '', ''],
    player2Decks: ['', '', ''],
    player1BannedDeck: '',
    player2BannedDeck: '',
  });
  const [gameId, setGameId] = useState<string>('');
  const [isPlayer2, setIsPlayer2] = useState<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('gameId');
    console.log('Game ID from URL:', id);

    if (id) {
      setGameId(id);
      setIsPlayer2(true);
      loadGameState(id);
    } else {
      const newId = Math.random().toString(36).substr(2, 9);
      setGameId(newId);
      setIsPlayer2(false);
    }
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (gameId) {
        loadGameState(gameId);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [gameId]);

  const loadGameState = (id: string) => {
    const storedState = localStorage.getItem(`gameState_${id}`);
    console.log('Loaded state:', storedState);
    if (storedState) {
      const parsedState: GameData = JSON.parse(storedState);
      setGameData(parsedState);
    }
  };

  const updateGameState = (newGameData: Partial<GameData>, callback?: () => void) => {
    setGameData(prevState => {
      const updatedGameData = { ...prevState, ...newGameData };
      localStorage.setItem(`gameState_${gameId}`, JSON.stringify(updatedGameData));
      console.log('Updated game state:', updatedGameData);
      if (callback) {
        setTimeout(callback, 100);
      }
      return updatedGameData;
    });
  };

  const handlePlayer1Submit = (decks: PlayerDecks) => {
    updateGameState({ state: 'player2Submit', player1Decks: decks });
  };

  const handlePlayer2Submit = (decks: PlayerDecks) => {
    updateGameState({ state: 'bothBan', player2Decks: decks });
  };

  const handlePlayer1Ban = (deck: string) => {
    updateGameState({ player1BannedDeck: deck }, () => {
      if (gameData.player2BannedDeck) {
        updateGameState({ state: 'results' });
      }
    });
  };

  const handlePlayer2Ban = (deck: string) => {
    updateGameState({ player2BannedDeck: deck }, () => {
      if (gameData.player1BannedDeck) {
        updateGameState({ state: 'results' });
      }
    });
  };

  const getShareLink = () => {
    return `${window.location.origin}${window.location.pathname}?gameId=${gameId}`;
  };

  console.log('Current game state:', gameData.state);
  console.log('Is Player 2:', isPlayer2);
  console.log('Player 1 Banned Deck:', gameData.player1BannedDeck);
  console.log('Player 2 Banned Deck:', gameData.player2BannedDeck);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <header className="mb-8 flex items-center">
        <Hexagon className="w-8 h-8 mr-2" />
        <h1 className="text-3xl font-bold">Parallel Stats Ban Tool</h1>
      </header>
      {!isPlayer2 && gameData.state === 'player1Submit' && (
        <PlayerForm playerNumber={1} onSubmit={handlePlayer1Submit} />
      )}
      {!isPlayer2 && gameData.state === 'player2Submit' && (
        <WaitingRoom playerNumber={2} link={getShareLink()} />
      )}
      {isPlayer2 && gameData.state === 'player2Submit' && (
        <PlayerForm playerNumber={2} onSubmit={handlePlayer2Submit} />
      )}
      {!isPlayer2 && gameData.state === 'bothBan' && (
        <BanPhase
          decks={gameData.player2Decks}
          onBan={handlePlayer1Ban}
          bannedDeck={gameData.player1BannedDeck}
          isWaiting={!!gameData.player1BannedDeck && !gameData.player2BannedDeck}
        />
      )}
      {isPlayer2 && gameData.state === 'bothBan' && (
        <BanPhase
          decks={gameData.player1Decks}
          onBan={handlePlayer2Ban}
          bannedDeck={gameData.player2BannedDeck}
          isWaiting={!!gameData.player2BannedDeck && !gameData.player1BannedDeck}
        />
      )}
      {gameData.state === 'results' && (
        <Results 
          player1Decks={gameData.player1Decks} 
          player2Decks={gameData.player2Decks} 
          player1BannedDeck={gameData.player1BannedDeck}
          player2BannedDeck={gameData.player2BannedDeck}
        />
      )}
    </div>
  );
};

export default App;