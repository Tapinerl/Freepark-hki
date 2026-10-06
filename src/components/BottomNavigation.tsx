import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  PixelRatio,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BottomTabBarProps } from "expo-router/js-tabs";
import { colors } from "@/constants/colors";

const CUTOUT_WIDTH = 72;
const CUTOUT_HEIGHT = 62;
const SHOULDER_WIDTH = 20;
const BAR_HEIGHT = 64;

export default function BottomNavigation({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  const [width, setWidth] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [horizontal] = useState(() => new Animated.Value(0));
  const [vertical] = useState(() => new Animated.Value(0));
  const previousWidth = useRef(0);
  const bottomPadding = Math.max(insets.bottom, 8);
  const tabWidth = width / state.routes.length;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduceMotion(value);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!width) return;
    const target = PixelRatio.roundToNearestPixel(
      tabWidth * state.index + (tabWidth - CUTOUT_WIDTH) / 2,
    );
    horizontal.stopAnimation();
    vertical.stopAnimation();
    // First layout, resizing, and reduced motion jump directly to the tab.
    if (previousWidth.current !== width || reduceMotion) {
      horizontal.setValue(target);
      vertical.setValue(0);
      previousWidth.current = width;
      return;
    }
    const nativeDriver = Platform.OS !== "web";
    const animation = Animated.sequence([
      Animated.timing(vertical, {
        toValue: -CUTOUT_HEIGHT - 2,
        duration: 40,
        easing: Easing.in(Easing.quad),
        useNativeDriver: nativeDriver,
      }),
      Animated.timing(horizontal, {
        toValue: target,
        duration: 35,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: nativeDriver,
      }),
      Animated.timing(vertical, {
        toValue: 0,
        duration: 65,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: nativeDriver,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [state.index, width, tabWidth, reduceMotion, horizontal, vertical]);

  return (
    <View
      style={[
        styles.container,
        {
          height: BAR_HEIGHT + bottomPadding,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <View
        style={styles.bar}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      >
        {width > 0 && (
          <Animated.View
            testID="navigation-cutout"
            pointerEvents="none"
            renderToHardwareTextureAndroid
            shouldRasterizeIOS
            style={[
              styles.cutoutFrame,
              {
                transform: [
                  { translateX: horizontal },
                  { translateY: vertical },
                ],
              },
            ]}
          >
            <View style={styles.cutout} />
            <View style={[styles.shoulder, { left: 0 }]}>
              <View style={[styles.blueCorner, { left: 0, borderTopRightRadius: 20 }]} />
            </View>
            <View style={[styles.shoulder, { right: 0 }]}>
              <View style={[styles.blueCorner, { right: 0, borderTopLeftRadius: 20 }]} />
            </View>
          </Animated.View>
        )}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const selected = index === state.index;
          const color = selected ? "#000000" : colors.surface;
          const label = options.title ?? route.name;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected }}
              aria-selected={selected}
              style={styles.tab}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!selected && !event.defaultPrevented)
                  navigation.navigate(route.name, route.params);
              }}
              onLongPress={() =>
                navigation.emit({ type: "tabLongPress", target: route.key })
              }
            >
              <View style={styles.icon} pointerEvents="none">
                {options.tabBarIcon?.({ focused: selected, color, size: 26 })}
              </View>
              <Text style={[styles.label, { color }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View
        style={{ height: bottomPadding, backgroundColor: colors.primary }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { backgroundColor: colors.background },
  bar: {
    height: BAR_HEIGHT,
    flexDirection: "row",
    backgroundColor: colors.primary,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: "hidden",
  },
  // Include both shoulders in the animation layer's bounds so they are
  // composited together without clipping the outer curves or exposing seams.
  cutoutFrame: {
    position: "absolute",
    top: 0,
    left: -SHOULDER_WIDTH,
    width: CUTOUT_WIDTH + SHOULDER_WIDTH * 2,
    height: CUTOUT_HEIGHT,
  },
  cutout: {
    position: "absolute",
    top: 0,
    left: SHOULDER_WIDTH,
    width: CUTOUT_WIDTH,
    height: CUTOUT_HEIGHT,
    backgroundColor: colors.background,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  shoulder: {
    position: "absolute",
    top: 0,
    // Overlap the cutout by one point so independently rasterized edges
    // cannot expose a hairline of the blue bar between the shapes.
    width: 21,
    height: 20,
    backgroundColor: colors.background,
  },
  blueCorner: { position: "absolute", top: 0, width: 20, height: 20, backgroundColor: colors.primary },
  tab: {
    flex: 1,
    minHeight: BAR_HEIGHT,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 10,
    gap: 3,
  },
  icon: {
    height: 28,
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 11, lineHeight: 16, fontWeight: "500" },
});
