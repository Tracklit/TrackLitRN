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

// Conversion coefficients based on Dick (1987) - empirically derived ratios
// These represent the time ratio from distance A to distance B
const conversionMatrix: Record<string, Record<string, number>> = {
  "30": { "30": 1.0, "40": 1.2337, "50": 1.4673, "60": 1.7010, "70": 1.9572, "80": 2.2136, "90": 2.4724, "100": 2.7286, "120": 3.2437, "150": 4.0427, "200": 5.4874, "250": 6.9673 },
  "40": { "30": 0.8106, "40": 1.0, "50": 1.1894, "60": 1.3789, "70": 1.5865, "80": 1.7941, "90": 2.0040, "100": 2.2114, "120": 2.6290, "150": 3.2764, "200": 4.4479, "250": 5.6479 },
  "50": { "30": 0.6816, "40": 0.8408, "50": 1.0, "60": 1.1596, "70": 1.3342, "80": 1.5088, "90": 1.6849, "100": 1.8595, "120": 2.2104, "150": 2.7551, "200": 3.7397, "250": 4.7484 },
  "60": { "30": 0.5878, "40": 0.7253, "60": 1.0, "70": 1.1506, "80": 1.3012, "90": 1.4532, "100": 1.6038, "120": 1.9063, "150": 2.3754, "200": 3.2244, "250": 4.0946 },
  "70": { "30": 0.5109, "40": 0.6303, "50": 0.7495, "60": 0.8690, "70": 1.0, "80": 1.1309, "90": 1.2631, "100": 1.3940, "120": 1.6571, "150": 2.0645, "200": 2.8019, "250": 3.5585 },
  "80": { "30": 0.4518, "40": 0.5574, "50": 0.6628, "60": 0.7684, "70": 0.8842, "80": 1.0, "90": 1.1169, "100": 1.2327, "120": 1.4651, "150": 1.8254, "200": 2.4779, "250": 3.1467 },
  "90": { "30": 0.4044, "40": 0.4990, "50": 0.5936, "60": 0.6881, "70": 0.7918, "80": 0.8954, "90": 1.0, "100": 1.1036, "120": 1.3117, "150": 1.6344, "200": 2.2184, "250": 2.8172 },
  "100": { "30": 0.3665, "40": 0.4522, "50": 0.5378, "60": 0.6234, "70": 0.7174, "80": 0.8113, "90": 0.9061, "100": 1.0, "120": 1.1886, "150": 1.4808, "200": 2.0100, "250": 2.5519 },
  "120": { "30": 0.3083, "40": 0.3804, "50": 0.4525, "60": 0.5245, "70": 0.6034, "80": 0.6824, "90": 0.7623, "100": 0.8413, "120": 1.0, "150": 1.2458, "200": 1.6908, "250": 2.1474 },
  "150": { "30": 0.2474, "40": 0.3053, "50": 0.3631, "60": 0.4210, "70": 0.4844, "80": 0.5478, "90": 0.6119, "100": 0.6753, "120": 0.8028, "150": 1.0, "200": 1.3571, "250": 1.7237 },
  "200": { "30": 0.1823, "40": 0.2249, "50": 0.2675, "60": 0.3101, "70": 0.3569, "80": 0.4036, "90": 0.4508, "100": 0.4975, "120": 0.5915, "150": 0.7369, "200": 1.0, "250": 1.2700 },
  "250": { "30": 0.1435, "40": 0.1771, "50": 0.2106, "60": 0.2442, "70": 0.2810, "80": 0.3178, "90": 0.3550, "100": 0.3918, "120": 0.4657, "150": 0.5802, "200": 0.7874, "250": 1.0 }
};

export default function SprintTimePredictionPage() {
  const [selectedDistance, setSelectedDistance] = useState("100");
  const [inputTime, setInputTime] = useState("");
  const [predictions, setPredictions] = useState<Record<string, number>>({});
  const [error, setError] = useState("");

  // Dick's (1987) prediction using conversion matrix
  const predictTime = (fromDistance: string, toDistance: string, time: string): number | null => {
    const baseTime = parseFloat(time);
    
    if (isNaN(baseTime) || baseTime <= 0) {
      return null;
    }

    // Basic validation - times should be reasonable
    const fromDist = parseFloat(fromDistance);
    const normalized100m = baseTime * (100 / fromDist);
    if (normalized100m < 9 || normalized100m > 16) {
      return null;
    }

    // Use conversion matrix
    const coefficient = conversionMatrix[fromDistance]?.[toDistance];
    if (!coefficient) {
      return null;
    }

    return baseTime * coefficient;
  };

  const calculatePredictions = () => {
    if (!inputTime || isNaN(parseFloat(inputTime))) {
      setError("Please enter a valid time");
      setPredictions({});
      return;
    }

    const time = parseFloat(inputTime);
    if (time <= 0) {
      setError("Time must be greater than 0");
      setPredictions({});
      return;
    }

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
      setError("Error: The entered time is outside the valid range for sprint predictions.");
      setPredictions({});
    } else {
      setError("");
      setPredictions(newPredictions);
    }
  };

  useEffect(() => {
    if (inputTime) {
      calculatePredictions();
    } else {
      setPredictions({});
      setError("");
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
                    Calculations based on Dick (1987) sprint prediction algorithms. Table of controls for 100/200m/400m athletes.
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
