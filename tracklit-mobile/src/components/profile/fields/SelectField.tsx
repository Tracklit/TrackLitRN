import React, { useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View, FlatList } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import theme from '@/utils/theme';

interface Option {
  label: string;
  value: string;
}

interface SelectFieldProps {
  label: string;
  value?: string;
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  options,
  placeholder = 'Select',
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.container}>
      <Text variant="body" weight="medium" color="foreground">
        {label}
      </Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text variant="body" color={selected ? 'foreground' : 'muted'}>
          {selected ? selected.label : placeholder}
        </Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text variant="h4" weight="semiBold" color="foreground">
                {label}
              </Text>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text variant="body" color="foreground">
                    {item.label}
                  </Text>
                  {item.value === value ? (
                    <Text variant="small" color="primary">
                      Selected
                    </Text>
                  ) : null}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
            <Button variant="outline" onPress={() => setOpen(false)} style={styles.closeButton}>
              Close
            </Button>
          </View>
        </View>
      </Modal>
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modal: {
    width: '100%',
    maxHeight: '70%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  modalHeader: {
    marginBottom: theme.spacing.xs,
  },
  option: {
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  closeButton: {
    marginTop: theme.spacing.sm,
  },
});

