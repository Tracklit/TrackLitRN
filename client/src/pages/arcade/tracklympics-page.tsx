import { useState, useEffect, useRef } from 'react';
import { PageContainer } from "@/components/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Application, Graphics, Text, TextStyle, Container } from 'pixi.js';
import { ArrowLeft, RotateCcw } from "lucide-react";
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

    const initializeApp = async () => {
      try {
        const app = new Application();
        await app.init({
          width: 800,
          height: 600,
          backgroundColor: 0x87ceeb,
          antialias: false
        });

        canvasRef.current!.appendChild(app.canvas);
        appRef.current = app;

        // Initialize all game screens
        setupAllScreens();
      } catch (error) {
        console.error('Failed to initialize Pixi.js application:', error);
      }
    };

    initializeApp();

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
    splashContainer.label = 'splash';
    
    const eventSelectContainer = new Container();
    eventSelectContainer.label = 'eventSelect';
    eventSelectContainer.visible = false;
    
    const characterSelectContainer = new Container();
    characterSelectContainer.label = 'characterSelect';
    characterSelectContainer.visible = false;
    
    const gameplayContainer = new Container();
    gameplayContainer.label = 'gameplay';
    gameplayContainer.visible = false;

    app.stage.addChild(splashContainer, eventSelectContainer, characterSelectContainer, gameplayContainer);

    setupSplashScreen(splashContainer);
    setupEventSelectScreen(eventSelectContainer);
    setupCharacterSelectScreen(characterSelectContainer);
    setupGameplayScreen(gameplayContainer);
  };

  const setupSplashScreen = (container: Container) => {
    // Gradient sky background
    const bg = new Graphics();
    bg.rect(0, 0, 800, 600);
    bg.fill(0x87ceeb); // Sky blue
    container.addChild(bg);

    // Stadium background with detailed architecture
    const stadium = new Graphics();
    
    // Stadium structure - tiered stands
    for (let tier = 0; tier < 4; tier++) {
      const tierHeight = 40;
      const tierY = 80 + tier * tierHeight;
      
      // Stand structure
      stadium.rect(0, tierY, 800, tierHeight);
      stadium.fill(tier % 2 === 0 ? 0x606060 : 0x707070);
      
      // Detailed crowd
      for (let x = 10; x < 790; x += 12) {
        const person = new Graphics();
        const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57, 0xff9ff3];
        person.rect(x, tierY + 5, 8, 25);
        person.fill(colors[Math.floor(Math.random() * colors.length)]);
        
        // Head
        person.circle(x + 4, tierY + 2, 3);
        person.fill(0xfdbcb4);
        
        stadium.addChild(person);
      }
    }

    // Stadium roof/overhang
    stadium.rect(0, 60, 800, 20);
    stadium.fill(0x2c3e50);
    
    container.addChild(stadium);

    // Large stylized Olympic rings
    const ringColors = [0x0081c8, 0x000000, 0xee334e, 0xfcb131, 0x00a651];
    const ringPositions = [
      { x: 300, y: 180 }, { x: 350, y: 180 }, { x: 400, y: 180 },
      { x: 325, y: 210 }, { x: 375, y: 210 }
    ];
    
    ringPositions.forEach((pos, i) => {
      const ring = new Graphics();
      ring.circle(pos.x, pos.y, 25);
      ring.stroke({ color: ringColors[i], width: 8 });
      container.addChild(ring);
    });

    // Title with arcade-style glow effect
    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 64,
      fill: 0xffff00,
      align: 'center',
      stroke: { color: 0xff0000, width: 4 },
      dropShadow: { 
        color: 0x000000, 
        blur: 4, 
        angle: Math.PI / 6, 
        distance: 6 
      }
    });

    const title = new Text({ text: 'TRACKLYMPICS', style: titleStyle });
    title.anchor.set(0.5);
    title.x = 400;
    title.y = 300;
    container.addChild(title);

    // Subtitle with retro styling
    const subtitleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 32,
      fill: 0x00ffff,
      align: 'center',
      stroke: { color: 0x000080, width: 2 }
    });

    const subtitle = new Text({ text: '"90s ARCADE CHAMPIONSHIP"', style: subtitleStyle });
    subtitle.anchor.set(0.5);
    subtitle.x = 400;
    subtitle.y = 350;
    container.addChild(subtitle);

    // Animated "PRESS START" button with classic arcade styling
    const startButtonBg = new Graphics();
    startButtonBg.roundRect(250, 420, 300, 80, 15);
    startButtonBg.fill(0xff6600);
    startButtonBg.stroke({ color: 0xffff00, width: 4 });
    
    const startButtonShadow = new Graphics();
    startButtonShadow.roundRect(255, 425, 300, 80, 15);
    startButtonShadow.fill(0x992200);
    
    container.addChild(startButtonShadow, startButtonBg);

    const startText = new Text({ text: 'PRESS START', style: {
      fontFamily: 'monospace',
      fontSize: 28,
      fill: 0xffffff,
      align: 'center',
      stroke: { color: 0x000000, width: 2 }
    }});
    startText.anchor.set(0.5);
    startText.x = 400;
    startText.y = 460;

    // Make start button interactive
    startButtonBg.interactive = true;
    startButtonBg.cursor = 'pointer';
    startButtonBg.on('pointerdown', () => switchToScreen('eventSelect'));
    
    container.addChild(startText);

    // Add some sparkle effects
    for (let i = 0; i < 20; i++) {
      const sparkle = new Graphics();
      sparkle.star(
        Math.random() * 800,
        Math.random() * 250 + 350,
        4,
        8,
        4
      );
      sparkle.fill(0xffffff);
      container.addChild(sparkle);
    }
  };

  const setupEventSelectScreen = (container: Container) => {
    // Gradient background - grass field
    const bg = new Graphics();
    bg.rect(0, 0, 800, 600);
    bg.fill(0x228b22); // Forest green
    container.addChild(bg);

    // Detailed track with multiple lanes and infield
    const trackOuter = new Graphics();
    trackOuter.ellipse(400, 300, 380, 220);
    trackOuter.fill(0x8b4513); // Brown track

    const trackInner = new Graphics();
    trackInner.ellipse(400, 300, 300, 160);
    trackInner.fill(0x32cd32); // Bright green infield

    container.addChild(trackOuter, trackInner);

    // Track lanes with white lines
    for (let i = 0; i < 8; i++) {
      const laneRadius = 300 + (i * 10);
      const lane = new Graphics();
      lane.ellipse(400, 300, laneRadius, 160 + (i * 6));
      lane.stroke({ color: 0xffffff, width: 2 });
      container.addChild(lane);
    }

    // Title with sports styling
    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 48,
      fill: 0xffff00,
      align: 'center',
      stroke: { color: 0xff0000, width: 3 },
      dropShadow: { 
        color: 0x000000, 
        blur: 6, 
        angle: Math.PI / 4, 
        distance: 4 
      }
    });

    const title = new Text({ text: 'SELECT EVENT', style: titleStyle });
    title.anchor.set(0.5);
    title.x = 400;
    title.y = 80;
    container.addChild(title);

    // Large, detailed event selection button
    const dashButtonShadow = new Graphics();
    dashButtonShadow.roundRect(155, 205, 490, 120, 20);
    dashButtonShadow.fill(0x000080);

    const dashButton = new Graphics();
    dashButton.roundRect(150, 200, 490, 120, 20);
    dashButton.fill(0x0066ff);
    dashButton.stroke({ color: 0x00ffff, width: 6 });
    
    // Button highlight effect
    const highlight = new Graphics();
    highlight.roundRect(160, 210, 470, 20, 10);
    highlight.fill(0x66ccff);

    dashButton.interactive = true;
    dashButton.cursor = 'pointer';

    const dashText = new Text({ text: '100M DASH', style: {
      fontFamily: 'monospace',
      fontSize: 42,
      fill: 0xffffff,
      align: 'center',
      stroke: { color: 0x000080, width: 2 }
    }});
    dashText.anchor.set(0.5);
    dashText.x = 400;
    dashText.y = 260;

    // Event icon - running figure
    const runnerIcon = new Graphics();
    // Body
    runnerIcon.rect(350, 240, 16, 24);
    runnerIcon.fill(0xffffff);
    // Head
    runnerIcon.circle(358, 232, 8);
    runnerIcon.fill(0xfdbcb4);
    // Arms in running position
    runnerIcon.rect(342, 245, 6, 16);
    runnerIcon.fill(0xfdbcb4);
    runnerIcon.rect(370, 248, 6, 12);
    runnerIcon.fill(0xfdbcb4);
    // Legs in stride
    runnerIcon.rect(352, 264, 6, 18);
    runnerIcon.fill(0xfdbcb4);
    runnerIcon.rect(360, 270, 6, 12);
    runnerIcon.fill(0xfdbcb4);

    dashButton.on('pointerdown', () => switchToScreen('characterSelect'));

    container.addChild(dashButtonShadow, dashButton, highlight, dashText, runnerIcon);

    // Additional visual flair
    const flames = new Graphics();
    for (let i = 0; i < 10; i++) {
      flames.circle(100 + i * 60, 450 + Math.sin(i) * 20, 8);
      flames.fill(i % 2 === 0 ? 0xff6600 : 0xffaa00);
    }
    container.addChild(flames);
  };

  const setupCharacterSelectScreen = (container: Container) => {
    // Background
    const bg = new Graphics();
    bg.rect(0, 0, 800, 600);
    bg.fill(0x4169e1); // Royal blue
    container.addChild(bg);

    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 36,
      fill: 0xffffff,
      align: 'center',
      stroke: { color: 0x000000, width: 2 }
    });

    const title = new Text({ text: 'SELECT YOUR CHARACTER', style: titleStyle });
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
      const playButton = container.getChildByLabel('playButton') as Graphics;
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

    const charName = new Text({ text: char.name, style: nameStyle });
    charName.anchor.set(0.5);
    charName.x = 400;
    charName.y = 400;
    container.addChild(charName);

    // Play button (initially hidden)
    const playButton = new Graphics();
    playButton.label = 'playButton';
    playButton.roundRect(300, 450, 200, 60, 10);
    playButton.fill(0x00ff00);
    playButton.interactive = true;
    playButton.cursor = 'pointer';
    playButton.visible = false;

    const playText = new Text({ text: 'PLAY!', style: titleStyle });
    playText.anchor.set(0.5);
    playText.x = 400;
    playText.y = 480;

    playButton.on('pointerdown', () => switchToScreen('gameplay'));

    container.addChild(playButton, playText);
  };

  const setupGameplayScreen = (container: Container) => {
    // Detailed stadium environment
    const sky = new Graphics();
    sky.rect(0, 0, 800, 200);
    sky.fill(0x87ceeb);
    container.addChild(sky);

    // Stadium crowd in background
    for (let row = 0; row < 3; row++) {
      for (let seat = 0; seat < 40; seat++) {
        const spectator = new Graphics();
        const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57];
        spectator.rect(seat * 20, 50 + row * 25, 12, 20);
        spectator.fill(colors[Math.floor(Math.random() * colors.length)]);
        
        // Head
        spectator.circle(seat * 20 + 6, 45 + row * 25, 4);
        spectator.fill(0xfdbcb4);
        
        container.addChild(spectator);
      }
    }

    // Professional track with detailed lanes
    const trackBase = new Graphics();
    trackBase.rect(50, 200, 700, 180);
    trackBase.fill(0xcc6600); // Professional track color

    // Individual lanes with proper spacing
    for (let lane = 0; lane < 8; lane++) {
      const laneY = 205 + lane * 20;
      
      // Lane surface
      const laneSurface = new Graphics();
      laneSurface.rect(55, laneY, 690, 18);
      laneSurface.fill(lane % 2 === 0 ? 0xb8860b : 0xdaa520);
      
      // Lane numbers
      const laneNumber = new Text({ 
        text: (lane + 1).toString(), 
        style: {
          fontFamily: 'monospace',
          fontSize: 16,
          fill: 0xffffff,
          align: 'center'
        }
      });
      laneNumber.anchor.set(0.5);
      laneNumber.x = 65;
      laneNumber.y = laneY + 9;
      
      // Lane boundaries
      if (lane > 0) {
        const boundary = new Graphics();
        boundary.rect(55, laneY, 690, 2);
        boundary.fill(0xffffff);
        container.addChild(boundary);
      }
      
      container.addChild(laneSurface, laneNumber);
    }

    container.addChild(trackBase);

    // Starting blocks with detail
    for (let lane = 0; lane < 8; lane++) {
      const blockY = 210 + lane * 20;
      
      // Starting block base
      const blockBase = new Graphics();
      blockBase.rect(90, blockY, 20, 12);
      blockBase.fill(0x2c3e50);
      
      // Block pedals
      const frontPedal = new Graphics();
      frontPedal.rect(92, blockY + 2, 6, 8);
      frontPedal.fill(0x34495e);
      
      const backPedal = new Graphics();
      backPedal.rect(102, blockY + 4, 6, 6);
      backPedal.fill(0x34495e);
      
      container.addChild(blockBase, frontPedal, backPedal);
    }

    // Dramatic finish line with checkered pattern
    const finishBase = new Graphics();
    finishBase.rect(720, 200, 15, 180);
    finishBase.fill(0x000000);
    
    // Checkered pattern
    for (let i = 0; i < 18; i++) {
      const checker = new Graphics();
      checker.rect(720 + (i % 2) * 7.5, 200 + Math.floor(i / 2) * 10, 7.5, 10);
      checker.fill(i % 2 === 0 ? 0xffffff : 0x000000);
      container.addChild(checker);
    }
    
    container.addChild(finishBase);

    // Electronic scoreboard
    const scoreboard = new Graphics();
    scoreboard.rect(250, 20, 300, 60);
    scoreboard.fill(0x000000);
    scoreboard.stroke({ color: 0x00ff00, width: 3 });
    
    const scoreText = new Text({ 
      text: 'LANE 3 TIMER: 00.00', 
      style: {
        fontFamily: 'monospace',
        fontSize: 18,
        fill: 0x00ff00,
        align: 'center'
      }
    });
    scoreText.anchor.set(0.5);
    scoreText.x = 400;
    scoreText.y = 50;
    
    container.addChild(scoreboard, scoreText);

    // Player character (enhanced)
    if (selectedCharacter) {
      const player = createCharacterSprite(selectedCharacter, 100, 225, 1.5);
      player.label = 'player';
      container.addChild(player);
    }

    // Official starter with detailed uniform
    const starter = new Graphics();
    // Body in official uniform
    starter.rect(20, 220, 12, 24);
    starter.fill(0x000000);
    // White shirt details
    starter.rect(22, 222, 8, 8);
    starter.fill(0xffffff);
    // Head
    starter.circle(26, 216, 6);
    starter.fill(0xfdbcb4);
    // Official cap
    starter.rect(20, 212, 12, 4);
    starter.fill(0x000080);
    // Starting pistol
    starter.rect(32, 224, 8, 3);
    starter.fill(0x666666);
    
    container.addChild(starter);

    // Game status display with professional styling
    const statusBg = new Graphics();
    statusBg.roundRect(200, 100, 400, 60, 10);
    statusBg.fill(0x1a1a1a);
    statusBg.stroke({ color: 0x00ff00, width: 3 });

    const gameStatus = new Text({ 
      text: 'On your marks...', 
      style: {
        fontFamily: 'monospace',
        fontSize: 32,
        fill: 0x00ff00,
        align: 'center',
        stroke: { color: 0x000000, width: 2 }
      }
    });
    gameStatus.label = 'gameStatus';
    gameStatus.anchor.set(0.5);
    gameStatus.x = 400;
    gameStatus.y = 130;
    
    container.addChild(statusBg, gameStatus);

    // Control instruction panel
    const controlsBg = new Graphics();
    controlsBg.rect(0, 400, 800, 200);
    controlsBg.fill(0x2c3e50);
    
    // Control panel details
    const panel = new Graphics();
    panel.roundRect(50, 420, 700, 160, 15);
    panel.fill(0x34495e);
    panel.stroke({ color: 0x3498db, width: 4 });
    
    container.addChild(controlsBg, panel);
  };

  const createCharacterSprite = (character: Character, x: number, y: number, scale: number = 1) => {
    const char = new Container();
    
    // Athletic shoes
    const leftShoe = new Graphics();
    leftShoe.roundRect(-6 * scale, 10 * scale, 8 * scale, 4 * scale, 2 * scale);
    leftShoe.fill(0x000000);
    leftShoe.stroke({ color: 0xffffff, width: 1 });
    
    const rightShoe = new Graphics();
    rightShoe.roundRect(2 * scale, 10 * scale, 8 * scale, 4 * scale, 2 * scale);
    rightShoe.fill(0x000000);
    rightShoe.stroke({ color: 0xffffff, width: 1 });
    
    // Legs with detailed muscle definition
    const leftLeg = new Graphics();
    leftLeg.rect(-4 * scale, 2 * scale, 6 * scale, 12 * scale);
    leftLeg.fill(character.skinColor);
    // Knee detail
    leftLeg.circle(-1 * scale, 5 * scale, 2 * scale);
    leftLeg.fill(character.skinColor - 0x101010);
    
    const rightLeg = new Graphics();
    rightLeg.rect(0 * scale, 2 * scale, 6 * scale, 12 * scale);
    rightLeg.fill(character.skinColor);
    // Knee detail
    rightLeg.circle(3 * scale, 5 * scale, 2 * scale);
    rightLeg.fill(character.skinColor - 0x101010);

    // Athletic shorts
    const shorts = new Graphics();
    shorts.rect(-5 * scale, -2 * scale, 10 * scale, 8 * scale);
    shorts.fill(character.color);
    shorts.stroke({ color: 0xffffff, width: 1 });

    // Torso with tank top details
    const torso = new Graphics();
    torso.rect(-6 * scale, -12 * scale, 12 * scale, 14 * scale);
    torso.fill(character.color);
    
    // Tank top stripes
    for (let i = 0; i < 3; i++) {
      const stripe = new Graphics();
      stripe.rect(-6 * scale, -10 * scale + i * 4 * scale, 12 * scale, 1 * scale);
      stripe.fill(0xffffff);
      torso.addChild(stripe);
    }

    // Muscular arms in running position
    const leftArm = new Graphics();
    leftArm.rect(-10 * scale, -8 * scale, 4 * scale, 12 * scale);
    leftArm.fill(character.skinColor);
    // Bicep definition
    leftArm.circle(-8 * scale, -4 * scale, 2 * scale);
    leftArm.fill(character.skinColor - 0x101010);
    
    const rightArm = new Graphics();
    rightArm.rect(6 * scale, -6 * scale, 4 * scale, 10 * scale);
    rightArm.fill(character.skinColor);
    // Bicep definition
    rightArm.circle(8 * scale, -2 * scale, 2 * scale);
    rightArm.fill(character.skinColor - 0x101010);

    // Athletic hands/gloves
    const leftHand = new Graphics();
    leftHand.circle(-8 * scale, 2 * scale, 2 * scale);
    leftHand.fill(0x333333);
    
    const rightHand = new Graphics();
    rightHand.circle(8 * scale, 2 * scale, 2 * scale);
    rightHand.fill(0x333333);
    
    // Head with more detail
    const head = new Graphics();
    head.circle(0, -18 * scale, 6 * scale);
    head.fill(character.skinColor);
    
    // Hair
    const hair = new Graphics();
    hair.circle(0, -20 * scale, 5 * scale);
    hair.fill(0x4a4a4a);
    
    // Eyes
    const leftEye = new Graphics();
    leftEye.circle(-2 * scale, -18 * scale, 1 * scale);
    leftEye.fill(0x000000);
    
    const rightEye = new Graphics();
    rightEye.circle(2 * scale, -18 * scale, 1 * scale);
    rightEye.fill(0x000000);
    
    // Athletic headband
    const headband = new Graphics();
    headband.rect(-6 * scale, -20 * scale, 12 * scale, 2 * scale);
    headband.fill(0xff0000);

    // Race number on chest
    const numberBg = new Graphics();
    numberBg.rect(-3 * scale, -10 * scale, 6 * scale, 4 * scale);
    numberBg.fill(0xffffff);
    
    char.addChild(
      leftShoe, rightShoe,
      leftLeg, rightLeg,
      shorts,
      torso, 
      leftArm, rightArm,
      leftHand, rightHand,
      head, hair,
      leftEye, rightEye,
      headband,
      numberBg
    );
    
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
      const container = app.stage.getChildByLabel(name) as Container;
      if (container) container.visible = false;
    });
    
    // Show target screen
    const targetContainer = app.stage.getChildByLabel(screen) as Container;
    if (targetContainer) targetContainer.visible = true;
    
    setGameState(screen);
    
    if (screen === 'gameplay') {
      startRaceSequence();
    }
  };

  const startRaceSequence = () => {
    if (!appRef.current) return;
    
    const gameplayContainer = appRef.current.stage.getChildByLabel('gameplay') as Container;
    const gameStatus = gameplayContainer?.getChildByLabel('gameStatus') as Text;
    
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

    const gameplayContainer = appRef.current.stage.getChildByLabel('gameplay') as Container;
    const player = gameplayContainer?.getChildByLabel('player') as Container;
    
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
        const gameStatus = gameplayContainer?.getChildByLabel('gameStatus') as Text;
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