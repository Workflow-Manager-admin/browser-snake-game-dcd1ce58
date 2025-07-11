import React, { useState, useEffect, useRef } from 'react';
import './App.css';

/*
  PRIMARY COLORS (from design): 
  --primary: #4CAF50 (snake & main buttons)
  --secondary: #212121 (background)
  --accent: #FFC107 (food/highlights)
*/

// Constants for game initial state and defaults
const DEFAULT_GRID_SIZE = 16;
const DEFAULT_SPEED = 100; // ms interval

const COLORS = {
  boardBg: '#f8f9fa',
  border: '#d0d0d0',
  snake: '#4CAF50',
  snakeHead: '#388E3C',
  food: '#FFC107',
  accent: '#FFC107',
  textPrimary: '#212121',
  textSecondary: '#757575',
};

const DIRECTION = {
  ArrowUp: { x: 0, y: -1, code: 'up' },
  ArrowDown: { x: 0, y: 1, code: 'down' },
  ArrowLeft: { x: -1, y: 0, code: 'left' },
  ArrowRight: { x: 1, y: 0, code: 'right' }
};

// Helper to get random position within grid (not on snake)
function getRandomFoodPos(gridSize, snake) {
  let pos;
  do {
    pos = [
      Math.floor(Math.random() * gridSize),
      Math.floor(Math.random() * gridSize),
    ];
  } while (snake.some(([sx, sy]) => sx === pos[0] && sy === pos[1]));
  return pos;
}

