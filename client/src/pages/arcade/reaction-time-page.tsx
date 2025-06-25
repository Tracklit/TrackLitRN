import { useState, useEffect, useRef } from 'react';
import { PageContainer } from "@/components/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Application, Graphics, Text, TextStyle } from 'pixi.js';
import { ArrowLeft, Play, RotateCcw } from "lucide-react";
import { Link } from "wouter";

type GameState = 'waiting' | 'ready' | 'go' | 'clicked' | 'tooEarly' | 'finished';

interface GameStats {
  attempts: number;
  averageTime: number;
  bestTime: number;
  lastTime: number;
}

export default function ReactionTimePage() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [startTime, setStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);
  const [stats, setStats] = useState<GameStats>({
    attempts: 0,
    averageTime: 0,
    bestTime: 0,
    lastTime: 0
  });

  // Initialize Pixi.js application
  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new Application({
      width: 400,
      height: 300,
      backgroundColor: 0x1a1a1a,
      antialias: true
    });

    canvasRef.current.appendChild(app.view as HTMLCanvasElement);
    appRef.current = app;

    // Create game graphics
    const setupGame = () => {
      // Background
      const bg = new Graphics();
      bg.beginFill(0x2a2a2a);
      bg.drawRect(0, 0, 400, 300);
      bg.endFill();
      app.stage.addChild(bg);

      // Target circle (initially hidden)
      const target = new Graphics();
      target.name = 'target';
      target.beginFill(0x22c55e);
      target.drawCircle(200, 150, 40);
      target.endFill();
      target.visible = false;
      target.interactive = true;
      target.buttonMode = true;
      app.stage.addChild(target);

      // Instructions text
      const instructionStyle = new TextStyle({
        fontFamily: 'Arial',
        fontSize: 18,
        fill: 0xffffff,
        align: 'center'
      });

      const instructions = new Text('Click "Start" to begin\nClick the green circle as fast as you can!', instructionStyle);
      instructions.name = 'instructions';
      instructions.anchor.set(0.5);
      instructions.x = 200;
      instructions.y = 150;
      app.stage.addChild(instructions);

      // Status text
      const statusStyle = new TextStyle({
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xff6b6b,
        align: 'center',
        fontWeight: 'bold'
      });

      const status = new Text('', statusStyle);
      status.name = 'status';
      status.anchor.set(0.5);
      status.x = 200;
      status.y = 100;
      app.stage.addChild(status);

      // Target click handler
      target.on('pointerdown', handleTargetClick);
    };

    setupGame();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true);
      }
    };
  }, []);

  // Update game visuals based on state
  useEffect(() => {
    if (!appRef.current) return;

    const app = appRef.current;
    const target = app.stage.getChildByName('target') as Graphics;
    const instructions = app.stage.getChildByName('instructions') as Text;
    const status = app.stage.getChildByName('status') as Text;

    if (!target || !instructions || !status) return;

    switch (gameState) {
      case 'waiting':
        target.visible = false;
        instructions.visible = true;
        status.text = '';
        break;

      case 'ready':
        target.visible = false;
        instructions.visible = false;
        status.text = 'Get Ready...';
        status.style.fill = 0xfbbf24;
        break;

      case 'go':
        target.visible = true;
        instructions.visible = false;
        status.text = 'CLICK NOW!';
        status.style.fill = 0x22c55e;
        // Randomize target position
        target.x = Math.random() * 320 + 80; // Keep within bounds
        target.y = Math.random() * 200 + 100;
        break;

      case 'clicked':
        status.text = `${reactionTime}ms`;
        status.style.fill = 0x22c55e;
        target.visible = false;
        break;

      case 'tooEarly':
        target.visible = false;
        instructions.visible = false;
        status.text = 'Too Early!';
        status.style.fill = 0xff6b6b;
        break;

      case 'finished':
        target.visible = false;
        instructions.visible = true;
        instructions.text = 'Great job! Click "Start" to play again.';
        status.text = '';
        break;
    }
  }, [gameState, reactionTime]);

  const handleTargetClick = () => {
    if (gameState === 'go') {
      const endTime = Date.now();
      const reaction = endTime - startTime;
      setReactionTime(reaction);
      setGameState('clicked');

      // Update stats
      setStats(prev => {
        const newAttempts = prev.attempts + 1;
        const newAverage = prev.attempts === 0 
          ? reaction 
          : (prev.averageTime * prev.attempts + reaction) / newAttempts;
        const newBest = prev.bestTime === 0 ? reaction : Math.min(prev.bestTime, reaction);

        return {
          attempts: newAttempts,
          averageTime: Math.round(newAverage),
          bestTime: newBest,
          lastTime: reaction
        };
      });

      // Show result for 2 seconds then finish
      setTimeout(() => {
        setGameState('finished');
      }, 2000);
    }
  };

  const startGame = () => {
    setGameState('ready');
    
    // Wait random time between 2-5 seconds
    const delay = Math.random() * 3000 + 2000;
    
    const timeoutId = setTimeout(() => {
      setStartTime(Date.now());
      setGameState('go');
    }, delay);

    // Handle too early clicks
    const handleEarlyClick = () => {
      clearTimeout(timeoutId);
      setGameState('tooEarly');
      setTimeout(() => {
        setGameState('waiting');
      }, 2000);
    };

    // Add early click listener to canvas
    if (appRef.current?.view) {
      const canvas = appRef.current.view as HTMLCanvasElement;
      canvas.addEventListener('click', handleEarlyClick, { once: true });
      
      // Clean up listener when target appears
      setTimeout(() => {
        canvas.removeEventListener('click', handleEarlyClick);
      }, delay);
    }
  };

  const resetStats = () => {
    setStats({
      attempts: 0,
      averageTime: 0,
      bestTime: 0,
      lastTime: 0
    });
  };

  const getRating = (time: number) => {
    if (time < 200) return { text: 'Excellent!', color: 'bg-green-500' };
    if (time < 250) return { text: 'Great!', color: 'bg-blue-500' };
    if (time < 300) return { text: 'Good', color: 'bg-yellow-500' };
    if (time < 400) return { text: 'Average', color: 'bg-orange-500' };
    return { text: 'Try Again', color: 'bg-red-500' };
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
            <h1 className="text-2xl font-bold">Reaction Time Test</h1>
            <p className="text-muted-foreground">Test your reflexes and reaction speed</p>
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
                  style={{ width: '400px', height: '300px' }}
                />

                {/* Game Controls */}
                <div className="flex gap-4">
                  <Button 
                    onClick={startGame}
                    disabled={gameState !== 'waiting' && gameState !== 'finished'}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Start Game
                  </Button>
                  <Button 
                    onClick={resetStats}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset Stats
                  </Button>
                </div>

                {/* Last Result */}
                {stats.lastTime > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-2">{stats.lastTime}ms</div>
                    <Badge className={getRating(stats.lastTime).color}>
                      {getRating(stats.lastTime).text}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stats Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">{stats.attempts}</div>
                    <div className="text-sm text-muted-foreground">Attempts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">
                      {stats.bestTime || '-'}
                      {stats.bestTime ? 'ms' : ''}
                    </div>
                    <div className="text-sm text-muted-foreground">Best Time</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-500">
                    {stats.averageTime || '-'}
                    {stats.averageTime ? 'ms' : ''}
                  </div>
                  <div className="text-sm text-muted-foreground">Average Time</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How to Play</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>1. Click "Start Game" to begin</p>
                <p>2. Wait for the green circle to appear</p>
                <p>3. Click it as fast as you can!</p>
                <p>4. Don't click too early or you'll have to restart</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rating Scale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>&lt; 200ms</span>
                  <Badge className="bg-green-500">Excellent</Badge>
                </div>
                <div className="flex justify-between">
                  <span>200-250ms</span>
                  <Badge className="bg-blue-500">Great</Badge>
                </div>
                <div className="flex justify-between">
                  <span>250-300ms</span>
                  <Badge className="bg-yellow-500">Good</Badge>
                </div>
                <div className="flex justify-between">
                  <span>300-400ms</span>
                  <Badge className="bg-orange-500">Average</Badge>
                </div>
                <div className="flex justify-between">
                  <span>&gt; 400ms</span>
                  <Badge className="bg-red-500">Try Again</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}