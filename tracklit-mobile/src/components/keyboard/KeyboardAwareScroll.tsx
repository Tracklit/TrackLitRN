import React from 'react';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';
import {
  KeyboardAwareFlatList,
  KeyboardAwareScrollView,
} from 'react-native-keyboard-aware-scroll-view';

type CommonProps = {
  bottomPadding?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

function withBottomPadding(
  contentContainerStyle: CommonProps['contentContainerStyle'],
  bottomPadding?: number,
) {
  if (!bottomPadding) return contentContainerStyle;
  return [contentContainerStyle, { paddingBottom: bottomPadding }];
}

export type KeyboardAwareScreenScrollViewProps =
  React.ComponentProps<typeof KeyboardAwareScrollView> & CommonProps;

export function KeyboardAwareScreenScrollView({
  bottomPadding,
  contentContainerStyle,
  enableOnAndroid = true,
  enableResetScrollToCoords = false,
  keyboardDismissMode = 'on-drag',
  keyboardOpeningTime = Platform.OS === 'android' ? 0 : 250,
  keyboardShouldPersistTaps = 'handled',
  extraScrollHeight = 24,
  ...rest
}: KeyboardAwareScreenScrollViewProps) {
  return (
    <KeyboardAwareScrollView
      enableOnAndroid={enableOnAndroid}
      enableResetScrollToCoords={enableResetScrollToCoords}
      keyboardDismissMode={keyboardDismissMode}
      keyboardOpeningTime={keyboardOpeningTime}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      extraScrollHeight={extraScrollHeight}
      contentContainerStyle={withBottomPadding(contentContainerStyle, bottomPadding)}
      {...rest}
    />
  );
}

export type KeyboardAwareScreenFlatListProps<T> =
  React.ComponentProps<typeof KeyboardAwareFlatList> & CommonProps;

export function KeyboardAwareScreenFlatList<T = any>({
  bottomPadding,
  contentContainerStyle,
  enableOnAndroid = true,
  enableResetScrollToCoords = false,
  keyboardDismissMode = 'on-drag',
  keyboardOpeningTime = Platform.OS === 'android' ? 0 : 250,
  keyboardShouldPersistTaps = 'handled',
  extraScrollHeight = 24,
  ...rest
}: KeyboardAwareScreenFlatListProps<T>) {
  return (
    <KeyboardAwareFlatList
      enableOnAndroid={enableOnAndroid}
      enableResetScrollToCoords={enableResetScrollToCoords}
      keyboardDismissMode={keyboardDismissMode}
      keyboardOpeningTime={keyboardOpeningTime}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      extraScrollHeight={extraScrollHeight}
      contentContainerStyle={withBottomPadding(contentContainerStyle, bottomPadding)}
      {...rest}
    />
  );
}
