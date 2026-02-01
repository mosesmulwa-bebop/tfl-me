import React from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';

interface DialogAction {
  text: string;
  onPress: () => void;
  style?: 'default' | 'destructive' | 'cancel';
}

interface DialogProps {
  visible: boolean;
  title: string;
  message: string;
  actions: DialogAction[];
  onClose: () => void;
}

/**
 * Custom Dialog component with Animal Crossing inspired design
 */
export function Dialog({ visible, title, message, actions, onClose }: DialogProps) {
  const getButtonStyle = (style?: string): ViewStyle => {
    switch (style) {
      case 'destructive':
        return styles.destructiveButton;
      case 'cancel':
        return styles.cancelButton;
      default:
        return styles.defaultButton;
    }
  };

  const getButtonTextColor = (style?: string): string => {
    switch (style) {
      case 'cancel':
        return '#8B7355';
      default:
        return '#5C4B37';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable 
        style={styles.overlay}
        onPress={onClose}
      >
        <View 
          style={styles.dialogContainer}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.dialog}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            
            <View style={styles.actionsContainer}>
              {actions.map((action, index) => (
                <Pressable
                  key={index}
                  style={({ pressed }) => [
                    styles.button,
                    getButtonStyle(action.style),
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => {
                    action.onPress();
                    onClose();
                  }}
                >
                  <Text 
                    style={[
                      styles.buttonText,
                      { color: getButtonTextColor(action.style) }
                    ]}
                  >
                    {action.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(92, 75, 55, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    width: '85%',
    maxWidth: 400,
  },
  dialog: {
    backgroundColor: '#FFF9F0',
    borderRadius: 24,
    padding: 24,
    borderWidth: 3,
    borderColor: '#5C4B37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#5C4B37',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#8B7355',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionsContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#5C4B37',
  },
  defaultButton: {
    backgroundColor: '#B8E6D5',
  },
  destructiveButton: {
    backgroundColor: '#FF9B85',
  },
  cancelButton: {
    backgroundColor: '#F5F0E8',
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