// PUBLIC_INTERFACE
function App() {
  // Settings
  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);

  // Game state
  const [snake, setSnake] = useState([
    [Math.floor(DEFAULT_GRID_SIZE / 2), Math.floor(DEFAULT_GRID_SIZE / 2)],
  ]);
  const [direction, setDirection] = useState(DIRECTION.ArrowRight);
  const [food, setFood] = useState(getRandomFoodPos(DEFAULT_GRID_SIZE, [[Math.floor(DEFAULT_GRID_SIZE / 2), Math.floor(DEFAULT_GRID_SIZE / 2)]]));
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Control refs
  const nextDir = useRef(direction);
  const gameLoopRef = useRef(null);

  // Change direction (keyboard or mobile)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!Object.keys(DIRECTION).includes(e.key)) return;
      const newDir = DIRECTION[e.key];
      // Prevent reverse instantly
      if (
        (newDir.code === 'left' && direction.code === 'right') ||
        (newDir.code === 'right' && direction.code === 'left') ||
        (newDir.code === 'up' && direction.code === 'down') ||
        (newDir.code === 'down' && direction.code === 'up')
      ) return;
      nextDir.current = newDir;
    };
    if (running) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line
  }, [running, direction]);

  // Main game loop
  useEffect(() => {
    if (!running || gameOver) {
      clearInterval(gameLoopRef.current);
      return;
    }
    gameLoopRef.current = setInterval(() => {
      setSnake(prevSnake => {
        let newDir = nextDir.current;
        let newHead = [
          prevSnake[0][0] + newDir.x,
          prevSnake[0][1] + newDir.y,
        ];
        // Collision: wall
        if (
          newHead[0] < 0 ||
          newHead[1] < 0 ||
          newHead[0] >= gridSize ||
          newHead[1] >= gridSize ||
          prevSnake.some(([sx, sy]) => sx === newHead[0] && sy === newHead[1])
        ) {
          setGameOver(true); setRunning(false);
          return prevSnake;
        }
        // Food collision
        let ateFood = newHead[0] === food[0] && newHead[1] === food[1];
        let newSnake = [newHead, ...prevSnake];
        if (!ateFood) newSnake.pop();
        else {
          setScore(s => s + 1);
          setFood(getRandomFoodPos(gridSize, newSnake));
        }
        setDirection(newDir); // lock direction used in this frame
        return newSnake;
      });
    }, speed);
    return () => clearInterval(gameLoopRef.current);
    // eslint-disable-next-line
  }, [running, food, speed, gridSize, gameOver]);

  // Reset game state
  function handleReset() {
    const start = [Math.floor(gridSize / 2), Math.floor(gridSize / 2)];
    setSnake([start]);
    setDirection(DIRECTION.ArrowRight);
    nextDir.current = DIRECTION.ArrowRight;
    setFood(getRandomFoodPos(gridSize, [start]));
    setRunning(false);
    setScore(0);
    setGameOver(false);
  }

  // For changing settings
  function handleChangeGrid(e) {
    let val = Math.max(8, Math.min(32, Number(e.target.value)));
    setGridSize(val);
    handleReset();
  }
  function handleChangeSpeed(e) {
    let val = Math.max(40, Math.min(300, Number(e.target.value)));
    setSpeed(val);
    handleReset();
  }

  // for touch/mobile controls
  function handleDirButton(dirKey) {
    const newDir = DIRECTION[dirKey];
    // Prevent instant reverse
    if (
      (newDir.code === 'left' && direction.code === 'right') ||
      (newDir.code === 'right' && direction.code === 'left') ||
      (newDir.code === 'up' && direction.code === 'down') ||
      (newDir.code === 'down' && direction.code === 'up')
    ) return;
    nextDir.current = newDir;
  }

  // PUBLIC_INTERFACE
  // Game board renderer
  function GameBoard({ snake, food, gridSize }) {
    // Array of coords to fast lookup for rendering snake
    const snakeCells = {};
    snake.forEach((pos, idx) => {
      snakeCells[`${pos[0]}_${pos[1]}`] = idx;
    });
    let rows = [];
    for (let y = 0; y < gridSize; y++) {
      let cells = [];
      for (let x = 0; x < gridSize; x++) {
        const key = `${x}_${y}`;
        let bg = COLORS.boardBg;
        let border = COLORS.border;
        let content = null;
        if (food[0] === x && food[1] === y) {
          bg = COLORS.accent;
          content = <div className="food-dot" />;
        } else if (snakeCells[key] !== undefined) {
          if (snakeCells[key] === 0) {
            bg = COLORS.snakeHead;
          } else {
            bg = COLORS.snake;
          }
          content = null;
        }
        cells.push(
          <div
            key={key}
            style={{
              background: bg,
              border: `1px solid ${border}`,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: (food[0] === x && food[1] === y) ? '50%' : '5px',
              boxSizing: 'border-box',
              transition: 'background 0.2s'
            }}
          >
            {content}
          </div>
        );
      }
      rows.push(
        <div
          key={`row_${y}`}
          style={{
            display: 'flex',
            width: '100%',
            height: `${100 / gridSize}%`
          }}
        >
          {cells}
        </div>
      );
    }
    return (
      <div
        className="game-board"
        style={{
          width: '90vw',
          maxWidth: 420,
          aspectRatio: '1/1',
          background: COLORS.secondary,
          boxShadow: '0 2px 16px rgba(32,48,32,0.18)',
          border: `2px solid ${COLORS.primary}`,
          borderRadius: 12,
          margin: 'auto',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          marginTop: 16
        }}
      >
        {rows}
      </div>
    );
  }

  // Control Panel for Start/Pause/Reset
  function ControlsPanel() {
    return (
      <div className="controls-panel" style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 18, marginTop: 12 }}>
        <button
          className="btn-game"
          style={{
            background: running ? COLORS.snakeHead : COLORS.snake,
            color: 'white'
          }}
          disabled={gameOver}
          onClick={() => setRunning(r => !r)}
          aria-label={running ? 'Pause Game' : 'Start Game'}
        >
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          className="btn-game"
          style={{
            background: COLORS.primary,
            color: '#fff',
          }}
          onClick={() => handleReset()}
        >
          Reset
        </button>
      </div>
    );
  }

  // Mobile control arrows
  function MobileControls() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '10px auto 0', maxWidth: 180 }}>
        <button className="btn-dir" aria-label="Up" onClick={() => handleDirButton('ArrowUp')}>▲</button>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <button className="btn-dir" aria-label="Left" onClick={() => handleDirButton('ArrowLeft')}>◀</button>
          <button className="btn-dir" aria-label="Down" onClick={() => handleDirButton('ArrowDown')}>▼</button>
          <button className="btn-dir" aria-label="Right" onClick={() => handleDirButton('ArrowRight')}>▶</button>
        </div>
      </div>
    );
  }

  // PUBLIC_INTERFACE
  // SETTINGS panel for grid and speed
  function SettingsPanel() {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'baseline',
        gap: 18,
        margin: '18px 0'
      }}>
        <label style={{ color: COLORS.textPrimary }}>
          Grid:
          <input
            type="number"
            min="8"
            max="32"
            value={gridSize}
            style={{ width: 48, marginLeft: 4 }}
            onChange={handleChangeGrid}
            disabled={running}
          />
        </label>
        <label style={{ color: COLORS.textPrimary }}>
          Speed:
          <input
            type="number"
            min="40"
            max="300"
            step="10"
            value={speed}
            style={{ width: 56, marginLeft: 4 }}
            onChange={handleChangeSpeed}
            disabled={running}
          /> ms
        </label>
      </div>
    );
  }

  // Score & status
  function ScorePanel() {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '8px 0 0'
      }}>
        <span style={{ color: COLORS.textPrimary, fontWeight: 600, fontSize: 20 }}>
          🏆 Score: {score}
        </span>
        {gameOver &&
          <span style={{ color: COLORS.accent, fontWeight: 500, marginTop: 8, fontSize: 18 }}>
            Game Over!
          </span>
        }
      </div>
    );
  }

  return (
    <div className="App" style={{ background: COLORS.boardBg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' }}>
      <div style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '16px 8px 0 8px', boxSizing: 'border-box' }}>
        <h1 style={{
          color: COLORS.primary,
          fontSize: '2.2rem',
          fontWeight: 900,
          letterSpacing: 1,
          textAlign: 'center',
          margin: '0 0 6px 0'
        }}>Snake Game</h1>
        <p style={{
          color: COLORS.textSecondary,
          fontSize: '1rem',
          textAlign: 'center',
          margin: '0 0 18px 0'
        }}>Eat food to grow. Avoid colliding. Use <b>arrow keys</b> or tap direction below.</p>
        <ScorePanel />
        <SettingsPanel />
        <ControlsPanel />
        <GameBoard snake={snake} food={food} gridSize={gridSize} />
        {/* Mobile controls only for small screens */}
        <div className="show-mobile-controls" style={{ marginTop: 8 }}>
          <MobileControls />
        </div>
      </div>
      <footer style={{
        margin: 'auto 0 0 0',
        textAlign: 'center',
        padding: '26px 4px 8px 4px',
        color: COLORS.textSecondary,
        fontSize: 15
      }}>
        <span>Classic Snake Game &copy; {new Date().getFullYear()} &mdash; <a href="https://github.com/" target="_blank" rel="noopener noreferrer" style={{color: COLORS.primary}}>GitHub</a></span>
      </footer>
    </div>
  );
}

export default App;
