import React, { useEffect } from 'react';
import {
    Animated,
    Modal,
    StyleSheet,
    Text,
    View,
} from 'react-native';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onHide: () => void;
}

/**
 * Custom Toast component with Animal Crossing inspired design
 */
export function Toast({ 
  visible, 
  message, 
  type = 'info', 
  duration = 2000,
  onHide 
}: ToastProps) {
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(duration),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide();
      });
    }
  }, [visible]);

  if (!visible) return null;

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#9DC183';
      case 'error':
        return '#FF9B85';
      default:
        return '#E0CFFC';
    }
  };

  const getEmoji = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      default:
        return 'ℹ';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
    >
      <View style={styles.container}>
        <Animated.View 
          style={[
            styles.toast,
            { 
              backgroundColor: getBackgroundColor(),
              opacity 
            }
          ]}
        >
          <Text style={styles.emoji}>{getEmoji()}</Text>
          <Text style={styles.message}>{message}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
    pointerEvents: 'none',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#5C4B37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    maxWidth: '85%',
  },
  emoji: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5C4B37',
    marginRight: 12,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5C4B37',
    flexShrink: 1,
  },
});
