import React, { useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import theme from '@/utils/theme';

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

  const currentDate = value ? new Date(value) : undefined;
  const displayValue = value || 'Select date';

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
            themeVariant="dark"
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

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
  },
  pickerContainer: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
});

