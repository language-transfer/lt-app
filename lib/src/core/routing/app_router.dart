import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:languagetransfer/src/core/routing/app_routes.dart';
import 'package:languagetransfer/src/features/about/presentation/about_screen.dart';
import 'package:languagetransfer/src/features/catalog/domain/course.dart';
import 'package:languagetransfer/src/features/course_home/presentation/course_screen.dart';
import 'package:languagetransfer/src/features/course_home/presentation/manage_course_screen.dart';
import 'package:languagetransfer/src/features/courses/presentation/course_list_screen.dart';
import 'package:languagetransfer/src/features/player/application/player_providers.dart';
import 'package:languagetransfer/src/features/player/presentation/mini_player.dart';
import 'package:languagetransfer/src/features/player/presentation/player_screen.dart';
import 'package:languagetransfer/src/features/settings/presentation/settings_screen.dart';

/// Where the app opens: the most recently listened course, like the Expo app
/// (upstream `app/(main)/index.tsx`), or the course list. Provided in main().
final initialLocationProvider = Provider<String>((ref) => AppRoutes.courses);

final routerProvider = Provider<GoRouter>((ref) {
  final router = GoRouter(
    initialLocation: ref.watch(initialLocationProvider),
    routes: [
      ShellRoute(
        builder: (context, state, child) => _Shell(child: child),
        routes: [
          GoRoute(
            path: AppRoutes.courses,
            builder: (context, state) => const CourseListScreen(),
            routes: [
              GoRoute(
                path: 'course/:courseId',
                // Retired courses open their successor; unknown ones the list.
                redirect: (context, state) {
                  final id = state.pathParameters['courseId']!;
                  final course = Courses.resolve(id);
                  if (course == null) return AppRoutes.courses;
                  if (course.id != id) return AppRoutes.course(course.id);
                  return null;
                },
                builder: (context, state) => CourseScreen(
                  course: Courses.byId(state.pathParameters['courseId']!)!,
                ),
                routes: [
                  GoRoute(
                    path: 'manage',
                    builder: (context, state) => ManageCourseScreen(
                      course: Courses.byId(state.pathParameters['courseId']!)!,
                    ),
                  ),
                ],
              ),
              GoRoute(
                path: 'settings',
                builder: (context, state) => const SettingsScreen(),
              ),
              GoRoute(
                path: 'about',
                builder: (context, state) => const AboutScreen(),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: AppRoutes.player,
        pageBuilder: (context, state) => CustomTransitionPage<void>(
          key: state.pageKey,
          fullscreenDialog: true,
          child: const PlayerScreen(),
          transitionsBuilder: (context, animation, secondary, child) =>
              SlideTransition(
                position: animation.drive(
                  Tween(
                    begin: const Offset(0, 1),
                    end: Offset.zero,
                  ).chain(CurveTween(curve: Curves.easeOutCubic)),
                ),
                child: child,
              ),
        ),
      ),
    ],
  );
  ref.onDispose(router.dispose);
  return router;
});

/// Every screen except the player, with the mini-player below it.
class _Shell extends ConsumerWidget {
  const _Shell({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) => Column(
    children: [
      Expanded(
        // The mini-player keeps clear of the bottom inset itself, so the
        // screen above it must not leave room for it again.
        child: MediaQuery.removePadding(
          context: context,
          removeBottom: ref.watch(miniPlayerVisibleProvider),
          child: child,
        ),
      ),
      const MiniPlayer(),
    ],
  );
}
