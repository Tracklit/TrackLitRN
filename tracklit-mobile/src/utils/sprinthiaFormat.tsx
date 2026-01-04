import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from './theme';

type Segment = {
  text: string;
  bold?: boolean;
  italic?: boolean;
};

const INLINE_PATTERN = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;

function toSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;

  const addSegment = (value: string) => {
    if (!value) return;
    segments.push({ text: value });
  };

  let match;
  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      addSegment(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**')) {
      segments.push({ text: token.slice(2, -2), bold: true });
    } else if (token.startsWith('*')) {
      segments.push({ text: token.slice(1, -1), italic: true });
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    addSegment(text.slice(lastIndex));
  }

  return segments.length ? segments : [{ text }];
}

function renderSegments(segments: Segment[], keyPrefix: string) {
  return segments.map((segment, idx) => (
    <Text
      key={`${keyPrefix}-seg-${idx}`}
      style={[
        styles.text,
        segment.bold && styles.bold,
        segment.italic && styles.italic,
      ]}
    >
      {segment.text}
    </Text>
  ));
}

function renderLine(line: string, index: number) {
  const headingMatch = line.match(/^#+\s*(.*)$/);
  const bulletMatch = line.match(/^\s*[-*]\s+(.*)$/);

  if (headingMatch) {
    const content = headingMatch[1].trim();
    return (
      <Text key={`line-${index}`} style={[styles.text, styles.heading]}>
        {renderSegments(toSegments(content), `heading-${index}`)}
      </Text>
    );
  }

  if (bulletMatch) {
    const content = bulletMatch[1].trim();
    return (
      <View key={`line-${index}`} style={styles.bulletRow}>
        <Text style={[styles.text, styles.bulletMarker]}>•</Text>
        <Text style={styles.text}>
          {renderSegments(toSegments(content), `bullet-${index}`)}
        </Text>
      </View>
    );
  }

  return (
    <Text key={`line-${index}`} style={styles.text}>
      {renderSegments(toSegments(line), `line-${index}`)}
    </Text>
  );
}

export const FormattedSprinthiaText: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split(/\r?\n/);
  return <View style={styles.container}>{lines.map(renderLine)}</View>;
};

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  text: {
    color: theme.colors.foreground,
    fontSize: 15,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  heading: {
    fontWeight: '700',
    fontSize: 16,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletMarker: {
    color: theme.colors.foreground,
    fontSize: 16,
    lineHeight: 22,
  },
});


