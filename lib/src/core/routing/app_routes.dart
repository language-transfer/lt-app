/// Paths of the app's screens.
abstract final class AppRoutes {
  static const courses = '/';
  static String course(String courseId) => '/course/$courseId';
  static String manageCourse(String courseId) => '/course/$courseId/manage';
  static const settings = '/settings';
  static const about = '/about';
}
