import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle, 
  ActivityIndicator 
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

type ThemedButtonProps = {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
};

const ThemedButton: React.FC<ThemedButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left'
}) => {
  const { colors, isDarkMode } = useTheme();

  const getButtonStyles = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.accent,
          borderColor: colors.accent,
        };
      case 'secondary':
        return {
          backgroundColor: isDarkMode ? '#444444' : '#E0E0E0',
          borderColor: isDarkMode ? '#444444' : '#E0E0E0',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.accent,
          borderWidth: 1,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
      default:
        return {
          backgroundColor: colors.accent,
          borderColor: colors.accent,
        };
    }
  };

  const getTextStyles = (): TextStyle => {
    switch (variant) {
      case 'primary':
        return {
          color: 'white',
        };
      case 'secondary':
        return {
          color: isDarkMode ? 'white' : '#333333',
        };
      case 'outline':
      case 'ghost':
        return {
          color: colors.accent,
        };
      default:
        return {
          color: 'white',
        };
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyles(),
        disabled && styles.disabledButton,
        disabled && { backgroundColor: isDarkMode ? '#333333' : '#D1D1D1' },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' || variant === 'ghost' ? colors.accent : 'white'} 
          size="small" 
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons 
              name={icon as any} 
              size={18} 
              color={getTextStyles().color} 
              style={styles.leftIcon} 
            />
          )}
          <Text style={[styles.buttonText, getTextStyles(), textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons 
              name={icon as any} 
              size={18} 
              color={getTextStyles().color} 
              style={styles.rightIcon} 
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});

export default ThemedButton; 