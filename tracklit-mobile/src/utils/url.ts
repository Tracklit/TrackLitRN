const PROTOCOL_PATTERN = /^[a-z][a-z0-9+\-.]*:\/\//i;

function getUrlParts(url: string) {
  if (!PROTOCOL_PATTERN.test(url)) {
    return null;
  }

  const withoutHash = url.split('#', 1)[0] ?? '';
  const queryIndex = withoutHash.indexOf('?');
  const pathPart = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const queryPart = queryIndex >= 0 ? withoutHash.slice(queryIndex + 1) : '';
  const hostMatch = pathPart.match(/^[a-z][a-z0-9+\-.]*:\/\/([^/?#]+)/i);

  return {
    pathPart,
    queryPart,
    host: hostMatch?.[1] ?? null,
  };
}

export function getQueryParam(url: string, key: string): string | null {
  const parts = getUrlParts(url);
  if (!parts?.queryPart) {
    return null;
  }

  for (const pair of parts.queryPart.split('&')) {
    if (!pair) {
      continue;
    }

    const [rawName, rawValue = ''] = pair.split('=');
    const name = decodeURIComponent(rawName.replace(/\+/g, ' '));
    if (name !== key) {
      continue;
    }

    return decodeURIComponent(rawValue.replace(/\+/g, ' '));
  }

  return null;
}

export function getUrlHostname(url: string): string | null {
  const parts = getUrlParts(url);
  if (!parts?.host) {
    return null;
  }

  return parts.host.split(':', 1)[0] ?? null;
}

export function getUrlOrigin(url: string): string | null {
  const parts = getUrlParts(url);
  if (!parts?.host) {
    return null;
  }

  const protocolMatch = parts.pathPart.match(/^([a-z][a-z0-9+\-.]*:\/\/)/i);
  if (!protocolMatch) {
    return null;
  }

  return `${protocolMatch[1]}${parts.host}`.replace(/\/$/, '');
}
