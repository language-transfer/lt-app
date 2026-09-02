import { render, screen, waitFor } from "@testing-library/react-native";
import React from "react";

import Index from "../../app/(main)/index";

const mockReplace = jest.fn();
const mockGetMostRecentListenedCourse = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("@/src/components/language-selector/LanguageSelector", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { Text } = jest.requireActual<typeof import("react-native")>(
    "react-native"
  );

  return function MockLanguageSelector() {
    return React.createElement(Text, null, "Language selector");
  };
});

jest.mock("@/src/data/courseData", () => ({
  __esModule: true,
  default: {
    isCourseVisible: (course: string) => course !== "ingles",
  },
}));

jest.mock("@/src/storage/persistence", () => ({
  getMostRecentListenedCourse: () => mockGetMostRecentListenedCourse(),
}));

describe("initial course redirect", () => {
  test("shows the language selector when the last course is hidden Inglés", async () => {
    mockGetMostRecentListenedCourse.mockResolvedValue("ingles");

    render(<Index />);

    expect(await screen.findByText("Language selector")).toBeVisible();
    await waitFor(() => expect(mockReplace).not.toHaveBeenCalled());
  });
});
