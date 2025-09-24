import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Check AI availability
  app.get('/api/ai-status', (req, res) => {
    if (process.env.OPENAI_API_KEY) {
      res.json({ available: true });
    } else {
      res.status(503).json({ available: false, error: 'OpenAI API key not configured' });
    }
  });

  // AI barbell detection endpoint
  app.post('/api/detect-barbell', async (req, res) => {
    try {
      const { image, width, height } = req.body;
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ 
          found: false, 
          description: 'AI detection unavailable - OpenAI API key not configured' 
        });
      }

      if (!image) {
        return res.status(400).json({ 
          found: false, 
          description: 'No image provided' 
        });
      }

      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this gym video frame and locate the main subject's barbell (the one being lifted by the person in focus, not background equipment). 

Looking for:
- Olympic barbell with weight plates
- Being actively used by the main subject
- NOT background gym equipment or other people's barbells
- The barbell should be in the foreground/center area

Respond in JSON format:
{
  "found": boolean,
  "boundingBox": {"x": number, "y": number, "width": number, "height": number},
  "confidence": number (0-1),
  "description": "brief description of what you see"
}

If multiple barbells are visible, choose the one being used by the main subject (usually larger/clearer in the frame).`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${image}`
                }
              }
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 300,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Validate and send response
      res.json({
        found: Boolean(result.found),
        boundingBox: result.boundingBox || null,
        confidence: Number(result.confidence) || 0,
        description: result.description || 'AI analysis completed'
      });
      
    } catch (error) {
      console.error('AI detection error:', error);
      res.status(500).json({
        found: false,
        description: 'AI detection failed: ' + (error instanceof Error ? error.message : 'Unknown error')
      });
    }
  });

  // AI pose detection endpoint
  app.post('/api/detect-pose', async (req, res) => {
    try {
      const { image, width, height } = req.body;
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ 
          found: false, 
          description: 'Pose detection unavailable - OpenAI API key not configured' 
        });
      }

      if (!image) {
        return res.status(400).json({ 
          found: false, 
          description: 'No image provided' 
        });
      }

      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this gym video frame and detect the main person's pose and body position. This will help identify which barbell belongs to the main subject.

Looking for:
- Main person in the frame (the one lifting weights, not background people)
- Key body landmarks: shoulders, elbows, wrists, torso
- Person's bounding box (overall body area)
- Focus on the person who appears to be actively exercising

Respond in JSON format:
{
  "found": boolean,
  "keypoints": [
    {"name": "left_shoulder", "x": number, "y": number, "confidence": number},
    {"name": "right_shoulder", "x": number, "y": number, "confidence": number},
    {"name": "left_elbow", "x": number, "y": number, "confidence": number},
    {"name": "right_elbow", "x": number, "y": number, "confidence": number},
    {"name": "left_wrist", "x": number, "y": number, "confidence": number},
    {"name": "right_wrist", "x": number, "y": number, "confidence": number}
  ],
  "mainPersonBounds": {"x": number, "y": number, "width": number, "height": number},
  "confidence": number (0-1),
  "description": "brief description of the person's position and pose"
}

Focus on the main subject who is actively exercising, not background people.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${image}`
                }
              }
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 400,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Validate and send response
      res.json({
        found: Boolean(result.found),
        keypoints: result.keypoints || [],
        mainPersonBounds: result.mainPersonBounds || null,
        confidence: Number(result.confidence) || 0,
        description: result.description || 'Pose analysis completed'
      });
      
    } catch (error) {
      console.error('AI pose detection error:', error);
      res.status(500).json({
        found: false,
        description: 'Pose detection failed: ' + (error instanceof Error ? error.message : 'Unknown error')
      });
    }
  });

  // AI calibration detection endpoint
  app.post('/api/detect-calibration', async (req, res) => {
    try {
      const { image, width, height } = req.body;
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ 
          found: false, 
          description: 'Calibration detection unavailable - OpenAI API key not configured' 
        });
      }

      if (!image) {
        return res.status(400).json({ 
          found: false, 
          description: 'No image provided' 
        });
      }

      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this gym video frame to automatically determine scale calibration for accurate measurements. Look for objects with known real-world dimensions.

Reference objects to identify (with typical sizes):
- Olympic weight plates: 450mm diameter (45kg/25kg plates)
- Standard barbells: 2200mm length, 28mm diameter
- Gym equipment dimensions
- Standard objects for scale reference
- Room features like doors, ceiling height indicators

Analyze perspective, distance, and scale to calculate pixels-per-millimeter ratio.

Respond in JSON format:
{
  "found": boolean,
  "pixelsPerMm": number,
  "confidence": number (0-1),
  "referenceObjects": [
    {
      "type": "olympic_plate" | "barbell" | "equipment" | "other",
      "realWorldSize": number (mm),
      "detectedPixelSize": number,
      "confidence": number
    }
  ],
  "method": "plate_detection" | "barbell_length" | "perspective_analysis" | "multiple_references",
  "description": "explanation of how calibration was determined"
}

Prioritize high-confidence detections and use multiple reference points when possible.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${image}`
                }
              }
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 500,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Validate and send response
      res.json({
        found: Boolean(result.found),
        pixelsPerMm: Number(result.pixelsPerMm) || null,
        confidence: Number(result.confidence) || 0,
        referenceObjects: result.referenceObjects || [],
        method: result.method || 'unknown',
        description: result.description || 'Calibration analysis completed'
      });
      
    } catch (error) {
      console.error('AI calibration detection error:', error);
      res.status(500).json({
        found: false,
        description: 'Calibration detection failed: ' + (error instanceof Error ? error.message : 'Unknown error')
      });
    }
  });

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  return httpServer;
}
