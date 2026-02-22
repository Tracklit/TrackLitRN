#!/bin/bash
NGROK_CLIENT="node_modules/@expo/ngrok/src/client.js"
if [ -f "$NGROK_CLIENT" ]; then
  if ! grep -q "if (!error.response)" "$NGROK_CLIENT"; then
    sed -i 's/} catch (error) {/} catch (error) {\n      if (!error.response) {\n        throw new NgrokClientError(\n          error.message || '\''Ngrok connection failed'\'',\n          null,\n          null\n        );\n      }/g' "$NGROK_CLIENT"
    echo "Patched @expo/ngrok client.js"
  else
    echo "@expo/ngrok client.js already patched"
  fi
fi
