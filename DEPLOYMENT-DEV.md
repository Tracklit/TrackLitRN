## TrackLit Dev Redeploy (No New Resources)

This runbook updates the **existing** dev container image and App Service only.
It **does not** create or modify infrastructure resources.

### Target resources
- Resource group: `rg-tracklit-dev`
- App Service (Web App for Containers): `app-tracklit-dev-kvnx2h`
- Container Registry: `tracklitdevkvnx2h.azurecr.io`
- Image repository: `tracklit-app`

### Prerequisites
- Azure CLI logged in: `az login`
- Docker installed and running
- Access to ACR credentials (read via `az acr credential show`)

### Build and push a new image
From the TrackLitRN repo root:

```
timestamp=$(date +"%Y%m%d-%H%M%S")
image_tag="tracklitdevkvnx2h.azurecr.io/tracklit-app:$timestamp"

az acr login --name tracklitdevkvnx2h
docker build -t "$image_tag" -t "tracklitdevkvnx2h.azurecr.io/tracklit-app:latest" .
docker push "$image_tag"
docker push "tracklitdevkvnx2h.azurecr.io/tracklit-app:latest"
```

### Point App Service to the new image
```
acr_user=$(az acr credential show --name tracklitdevkvnx2h --query "username" -o tsv)
acr_pass=$(az acr credential show --name tracklitdevkvnx2h --query "passwords[0].value" -o tsv)

az webapp config container set \
  --name app-tracklit-dev-kvnx2h \
  --resource-group rg-tracklit-dev \
  --docker-custom-image-name "$image_tag" \
  --docker-registry-server-url https://tracklitdevkvnx2h.azurecr.io \
  --docker-registry-server-user "$acr_user" \
  --docker-registry-server-password "$acr_pass"
```

### Restart and verify
```
az webapp restart --name app-tracklit-dev-kvnx2h --resource-group rg-tracklit-dev
curl https://app-tracklit-dev-kvnx2h.azurewebsites.net/health
curl https://app-tracklit-dev-kvnx2h.azurewebsites.net/ping
```

### Notes
- If you prefer the `latest` tag, set `--docker-custom-image-name` to the `latest` image.
- Avoid `az deployment group create` or any ARM/Bicep/terraform runs for a redeploy-only change.
