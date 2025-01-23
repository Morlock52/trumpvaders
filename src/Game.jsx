import { useState, useEffect, useCallback, useRef } from 'react';

const ALIEN_ROWS = 2;
const ALIEN_COLS = 4;
const ALIEN_SPEED = 2;
const PLAYER_SPEED = 8;
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

export default function Game() {
  const [playerX, setPlayerX] = useState(GAME_WIDTH / 2);
  const [aliens, setAliens] = useState(() => createAliens());
  const [bullets, setBullets] = useState([]);
  const [score, setScore] = useState(0);
  const [moveRight, setMoveRight] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  
  const aliensRef = useRef(null);
  const bulletsRef = useRef(null);
  const lastMoveTime = useRef(0);

  function createAliens() {
    return Array.from({ length: ALIEN_ROWS }).flatMap((_, row) => 
      Array.from({ length: ALIEN_COLS }).map((_, col) => ({
        x: col * 100 + 150,
        y: row * 100 + 100,
        alive: true,
        type: row % 2 === 0 ? 'democrat' : 'republican'
      }))
    );
  }

  const movePlayer = useCallback((e) => {
    if (gameOver) return;
    
    const now = Date.now();
    if (now - lastMoveTime.current < 16) return;
    lastMoveTime.current = now;

    if (e.key === 'ArrowLeft') {
      setPlayerX(x => Math.max(40, x - PLAYER_SPEED));
    }
    if (e.key === 'ArrowRight') {
      setPlayerX(x => Math.min(GAME_WIDTH - 40, x + PLAYER_SPEED));
    }
  }, [gameOver]);

  const fireBullet = useCallback(() => {
    if (gameOver) return;
    setBullets(prev => [...prev, { x: playerX, y: 0 }]);
  }, [playerX, gameOver]);

  useEffect(() => {
    aliensRef.current = aliens;
    bulletsRef.current = bullets;
  }, [aliens, bullets]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.repeat) return;
      movePlayer(e);
      if (e.code === 'Space') fireBullet();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [movePlayer, fireBullet]);

  useEffect(() => {
    if (gameOver) return;

    const gameLoop = setInterval(() => {
      // Move aliens
      setAliens(prev => {
        const currentAliens = prev.map(alien => ({
          ...alien,
          x: alien.x + (moveRight ? ALIEN_SPEED : -ALIEN_SPEED)
        }));
        
        const shouldReverse = currentAliens.some(alien => 
          (moveRight && alien.x > GAME_WIDTH - 60) || 
          (!moveRight && alien.x < 60)
        );
        
        if (shouldReverse) {
          setMoveRight(!moveRight);
          return currentAliens.map(alien => ({
            ...alien,
            y: alien.y + 20
          }));
        }
        return currentAliens;
      });

      // Move and check bullets
      setBullets(prev => prev
        .map(bullet => ({ ...bullet, y: bullet.y + 8 }))
        .filter(bullet => {
          if (!aliensRef.current) return true;
          
          const hitAlien = aliensRef.current.find(alien => 
            alien.alive &&
            Math.abs(bullet.x - alien.x) < 30 &&
            Math.abs(bullet.y - alien.y) < 30
          );
          
          if (hitAlien) {
            setAliens(prev => prev.map(a => 
              a === hitAlien ? { ...a, alive: false } : a
            ));
            setScore(s => s + 100);
            return false;
          }
          return bullet.y < GAME_HEIGHT - 20;
        })
      );

      // Check game over conditions
      if (aliensRef.current) {
        const aliveAliens = aliensRef.current.filter(a => a.alive);
        if (aliveAliens.length === 0 || aliveAliens.some(a => a.y > GAME_HEIGHT - 100)) {
          setGameOver(true);
        }
      }
    }, 16);

    return () => clearInterval(gameLoop);
  }, [moveRight, gameOver]);

  return (
    <div className="game-container">
      <div className="score">Score: {score}</div>
      {gameOver && <div className="game-over">GAME OVER</div>}
      
      <div 
        className="player" 
        style={{ left: playerX }}
      />

      {aliens.map((alien, i) => alien.alive && (
        <div
          key={i}
          className={`alien ${alien.type}`}
          style={{ 
            left: alien.x, 
            top: alien.y
          }}
        />
      ))}

      {bullets.map((bullet, i) => (
        <div
          key={i}
          className="bullet"
          style={{ 
            left: bullet.x,
            top: GAME_HEIGHT - bullet.y
          }}
        />
      ))}
    </div>
  );
}
