// src/utils/theme.js
import { createTheme } from '@mantine/core';

export const benitoTheme = createTheme({
  primaryColor: 'benito-orange',
  colors: {
    'benito-orange': [
      '#fff4e6', '#ffe8cc', '#ffd8a8', '#ffc078', '#ffa94d',
      '#ff922b', '#f76707', '#e8590c', '#d9480f', '#c92a2a'
    ],
    'benito-navy': [
      '#e8edf5', '#c5d0e6', '#9fb1d5', '#7891c4', '#5271b3',
      '#3d5a99', '#2c4a80', '#1e3a68', '#1a2744', '#0f1a2e'
    ],
  },
  fontFamily: '"Outfit", sans-serif',
  headings: {
    fontFamily: '"Playfair Display", serif',
  },
  defaultRadius: 'md',
  components: {
    Button: {
      defaultProps: {
        radius: 'xl',
      },
    },
    Card: {
      defaultProps: {
        radius: 'lg',
      },
    },
  },
});

export const COLORS = {
  orange: '#f76707',
  orangeLight: '#ff922b',
  orangePale: '#fff4e6',
  navy: '#1a2744',
  navyLight: '#2c4a80',
  navyDark: '#0f1a2e',
  white: '#ffffff',
  offWhite: '#f8f9fa',
  cream: '#fefcf9',
  gold: '#d4a574',
  goldLight: '#e8c9a0',
  textDark: '#1a2744',
  textMuted: '#5c6b7f',
  borderLight: '#e8edf5',
};
