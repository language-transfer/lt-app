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
  PreferenceCompleteInglesLaunchBannerDismissed: {
    name: "complete-ingles-launch-banner-dismissed",
  },
  setPreference: (...args: unknown[]) => mockSetPreference(...args),
  usePreference: () => mockBannerDismissed,
}));

jest.mock("@/src/utils/log", () => ({
  useLogger: () => mockLog,
}));

describe("Complete Inglés launch banner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBannerDismissed = false;
    mockIsCourseMetadataLoaded.mockReturnValue(true);
    mockLoadCourseMetadata.mockResolvedValue(undefined);
  });

  test("shows the dismissible new-course announcement without old-course access", async () => {
    render(<LanguageHomeScreen />);

    expect(await screen.findByText("¡Nuevo curso!")).toBeVisible();
    expect(
      screen.getByText("¡'Inglés Completo' ya se está lanzando!")
    ).toBeVisible();
    expect(
      screen.getByText("Empieza desde el principio de este nuevo curso.")
    ).toBeVisible();
    expect(screen.queryByText(/curso anterior/i)).toBeNull();

    fireEvent.press(
      screen.getByRole("button", {
        name: "Cerrar anuncio del nuevo curso",
      })
    );
    expect(mockSetPreference).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "complete-ingles-launch-banner-dismissed",
      }),
      true
    );
  });

  test("hides the announcement after it is dismissed", async () => {
    mockBannerDismissed = true;
    render(<LanguageHomeScreen />);

    expect(await screen.findByText("All Lessons")).toBeVisible();
    expect(screen.queryByText("¡Nuevo curso!")).toBeNull();
    expect(screen.queryByText(/curso anterior/i)).toBeNull();
  });

  test("retries new-course metadata without offering the old course", async () => {
    mockIsCourseMetadataLoaded.mockReturnValue(false);
    mockLoadCourseMetadata.mockRejectedValue(new Error("offline"));
    const warn = jest
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    render(<LanguageHomeScreen />);

    await screen.findByText("Unable to load this course");
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

    expect(screen.queryByText(/curso anterior/i)).toBeNull();
    warn.mockRestore();
  });
});
