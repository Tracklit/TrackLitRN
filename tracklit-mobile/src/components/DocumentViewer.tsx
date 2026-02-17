import React from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import theme from '@/utils/theme';

type Props = {
  visible: boolean;
  url: string;
  title?: string;
  onClose: () => void;
};

export const DocumentViewer: React.FC<Props> = ({ visible, url, title, onClose }) => {
  const insets = useSafeAreaInsets();

  if (!visible || !url) return null;

  const googleViewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
  const isGoogleViewable = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i.test(url);
  const displayUrl = isGoogleViewable ? googleViewerUrl : url;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text variant="body" weight="semiBold" color="foreground" numberOfLines={1} style={styles.title}>
            {title || 'Document'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
            <X size={20} color={theme.colors.foreground} weight="bold" />
          </TouchableOpacity>
        </View>
        <WebView
          source={{ uri: displayUrl }}
          style={styles.webview}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          scalesPageToFit
          allowsInlineMediaPlayback
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    marginRight: theme.spacing.md,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  webview: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
