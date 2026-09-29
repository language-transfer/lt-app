import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart';
import 'package:languagetransfer/src/core/providers.dart';
import 'package:languagetransfer/src/features/catalog/data/catalog_api.dart';
import 'package:languagetransfer/src/features/catalog/data/course_index_repository.dart';
import 'package:languagetransfer/src/features/catalog/data/course_metadata_repository.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_index.dart';
import 'package:languagetransfer/src/features/catalog/domain/course_metadata.dart';

final catalogApiProvider = Provider<CatalogApi>(
  (ref) => CatalogApi(
    ref.watch(httpClientProvider),
    userAgent: ref.watch(userAgentProvider),
  ),
);

final courseIndexRepositoryProvider = Provider<CourseIndexRepository>((ref) {
  final repository = CourseIndexRepository(
    api: ref.watch(catalogApiProvider),
    database: ref.watch(databaseProvider),
  );
  ref.onDispose(repository.dispose);
  return repository;
});

final courseMetadataRepositoryProvider = Provider<CourseMetadataRepository>(
  (ref) => CourseMetadataRepository(
    api: ref.watch(catalogApiProvider),
    store: ref.watch(objectStoreProvider),
  ),
);

/// The course index. Emits the cached index at once, then every refreshed
/// one. While the app stays open, it checks again when the index becomes
/// due (upstream refetches every twelve hours).
final courseIndexProvider = StreamProvider<LoadedCourseIndex>((ref) async* {
  final repository = ref.watch(courseIndexRepositoryProvider);
  Timer? recheck;
  ref.onDispose(() => recheck?.cancel());

  void scheduleRecheck() {
    // A load may complete after the provider was disposed.
    if (!ref.mounted) return;
    recheck?.cancel();
    recheck = Timer(
      // At least five minutes, so an offline device is not asked to refresh
      // over and over.
      _atLeast(repository.timeUntilStale, const Duration(minutes: 5)),
      () => unawaited(repository.load().then((_) => scheduleRecheck())),
    );
  }

  final first = await repository.load();
  scheduleRecheck();
  yield first;
  await for (final update in repository.updates) {
    scheduleRecheck();
    yield update;
  }
});

/// The lessons of one course. Follows the index, so a new version of the
/// course replaces the old one when the index is refreshed.
final FutureProviderFamily<CourseMetadata, String> courseMetadataProvider =
    FutureProvider.family<CourseMetadata, String>((ref, courseId) async {
      final loaded = await ref.watch(courseIndexProvider.future);
      final entry = loaded.index.entryFor(courseId);
      if (entry == null) throw UnknownCourseException(courseId);
      return await ref
          .watch(courseMetadataRepositoryProvider)
          .load(loaded.index, entry);
    });

Duration _atLeast(Duration value, Duration minimum) =>
    value < minimum ? minimum : value;
