jest.mock("expo-symbols", () => ({ SymbolView: () => null }));
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) },
  useLocalSearchParams: jest.fn(() => ({})),
}));
jest.mock("react-native-safe-area-context", () => {
  const actual = jest.requireActual("react-native");
  return { SafeAreaView: actual.View, useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) };
});
process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN = "pk.synthetic-test-only";
