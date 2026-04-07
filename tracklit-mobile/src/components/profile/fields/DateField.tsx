import React, { useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { spacing, borderRadius } from '@/utils/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';

interface DateFieldProps {
  label: string;
  value?: string; // ISO string yyyy-mm-dd
  onChange: (isoDate: string | null) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

export const DateField: React.FC<DateFieldProps> = ({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const { styles, isDark } = useThemedStyles(createStyles);

  const currentDate = value ? new Date(value) : undefined;
  const displayValue = currentDate
    ? currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Select date';

  const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') setShowPicker(false);
    if (selectedDate) {
      const iso = selectedDate.toISOString().split('T')[0];
      onChange(iso);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="body" weight="medium" color="foreground">
        {label}
      </Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.8}
      >
        <Text variant="body" color={value ? 'foreground' : 'muted'}>
          {displayValue}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={currentDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            themeVariant={isDark ? 'dark' : 'light'}
          />
          {Platform.OS === 'ios' && (
            <Button variant="outline" onPress={() => setShowPicker(false)} style={styles.closeButton}>
              Done
            </Button>
          )}
        </View>
      )}
    </View>
  );
};

const createStyles = (t: ThemeValues) => StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: t.colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    backgroundColor: t.colors.card,
  },
  pickerContainer: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
});
