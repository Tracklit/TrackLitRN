import { useState, useEffect, useRef } from 'react';
import { PageContainer } from "@/components/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Application, Graphics, Text, TextStyle, Sprite, Container, Rectangle } from 'pixi.js';
import { ArrowLeft, Play, RotateCcw } from "lucide-react";
import { Link } from "wouter";

type GameState = 'splash' | 'eventSelect' | 'characterSelect' | 'gameplay' | 'finished';

interface Character {
  id: string;
  name: string;
  color: number;
  skinColor: number;
}

interface GameStats {
  bestTime: number;
  races: number;
}

export default function TracklympicsPage() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const [gameState, setGameState] = useState<GameState>('splash');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [gameTime, setGameTime] = useState(0);
  const [playerPosition, setPlayerPosition] = useState(0);
  const [leftFoot, setLeftFoot] = useState(true);
  const [raceStarted, setRaceStarted] = useState(false);
  const [raceFinished, setRaceFinished] = useState(false);
  const [stats, setStats] = useState<GameStats>({
    bestTime: 0,
    races: 0
  });

  const characters: Character[] = [
    { id: 'runner1', name: 'Flash', color: 0x0066ff, skinColor: 0xfdbcb4 }
  ];

  // Initialize Pixi.js application
  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new Application({
      width: 800,
      height: 600,
      backgroundColor: 0x87ceeb,
      antialias: false // Pixel art style
    });

    canvasRef.current.appendChild(app.canvas);
    appRef.current = app;

    // Initialize all game screens
    setupAllScreens();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true);
      }
    };
  }, []);

  const setupAllScreens = () => {
    if (!appRef.current) return;
    
    const app = appRef.current;
    app.stage.removeChildren();

    // Create containers for each screen
    const splashContainer = new Container();
    splashContainer.name = 'splash';
    
    const eventSelectContainer = new Container();
    eventSelectContainer.name = 'eventSelect';
    eventSelectContainer.visible = false;
    
    const characterSelectContainer = new Container();
    characterSelectContainer.name = 'characterSelect';
    characterSelectContainer.visible = false;
    
    const gameplayContainer = new Container();
    gameplayContainer.name = 'gameplay';
    gameplayContainer.visible = false;

    app.stage.addChild(splashContainer, eventSelectContainer, characterSelectContainer, gameplayContainer);

    setupSplashScreen(splashContainer);
    setupEventSelectScreen(eventSelectContainer);
    setupCharacterSelectScreen(characterSelectContainer);
    setupGameplayScreen(gameplayContainer);
  };

  const setupSplashScreen = (container: Container) => {
    // Stadium background with gradient
    const stadium = new Graphics();
    stadium.beginFill(0x2d5016); // Dark green
    stadium.drawRect(0, 0, 800, 600);
    stadium.endFill();

    // Stadium stands
    for (let i = 0; i < 20; i++) {
      const stand = new Graphics();
      stand.beginFill(0x8b4513); // Brown
      stand.drawRect(i * 40, 50 + Math.random() * 20, 38, 100);
      stand.endFill();
      stadium.addChild(stand);
    }

    // Crowd (simplified pixels)
    for (let i = 0; i < 100; i++) {
      const person = new Graphics();
      person.beginFill(Math.random() > 0.5 ? 0xff6b9d : 0x6ba3ff);
      person.drawRect(
        Math.random() * 800,
        60 + Math.random() * 80,
        4, 8
      );
      person.endFill();
      stadium.addChild(person);
    }

    container.addChild(stadium);

    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 48,
      fill: 0xffff00,
      align: 'center'
    });

    const title = new Text('TRACKLYMPICS', titleStyle);
    title.anchor.set(0.5);
    title.x = 400;
    title.y = 250;
    container.addChild(title);

    // Subtitle
    const subtitleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 24,
      fill: 0xffffff,
      align: 'center'
    });

    const subtitle = new Text('Retro Track & Field Championship', subtitleStyle);
    subtitle.anchor.set(0.5);
    subtitle.x = 400;
    subtitle.y = 300;
    container.addChild(subtitle);

    // Start button area (invisible but clickable)
    const startArea = new Graphics();
    startArea.beginFill(0x00ff00, 0.3);
    startArea.drawRoundedRect(300, 350, 200, 60, 10);
    startArea.endFill();
    startArea.interactive = true;
    startArea.cursor = 'pointer';
    
    const startText = new Text('START GAME', subtitleStyle);
    startText.anchor.set(0.5);
    startText.x = 400;
    startText.y = 380;

    startArea.on('pointerdown', () => switchToScreen('eventSelect'));
    
    container.addChild(startArea, startText);
  };

  const setupEventSelectScreen = (container: Container) => {
    // Track background
    const bg = new Graphics();
    bg.beginFill(0x228b22); // Forest green
    bg.drawRect(0, 0, 800, 600);
    bg.endFill();
    container.addChild(bg);

    // Track oval outline
    const track = new Graphics();
    track.lineStyle(8, 0xcc6600); // Brown track
    track.drawEllipse(400, 300, 350, 200);
    container.addChild(track);

    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 36,
      fill: 0xffff00,
      align: 'center'
    });

    const title = new Text('SELECT EVENT', titleStyle);
    title.anchor.set(0.5);
    title.x = 400;
    title.y = 100;
    container.addChild(title);

    // 100m Dash button
    const dashButton = new Graphics();
    dashButton.beginFill(0x0066ff);
    dashButton.drawRoundedRect(250, 200, 300, 80, 10);
    dashButton.endFill();
    dashButton.interactive = true;
    dashButton.cursor = 'pointer';

    const dashText = new Text('100M DASH', titleStyle);
    dashText.anchor.set(0.5);
    dashText.x = 400;
    dashText.y = 240;

    dashButton.on('pointerdown', () => switchToScreen('characterSelect'));

    container.addChild(dashButton, dashText);
  };

  const setupCharacterSelectScreen = (container: Container) => {
    // Background
    const bg = new Graphics();
    bg.beginFill(0x4169e1); // Royal blue
    bg.drawRect(0, 0, 800, 600);
    bg.endFill();
    container.addChild(bg);

    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 36,
      fill: 0xffffff,
      align: 'center'
    });

    const title = new Text('SELECT YOUR CHARACTER', titleStyle);
    title.anchor.set(0.5);
    title.x = 400;
    title.y = 100;
    container.addChild(title);

    // Character display
    const char = characters[0];
    const characterDisplay = createCharacterSprite(char, 400, 300, 3);
    characterDisplay.interactive = true;
    characterDisplay.cursor = 'pointer';
    
    characterDisplay.on('pointerdown', () => {
      setSelectedCharacter(char);
      // Show play button
      const playButton = container.getChildByName('playButton') as Graphics;
      if (playButton) playButton.visible = true;
    });

    container.addChild(characterDisplay);

    // Character name
    const nameStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 24,
      fill: 0xffffff,
      align: 'center'
    });

    const charName = new Text(char.name, nameStyle);
    charName.anchor.set(0.5);
    charName.x = 400;
    charName.y = 400;
    container.addChild(charName);

    // Play button (initially hidden)
    const playButton = new Graphics();
    playButton.name = 'playButton';
    playButton.beginFill(0x00ff00);
    playButton.drawRoundedRect(300, 450, 200, 60, 10);
    playButton.endFill();
    playButton.interactive = true;
    playButton.cursor = 'pointer';
    playButton.visible = false;

    const playText = new Text('PLAY!', titleStyle);
    playText.anchor.set(0.5);
    playText.x = 400;
    playText.y = 480;

    playButton.on('pointerdown', () => switchToScreen('gameplay'));

    container.addChild(playButton, playText);
  };

  const setupGameplayScreen = (container: Container) => {
    // Sky background
    const sky = new Graphics();
    sky.beginFill(0x87ceeb);
    sky.drawRect(0, 0, 800, 300);
    sky.endFill();
    container.addChild(sky);

    // Track (isometric view)
    const track = new Graphics();
    track.beginFill(0xcc6600); // Brown track
    // Draw isometric track lanes
    for (let lane = 0; lane < 8; lane++) {
      const y = 250 + lane * 15;
      track.drawRect(50, y, 700, 12);
      // Lane lines
      track.lineStyle(1, 0xffffff);
      track.moveTo(50, y);
      track.lineTo(750, y);
    }
    track.endFill();
    container.addChild(track);

    // Starting blocks
    for (let lane = 0; lane < 8; lane++) {
      const block = new Graphics();
      block.beginFill(0x666666);
      block.drawRect(80, 252 + lane * 15, 8, 8);
      block.endFill();
      container.addChild(block);
    }

    // Finish line
    const finishLine = new Graphics();
    finishLine.lineStyle(3, 0xffffff);
    finishLine.moveTo(700, 250);
    finishLine.lineTo(700, 370);
    container.addChild(finishLine);

    // Player character (will be positioned dynamically)
    if (selectedCharacter) {
      const player = createCharacterSprite(selectedCharacter, 90, 257, 1);
      player.name = 'player';
      container.addChild(player);
    }

    // Starter figure
    const starter = new Graphics();
    starter.beginFill(0x000000); // Black suit
    starter.drawRect(30, 240, 8, 16);
    starter.beginFill(0xfdbcb4); // Skin color
    starter.drawCircle(34, 236, 4);
    starter.endFill();
    container.addChild(starter);

    // Game status text
    const statusStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 24,
      fill: 0x000000,
      align: 'center'
    });

    const gameStatus = new Text('On your marks...', statusStyle);
    gameStatus.name = 'gameStatus';
    gameStatus.anchor.set(0.5);
    gameStatus.x = 400;
    gameStatus.y = 50;
    container.addChild(gameStatus);

    // Game controls area
    const controlsBg = new Graphics();
    controlsBg.beginFill(0x333333);
    controlsBg.drawRect(0, 400, 800, 200);
    controlsBg.endFill();
    container.addChild(controlsBg);

    // Control buttons will be handled by React buttons below the canvas
  };

  const createCharacterSprite = (character: Character, x: number, y: number, scale: number = 1) => {
    const char = new Container();
    
    // Body
    const body = new Graphics();
    body.beginFill(character.color);
    body.drawRect(-4 * scale, -8 * scale, 8 * scale, 12 * scale);
    body.endFill();
    
    // Head
    const head = new Graphics();
    head.beginFill(character.skinColor);
    head.drawCircle(0, -12 * scale, 4 * scale);
    head.endFill();
    
    // Arms
    const leftArm = new Graphics();
    leftArm.beginFill(character.skinColor);
    leftArm.drawRect(-6 * scale, -6 * scale, 2 * scale, 8 * scale);
    leftArm.endFill();
    
    const rightArm = new Graphics();
    rightArm.beginFill(character.skinColor);
    rightArm.drawRect(4 * scale, -6 * scale, 2 * scale, 8 * scale);
    rightArm.endFill();
    
    // Legs
    const leftLeg = new Graphics();
    leftLeg.beginFill(character.skinColor);
    leftLeg.drawRect(-3 * scale, 4 * scale, 2 * scale, 8 * scale);
    leftLeg.endFill();
    
    const rightLeg = new Graphics();
    rightLeg.beginFill(character.skinColor);
    rightLeg.drawRect(1 * scale, 4 * scale, 2 * scale, 8 * scale);
    rightLeg.endFill();

    char.addChild(body, head, leftArm, rightArm, leftLeg, rightLeg);
    char.x = x;
    char.y = y;
    
    return char;
  };

  const switchToScreen = (screen: GameState) => {
    if (!appRef.current) return;
    
    const app = appRef.current;
    
    // Hide all screens
    const containers = ['splash', 'eventSelect', 'characterSelect', 'gameplay'];
    containers.forEach(name => {
      const container = app.stage.getChildByName(name) as Container;
      if (container) container.visible = false;
    });
    
    // Show target screen
    const targetContainer = app.stage.getChildByName(screen) as Container;
    if (targetContainer) targetContainer.visible = true;
    
    setGameState(screen);
    
    if (screen === 'gameplay') {
      startRaceSequence();
    }
  };

  const startRaceSequence = () => {
    if (!appRef.current) return;
    
    const gameplayContainer = appRef.current.stage.getChildByName('gameplay') as Container;
    const gameStatus = gameplayContainer?.getChildByName('gameStatus') as Text;
    
    if (!gameStatus) return;

    // Reset race state
    setPlayerPosition(0);
    setRaceStarted(false);
    setRaceFinished(false);
    setGameTime(0);
    
    // Race sequence
    setTimeout(() => {
      gameStatus.text = 'Set...';
    }, 2000);
    
    setTimeout(() => {
      gameStatus.text = 'GO!';
      setRaceStarted(true);
      // Start game timer
      const startTime = Date.now();
      const timer = setInterval(() => {
        if (!raceFinished) {
          setGameTime((Date.now() - startTime) / 1000);
        } else {
          clearInterval(timer);
        }
      }, 100);
    }, 4000);
  };

  // Update player position based on button taps
  useEffect(() => {
    if (!appRef.current || !raceStarted || raceFinished) return;

    const gameplayContainer = appRef.current.stage.getChildByName('gameplay') as Container;
    const player = gameplayContainer?.getChildByName('player') as Container;
    
    if (player) {
      const newX = 90 + playerPosition * 6; // 6 pixels per step
      player.x = newX;
      
      // Check if finished (reached finish line)
      if (newX >= 700) {
        setRaceFinished(true);
        const finalTime = gameTime;
        
        // Update stats
        setStats(prev => ({
          bestTime: prev.bestTime === 0 ? finalTime : Math.min(prev.bestTime, finalTime),
          races: prev.races + 1
        }));
        
        // Show completion message
        const gameStatus = gameplayContainer?.getChildByName('gameStatus') as Text;
        if (gameStatus) {
          gameStatus.text = `Finished! Time: ${finalTime.toFixed(2)}s`;
        }
      }
    }
  }, [playerPosition, raceStarted, raceFinished, gameTime]);

  const handleFootstep = (isLeft: boolean) => {
    if (!raceStarted || raceFinished) return;
    
    // Alternate feet for realistic running
    if (isLeft === leftFoot) {
      setPlayerPosition(prev => prev + 1);
      setLeftFoot(!leftFoot);
    }
  };

  const resetGame = () => {
    setupAllScreens();
    setGameState('splash');
    setSelectedCharacter(null);
    setPlayerPosition(0);
    setRaceStarted(false);
    setRaceFinished(false);
    setGameTime(0);
    setLeftFoot(true);
  };

  const getRaceRating = (time: number) => {
    if (time < 10) return { text: 'World Record!', color: 'bg-yellow-500' };
    if (time < 11) return { text: 'Olympic Level!', color: 'bg-green-500' };
    if (time < 12) return { text: 'Great!', color: 'bg-blue-500' };
    if (time < 15) return { text: 'Good', color: 'bg-purple-500' };
    return { text: 'Keep Training!', color: 'bg-orange-500' };
  };

  return (
    <PageContainer>
      <div className="container max-w-4xl mx-auto p-4 pt-5 pb-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/arcade">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Arcade
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Tracklympics</h1>
            <p className="text-muted-foreground">Retro Track & Field Championship</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Canvas */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Game</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                {/* Pixi.js Canvas Container */}
                <div 
                  ref={canvasRef} 
                  className="border rounded-lg overflow-hidden shadow-lg"
                  style={{ width: '800px', height: '600px' }}
                />

                {/* Game Controls - Only show during gameplay */}
                {gameState === 'gameplay' && (
                  <div className="w-full max-w-[800px]">
                    <div className="text-center mb-4">
                      <div className="text-xl font-bold">
                        Time: {gameTime.toFixed(2)}s | Position: {playerPosition}
                      </div>
                      {raceFinished && stats.bestTime > 0 && (
                        <div className="mt-2">
                          <Badge className={getRaceRating(gameTime).color}>
                            {getRaceRating(gameTime).text}
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    {/* Running Controls */}
                    <div className="grid grid-cols-2 gap-8 max-w-md mx-auto">
                      <Button
                        size="lg"
                        onPointerDown={() => handleFootstep(true)}
                        disabled={!raceStarted || raceFinished}
                        className="h-20 text-xl font-bold bg-blue-600 hover:bg-blue-700"
                      >
                        👟 LEFT
                      </Button>
                      <Button
                        size="lg"
                        onPointerDown={() => handleFootstep(false)}
                        disabled={!raceStarted || raceFinished}
                        className="h-20 text-xl font-bold bg-red-600 hover:bg-red-700"
                      >
                        👟 RIGHT
                      </Button>
                    </div>
                    
                    <div className="text-center mt-4 text-sm text-muted-foreground">
                      Alternate tapping LEFT and RIGHT to run!
                    </div>
                  </div>
                )}

                {/* Reset Game Button */}
                <div className="flex gap-4 mt-4">
                  <Button 
                    onClick={resetGame}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    New Game
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Race Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">{stats.races}</div>
                    <div className="text-sm text-muted-foreground">Races</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">
                      {stats.bestTime > 0 ? `${stats.bestTime.toFixed(2)}s` : '-'}
                    </div>
                    <div className="text-sm text-muted-foreground">Best Time</div>
                  </div>
                </div>
                {gameState === 'gameplay' && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-500">
                      {gameTime.toFixed(2)}s
                    </div>
                    <div className="text-sm text-muted-foreground">Current Time</div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How to Play</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>1. Click "START GAME" on splash screen</p>
                <p>2. Select "100M DASH" event</p>
                <p>3. Choose your character</p>
                <p>4. Wait for the starting gun</p>
                <p>5. Alternate tapping LEFT and RIGHT buttons to run</p>
                <p>6. Reach the finish line as fast as possible!</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Time Standards</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>&lt; 10.0s</span>
                  <Badge className="bg-yellow-500">World Record</Badge>
                </div>
                <div className="flex justify-between">
                  <span>10.0-11.0s</span>
                  <Badge className="bg-green-500">Olympic Level</Badge>
                </div>
                <div className="flex justify-between">
                  <span>11.0-12.0s</span>
                  <Badge className="bg-blue-500">Great</Badge>
                </div>
                <div className="flex justify-between">
                  <span>12.0-15.0s</span>
                  <Badge className="bg-purple-500">Good</Badge>
                </div>
                <div className="flex justify-between">
                  <span>&gt; 15.0s</span>
                  <Badge className="bg-orange-500">Keep Training</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}