module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
          '@/components': './src/components',
          '@/screens': './src/screens',
          '@/navigation': './src/navigation',
          '@/utils': './src/utils',
          '@/hooks': './src/hooks',
          '@/types': './src/types',
          '@/services': './src/services',
          '@/assets': './src/assets',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
