import * as React from 'react';

export function usePullToRefresh(refreshFn: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const refreshingRef = React.useRef(false);

  const onRefresh = React.useCallback(async () => {
    if (refreshingRef.current) return;

    refreshingRef.current = true;
    setIsRefreshing(true);
    try {
      await refreshFn();
    } catch (error) {
      console.error('[REFRESH] Failed:', error);
    } finally {
      refreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [refreshFn]);

  return { isRefreshing, onRefresh };
}
