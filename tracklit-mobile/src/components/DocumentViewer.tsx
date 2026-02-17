import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { X } from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import theme from '@/utils/theme';

type Props = {
  url: string;
  title?: string;
  onClose: () => void;
};

export const DocumentViewer: React.FC<Props> = ({ url, title, onClose }) => {
  const [loading, setLoading] = useState(true);

  const googleViewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
  const isGoogleViewable = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i.test(url);
  const displayUrl = isGoogleViewable ? googleViewerUrl : url;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="small" weight="semiBold" color="foreground" numberOfLines={1} style={styles.title}>
          {title || 'Document'}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
          <X size={16} color={theme.colors.foreground} weight="bold" />
        </TouchableOpacity>
      </View>
      <View style={styles.webviewWrap}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text variant="small" color="muted" style={{ marginTop: theme.spacing.sm }}>
              Loading document...
            </Text>
          </View>
        )}
        <WebView
          source={{ uri: displayUrl }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          scalesPageToFit
          allowsInlineMediaPlayback
          onLoadEnd={() => setLoading(false)}
          nestedScrollEnabled
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(10, 21, 41, 0.6)',
    overflow: 'hidden',
    height: 559,
    marginTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  title: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  webviewWrap: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 21, 41, 0.9)',
  },
});
