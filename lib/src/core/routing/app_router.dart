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
import 'package:languagetransfer/src/features/player/presentation/player_dock.dart';
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
            pageBuilder: (context, state) =>
                _page(state, const CourseListScreen()),
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
                pageBuilder: (context, state) => _page(
                  state,
                  CourseScreen(
                    course: Courses.byId(state.pathParameters['courseId']!)!,
                  ),
                ),
                routes: [
                  GoRoute(
                    path: 'manage',
                    pageBuilder: (context, state) => _page(
                      state,
                      ManageCourseScreen(
                        course: Courses.byId(
                          state.pathParameters['courseId']!,
                        )!,
                      ),
                    ),
                  ),
                ],
              ),
              GoRoute(
                path: 'settings',
                pageBuilder: (context, state) =>
                    _page(state, const SettingsScreen()),
              ),
              GoRoute(
                path: 'about',
                pageBuilder: (context, state) =>
                    _page(state, const AboutScreen()),
              ),
            ],
          ),
        ],
      ),
    ],
  );
  ref.onDispose(router.dispose);
  return router;
});

/// A screen with the platform's page transitions, including the iOS swipe
/// back. Left to itself, go_router 18 looks for `material_ui`'s MaterialApp
/// rather than Flutter's, finds none, and builds pages without transitions
/// or swipe back.
Page<void> _page(GoRouterState state, Widget child) =>
    MaterialPage<void>(key: state.pageKey, child: child);

/// Every screen, with the mini-player below it. The player opens over all
/// of it (see PlayerSheetRoute).
class _Shell extends ConsumerStatefulWidget {
  const _Shell({required this.child});

  final Widget child;

  @override
  ConsumerState<_Shell> createState() => _ShellState();
}

class _ShellState extends ConsumerState<_Shell> {
  final GlobalKey _miniPlayer = GlobalKey(debugLabel: 'mini-player');

  @override
  Widget build(BuildContext context) => PlayerDock(
    miniPlayer: _miniPlayer,
    copy: const MiniPlayer(),
    child: Column(
      children: [
        Expanded(
          // The mini-player keeps clear of the bottom inset itself, so the
          // screen above it must not leave room for it again.
          child: MediaQuery.removePadding(
            context: context,
            removeBottom: ref.watch(
              activeLessonProvider.select((lesson) => lesson != null),
            ),
            child: widget.child,
          ),
        ),
        MiniPlayer(key: _miniPlayer),
      ],
    ),
  );
}
