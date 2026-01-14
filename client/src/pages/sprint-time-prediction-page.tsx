import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Calculator, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const distances = [
  { value: "30", label: "30m" },
  { value: "40", label: "40m" },
  { value: "50", label: "50m" },
  { value: "60", label: "60m" },
  { value: "70", label: "70m" },
  { value: "80", label: "80m" },
  { value: "90", label: "90m" },
  { value: "100", label: "100m" },
  { value: "120", label: "120m" },
  { value: "150", label: "150m" },
  { value: "200", label: "200m" },
  { value: "250", label: "250m" }
];

export default function SprintTimePredictionPage() {
  const [selectedDistance, setSelectedDistance] = useState("100");
  const [inputTime, setInputTime] = useState("");
  const [predictions, setPredictions] = useState<Record<string, number>>({});
  const [error, setError] = useState("");

  // Dick's (1987) prediction algorithm
  const predictTime = (fromDistance: string, toDistance: string, time: string): number | null => {
    const fromDist = parseFloat(fromDistance);
    const toDist = parseFloat(toDistance);
    const baseTime = parseFloat(time);

    // Validation - typical 100m range is 10-15 seconds
    const normalized100m = baseTime * (100 / fromDist);
    if (normalized100m < 10 || normalized100m > 15) {
      return null;
    }

    // Power law relationship with distance-specific adjustments
    let exponent = 1.07;

    // Adjust exponent based on distance ranges
    if (fromDist <= 60 && toDist <= 60) {
      exponent = 1.08; // Acceleration phase
    } else if (fromDist >= 150 || toDist >= 150) {
      exponent = 1.06; // Speed endurance phase
    }

    const predictedTime = baseTime * Math.pow(toDist / fromDist, exponent);
    return predictedTime;
  };

  const calculatePredictions = () => {
    if (!inputTime || isNaN(parseFloat(inputTime))) {
      setError("Please enter a valid time");
      setPredictions({});
      return;
    }

    const time = parseFloat(inputTime);
    const newPredictions: Record<string, number> = {};
    let hasError = false;

    distances.forEach(({ value }) => {
      if (value !== selectedDistance) {
        const predicted = predictTime(selectedDistance, value, inputTime);
        if (predicted === null) {
          hasError = true;
        } else {
          newPredictions[value] = predicted;
        }
      }
    });

    if (hasError) {
      setError("Error: The entered time is outside the valid range. Times should be based on typical 100m performance (10-15 seconds).");
      setPredictions({});
    } else {
      setError("");
      setPredictions(newPredictions);
    }
  };

  useEffect(() => {
    if (inputTime) {
      calculatePredictions();
    }
  }, [selectedDistance, inputTime]);

  const formatTime = (seconds: number): string => {
    return seconds ? seconds.toFixed(2) : "--";
  };

  const isElectronic = (distance: string): boolean => {
    return distance === "100" || distance === "200";
  };

  return (
    <div className="min-h-screen pt-20 pb-24" style={{ backgroundColor: '#010a18' }}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold text-white">Sprint Time Predictions</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            30m to 250m Performance Calculator using Dick's (1987) algorithms
          </p>
        </div>

        {/* Input Card */}
        <Card className="bg-gray-800/30 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Predictions based on a given distance and time
            </CardTitle>
            <CardDescription className="text-gray-300">
              Select the distance, enter the athlete's time for that distance, and predicted times
              for other distances will be calculated automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 mb-4">
              {/* Distance Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">
                  Distance
                </label>
                <Select value={selectedDistance} onValueChange={setSelectedDistance}>
                  <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {distances.map(({ value, label }) => (
                      <SelectItem 
                        key={value} 
                        value={value}
                        className="text-white hover:bg-gray-700 focus:bg-gray-700"
                      >
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Time Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">
                  Time (seconds)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={inputTime}
                  onChange={(e) => setInputTime(e.target.value)}
                  placeholder="Enter time in seconds"
                  className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-900/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Predictions Grid */}
        {Object.keys(predictions).length > 0 && (
          <Card className="bg-gray-800/30 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Predicted Times</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {distances.map(({ value, label }) => {
                  if (value === selectedDistance) {
                    // Input distance card
                    return (
                      <Card 
                        key={value}
                        className="bg-primary/20 border-primary/50"
                      >
                        <CardContent className="pt-6 text-center">
                          <div className="text-lg font-bold text-primary mb-2">
                            {label}
                          </div>
                          <div className="text-3xl font-bold text-white mb-1">
                            {formatTime(parseFloat(inputTime))}s
                          </div>
                          <div className="text-xs text-gray-400">
                            (input)
                          </div>
                        </CardContent>
                      </Card>
                    );
                  } else if (predictions[value]) {
                    // Predicted time card
                    const isElec = isElectronic(value);
                    return (
                      <Card 
                        key={value}
                        className={`${
                          isElec 
                            ? 'bg-green-900/20 border-green-700/50' 
                            : 'bg-orange-900/20 border-orange-700/50'
                        }`}
                      >
                        <CardContent className="pt-6 text-center">
                          <div className="text-lg font-bold text-white mb-2">
                            {label}
                          </div>
                          <div className="text-3xl font-bold text-white mb-1">
                            {formatTime(predictions[value])}s
                          </div>
                          <div className="text-xs text-gray-400">
                            {isElec ? 'Electronic' : 'Hand timing'}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Notes */}
              <div className="mt-6 space-y-3">
                <Alert className="bg-gray-700/30 border-gray-600">
                  <AlertDescription className="text-gray-300 text-sm">
                    <strong>Note:</strong> 100m and 200m show electronic timing predictions.
                    For hand-timed events, add 0.25-0.30 seconds to get electronic equivalent.
                  </AlertDescription>
                </Alert>
                <Alert className="bg-gray-700/30 border-gray-600">
                  <AlertDescription className="text-gray-300 text-sm">
                    Calculations based on Dick (1987) sprint prediction algorithms.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reference Section */}
        <Card className="mt-8 bg-gray-800/30 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-sm">
              DICK, F. (1987) <em>Sprints and Relays</em>. 5th ed. London: BAAB. p. 22-23
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
