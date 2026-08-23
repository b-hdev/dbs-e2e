import { Platform } from 'react-native';

/**
 * Identidade Visual Oficial DBS TELECOM
 * - Cor Primária (Laranja Vibrante): #F84B03
 * - Cor Secundária (Laranja Suave): #FB8200
 * - Tipografia & Elementos Escuros: #4B4C51
 * - Fundo e Elementos Claros: #FFFFFF
 */
export const Colors = {
  // Cores Principais da Marca
  primary: '#F84B03',
  primarySecondary: '#FB8200',
  primaryLight: '#FFF2EB',
  
  // Elementos Escuros & Textos
  text: '#4B4C51',
  textSecondary: '#78797D',
  darkColor: '#4B4C51',
  
  // Fundo & Estrutura
  background: '#FFFFFF',
  backgroundAlt: '#F8F9FA',
  card: '#FFFFFF',
  border: '#E9EAEB',

  // Departamentos
  departamentos: {
    SUPORTE: '#F84B03',
    COMERCIAL: '#2E7D32',
    FINANCEIRO: '#FB8200',
    INDEFINIDO: '#4B4C51',
  },
  
  // Chat
  userBubble: '#F84B03',
  userText: '#FFFFFF',
  aiBubble: '#F8F9FA',
  aiText: '#4B4C51',
  
  // Feedback
  success: '#10B981',
  warning: '#FB8200',
  error: '#DC2626',

  // Compatibilidade Expo Themed
  light: {
    text: '#4B4C51',
    background: '#FFFFFF',
    backgroundElement: '#FFF2EB',
    backgroundSelected: '#FFE4D6',
    textSecondary: '#78797D',
  },
  dark: {
    text: '#FFFFFF',
    background: '#4B4C51',
    backgroundElement: '#3B3C40',
    backgroundSelected: '#2B2C30',
    textSecondary: '#D1D5DB',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'Montserrat, Poppins, sans-serif',
    serif: 'serif',
    rounded: 'sans-serif',
    mono: 'monospace',
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,

  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
