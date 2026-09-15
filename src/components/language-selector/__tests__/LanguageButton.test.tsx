import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LanguageButton from "../LanguageButton";
import { queryClient } from "@/src/data/queryClient";
import {
  COURSE_INDEX_QUERY_KEY,
  COURSE_INDEX_STORAGE_KEY,
} from "@/src/data/courseIndex";

jest.mock("@react-native-async-storage/async-storage", () => {
  const values = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
    },
  };
});

jest.mock("@/src/services/downloadManager", () => ({
  ensureObjectDir: jest.fn(),
  ensureRootObjectDir: jest.fn(),
  getLocalObjectPath: jest.fn(),
}));

test("shows the bundled count immediately, then uses the index and reacts to updates", async () => {
  const index = {
    buildVersion: 2,
    casBaseURL: "https://example.test",
    courses: [
      {
        id: "ingles_completo",
        lessons: 60,
        meta: {
          _type: "file",
          object: "meta",
          filesize: 1,
          mimeType: "application/json",
        },
      },
    ],
  };
  await AsyncStorage.setItem(
    COURSE_INDEX_STORAGE_KEY,
    JSON.stringify({ timestamp: Date.now(), data: index })
  );
  const view = render(
    <QueryClientProvider client={queryClient}>
      <LanguageButton course="ingles_completo" width={200} onPress={() => {}} />
    </QueryClientProvider>
  );
  expect(screen.getByText("51 lessons")).toBeTruthy();
  await waitFor(() => expect(screen.getByText("60 lessons")).toBeTruthy());
  const query = queryClient
    .getQueryCache()
    .find({ queryKey: COURSE_INDEX_QUERY_KEY });
  expect(query?.options).toMatchObject({
    staleTime: 0,
    refetchInterval: expect.any(Function),
  });
  queryClient.setQueryData(COURSE_INDEX_QUERY_KEY, {
    ...index,
    courses: [{ ...index.courses[0], lessons: 65 }],
  });
  await waitFor(() => expect(screen.getByText("65 lessons")).toBeTruthy());
  view.unmount();
  queryClient.clear();
});
