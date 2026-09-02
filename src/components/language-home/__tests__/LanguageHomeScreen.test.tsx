import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import LanguageHomeScreen from "@/src/components/language-home/LanguageHomeScreen";

const mockPush = jest.fn();
const mockLog = jest.fn();
const mockSetPreference = jest.fn();
const mockIsCourseMetadataLoaded = jest.fn(() => true);
const mockLoadCourseMetadata = jest.fn(
  async (..._args: unknown[]): Promise<void> => undefined
);
let mockBannerDismissed = false;

jest.mock("expo-router", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  return {
    useFocusEffect: (effect: () => void | (() => void)) =>
      React.useEffect(effect, [effect]),
    useRouter: () => ({ push: mockPush }),
  };
});

jest.mock("@expo/vector-icons", () => ({
  FontAwesome5: () => null,
}));

jest.mock(
  "@/src/components/language-home/LanguageHomeTopButton",
  () => () => null
);

jest.mock("@/src/data/courseData", () => ({
  __esModule: true,
  default: {
    getCourseUIColors: () => ({
      background: "#7186d0",
      backgroundAccent: "#516198",
      softBackground: "#d5daee",
      text: "white",
    }),
    isCourseMetadataLoaded: () => mockIsCourseMetadataLoaded(),
    loadCourseMetadata: (...args: unknown[]) => mockLoadCourseMetadata(...args),
  },
}));

jest.mock("@/src/hooks/useCourseLessonData", () => ({
  useCurrentCourse: () => "ingles_completo",
}));

jest.mock("@/src/hooks/useStatusBarStyle", () => jest.fn());

jest.mock("@/src/storage/persistence", () => ({
  PreferenceLegacyInglesBannerDismissed: {
    name: "legacy-ingles-banner-dismissed",
  },
  setPreference: (...args: unknown[]) => mockSetPreference(...args),
  usePreference: () => mockBannerDismissed,
}));

jest.mock("@/src/utils/log", () => ({
  useLogger: () => mockLog,
}));

describe("previous Inglés course access", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBannerDismissed = false;
    mockIsCourseMetadataLoaded.mockReturnValue(true);
    mockLoadCourseMetadata.mockResolvedValue(undefined);
  });

  test("shows both the dismissible banner and persistent course button", async () => {
    render(<LanguageHomeScreen />);

    expect(
      await screen.findByText(/¿Buscas el curso anterior\?/)
    ).toBeVisible();
    expect(
      screen.getByText("Introducción a Inglés — curso anterior")
    ).toBeVisible();

    fireEvent.press(screen.getByText("Abrir curso anterior"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/course/[course]",
      params: { course: "ingles" },
    });

    fireEvent.press(
      screen.getByRole("button", {
        name: "Cerrar aviso del curso anterior",
      })
    );
    expect(mockSetPreference).toHaveBeenCalledWith(
      expect.objectContaining({ name: "legacy-ingles-banner-dismissed" }),
      true
    );
  });

  test("keeps the persistent button after the banner is dismissed", async () => {
    mockBannerDismissed = true;
    render(<LanguageHomeScreen />);

    expect(
      await screen.findByText("Introducción a Inglés — curso anterior")
    ).toBeVisible();
    expect(screen.queryByText(/¿Buscas el curso anterior\?/)).toBeNull();
  });

  test("offers the old course when new-course metadata cannot load", async () => {
    mockIsCourseMetadataLoaded.mockReturnValue(false);
    mockLoadCourseMetadata.mockRejectedValue(new Error("offline"));
    const warn = jest
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    render(<LanguageHomeScreen />);

    await screen.findByText("Abrir el curso anterior");
    expect(mockLoadCourseMetadata).toHaveBeenCalledWith(
      "ingles_completo",
      false
    );

    fireEvent.press(screen.getByText("Try Again"));
    await waitFor(() =>
      expect(mockLoadCourseMetadata).toHaveBeenCalledWith(
        "ingles_completo",
        true
      )
    );

    fireEvent.press(await screen.findByText("Abrir el curso anterior"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/course/[course]",
      params: { course: "ingles" },
    });
    warn.mockRestore();
  });
});
