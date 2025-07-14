#!/bin/bash

# TrackLit TestFlight Build Script
# This script automates the build and submission process for TestFlight

set -e

echo "🏃‍♂️ TrackLit TestFlight Build Script"
echo "====================================="

# Check if EAS CLI is available (use npx if not globally installed)
if ! command -v eas &> /dev/null; then
    echo "⚠️  EAS CLI not found globally, using npx..."
    EAS_CMD="npx eas-cli"
else
    echo "✅ EAS CLI found globally"
    EAS_CMD="eas"
fi

# Check if logged into Expo
if ! $EAS_CMD whoami &> /dev/null; then
    echo "❌ Not logged into Expo. Please login first:"
    echo "$EAS_CMD login"
    exit 1
fi

echo "✅ EAS CLI available and logged in"

# Check if we're in the right directory
if [[ ! -f "app.json" ]]; then
    echo "❌ app.json not found. Are you in the tracklit-native directory?"
    exit 1
fi

echo "✅ In correct directory"

# Ask user what they want to do
echo ""
echo "What would you like to do?"
echo "1) Build for TestFlight"
echo "2) Submit to TestFlight"
echo "3) Build and Submit (full process)"
echo "4) Check build status"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "🔨 Building for TestFlight..."
        $EAS_CMD build --platform ios --profile testflight
        ;;
    2)
        echo "📤 Submitting to TestFlight..."
        $EAS_CMD submit --platform ios --profile production
        ;;
    3)
        echo "🔨 Building for TestFlight..."
        $EAS_CMD build --platform ios --profile testflight
        
        if [ $? -eq 0 ]; then
            echo "✅ Build successful!"
            echo "📤 Submitting to TestFlight..."
            $EAS_CMD submit --platform ios --profile production
            
            if [ $? -eq 0 ]; then
                echo "✅ Successfully submitted to TestFlight!"
                echo "🎉 Check App Store Connect for processing status"
            else
                echo "❌ Submission failed. Check the logs above."
            fi
        else
            echo "❌ Build failed. Check the logs above."
        fi
        ;;
    4)
        echo "📊 Checking build status..."
        $EAS_CMD build:list
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🏁 Done! Check the output above for any errors."
echo "📱 If successful, your app will be available in TestFlight within 10-15 minutes."