import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

export type GlobalLoadingApi = {
  show: (message?: string) => void;
  hide: () => void;
  setMessage: (message?: string) => void;
};

export type GlobalLoadingState = {
  visible: boolean;
  message?: string;
};

const GlobalLoadingContext = createContext<GlobalLoadingApi | null>(null);

export function useGlobalLoading(): GlobalLoadingApi {
  const ctx = useContext(GlobalLoadingContext);
  if (!ctx) {
    throw new Error(
      "useGlobalLoading must be used within GlobalLoadingProvider"
    );
  }
  return ctx;
}

export function GlobalLoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<GlobalLoadingState>({ visible: false });
  const stateRef = useRef(state);
  stateRef.current = state;

  const show = useCallback((message?: string) => {
    setState({ visible: true, message });
  }, []);

  const hide = useCallback(() => {
    setState((s) => ({ ...s, visible: false }));
  }, []);

  const setMessage = useCallback((message?: string) => {
    setState((s) => ({ ...s, message }));
  }, []);

  const value = useMemo<GlobalLoadingApi>(
    () => ({ show, hide, setMessage }),
    [show, hide, setMessage]
  );

  return (
    <GlobalLoadingContext.Provider value={value}>
      {children}
      <Modal
        transparent
        statusBarTranslucent
        visible={state.visible}
        animationType="fade"
      >
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <ActivityIndicator
              size={Platform.OS === "ios" ? "large" : 48}
              color="#fff"
            />
            {!!state.message && (
              <Text style={styles.message}>{state.message}</Text>
            )}
          </View>
        </View>
      </Modal>
    </GlobalLoadingContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheet: {
    minWidth: 140,
    maxWidth: "80%",

    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 12,
  },
  message: {
    marginTop: 8,
    color: "#fff",
    textAlign: "center",
  },
});

// Optional: simple global bridge for non-React code (e.g., Axios interceptors)
export const GlobalLoadingBridge: {
  api: GlobalLoadingApi | null;
  setApi: (api: GlobalLoadingApi | null) => void;
} = {
  api: null,
  setApi(api) {
    this.api = api;
  },
};

export function GlobalLoadingRegistrar() {
  const api = useGlobalLoading();
  React.useEffect(() => {
    GlobalLoadingBridge.setApi(api);
    return () => GlobalLoadingBridge.setApi(null);
  }, [api]);
  return null;
}
