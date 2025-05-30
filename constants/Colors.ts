/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

/**
 * TFS Brand Colors:
 * - Primary: #070720 (Deep Navy)
 * - Secondary: #360e42 (Deep Purple)
 * - Accent 1: #295a91 (Ocean Blue)
 * - Accent 2: #a02594 (Magenta)
 * - Accent 3: #22c2e5 (Cyan)
 */

const tintColorLight = '#295a91'; // Ocean Blue
const tintColorDark = '#22c2e5'; // Cyan

export const Colors = {
  light: {
    text: '#070720', // Deep Navy
    background: '#fff',
    tint: tintColorLight,
    icon: '#360e42', // Deep Purple
    tabIconDefault: '#360e42',
    tabIconSelected: tintColorLight,
    primary: '#070720',
    secondary: '#360e42',
    accent1: '#295a91',
    accent2: '#a02594',
    accent3: '#22c2e5',
  },
  dark: {
    text: '#ECEDEE',
    background: '#070720', // Deep Navy
    tint: tintColorDark,
    icon: '#22c2e5', // Cyan
    tabIconDefault: '#22c2e5',
    tabIconSelected: tintColorDark,
    primary: '#070720',
    secondary: '#360e42',
    accent1: '#295a91',
    accent2: '#a02594',
    accent3: '#22c2e5',
  },
};
