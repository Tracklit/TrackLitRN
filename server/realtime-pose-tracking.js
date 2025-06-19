const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class RealtimePoseTracker {
  constructor() {
    this.activeConnections = new Map();
    this.poseProcesses = new Map();
  }

  startPoseTracking(videoPath, socketId, ws) {
    console.log(`Starting pose tracking for video: ${videoPath}`);
    
    const pythonScript = path.join(__dirname, 'realtime-mediapipe.py');
    const poseProcess = spawn('python3', [pythonScript, videoPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.poseProcesses.set(socketId, poseProcess);
    this.activeConnections.set(socketId, ws);

    poseProcess.stdout.on('data', (data) => {
      try {
        const lines = data.toString().split('\n').filter(line => line.trim());
        
        lines.forEach(line => {
          try {
            const poseData = JSON.parse(line);
            
            if (ws.readyState === 1) { // WebSocket.OPEN
              ws.send(JSON.stringify({
                type: 'pose_data',
                data: poseData
              }));
            }
          } catch (parseError) {
            console.log('Non-JSON output:', line);
          }
        });
      } catch (error) {
        console.error('Error processing pose data:', error);
      }
    });

    poseProcess.stderr.on('data', (data) => {
      console.error('Pose tracking error:', data.toString());
    });

    poseProcess.on('close', (code) => {
      console.log(`Pose tracking process exited with code ${code}`);
      this.poseProcesses.delete(socketId);
      this.activeConnections.delete(socketId);
    });

    return poseProcess;
  }

  stopPoseTracking(socketId) {
    const process = this.poseProcesses.get(socketId);
    if (process) {
      process.kill();
      this.poseProcesses.delete(socketId);
    }
    this.activeConnections.delete(socketId);
  }

  cleanup() {
    for (const [socketId, process] of this.poseProcesses) {
      process.kill();
    }
    this.poseProcesses.clear();
    this.activeConnections.clear();
  }
}

module.exports = RealtimePoseTracker;