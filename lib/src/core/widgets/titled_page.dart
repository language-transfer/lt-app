import 'package:flutter/material.dart';
import 'package:languagetransfer/src/core/theme/lt_colors.dart';
import 'package:languagetransfer/src/core/theme/motion.dart';

/// A screen with its [title] large at the top, on the same edge as the
/// content, under a bar with the back button and [actions]. The bar stays;
/// once the top has scrolled away under it, the bar shows the title small.
class TitledPage extends StatefulWidget {
  const TitledPage({
    required this.title,
    required this.slivers,
    this.subtitle,
    this.header,
    this.actions = const [],
    this.barColor,
    this.barForeground,
    super.key,
  });

  final String title;

  /// Under the large title, in secondary text.
  final String? subtitle;

  /// The top of the screen in place of the large title and [subtitle], for
  /// a screen whose top says more.
  final Widget? header;

  final List<Widget> slivers;
  final List<Widget> actions;

  /// The bar's colour; the screen's background when `null`.
  final Color? barColor;
  final Color? barForeground;

  @override
  State<TitledPage> createState() => _TitledPageState();
}

class _TitledPageState extends State<TitledPage> {
  final GlobalKey _top = GlobalKey();

  /// Whether the top has scrolled away under the bar.
  bool _scrolledAway = false;

  bool _onScroll(ScrollNotification notification) {
    if (notification.depth != 0) return false;
    final top = _top.currentContext?.findRenderObject();
    final height = top is RenderBox && top.hasSize ? top.size.height : 0.0;
    final scrolledAway = notification.metrics.pixels >= height;
    if (scrolledAway != _scrolledAway) {
      setState(() => _scrolledAway = scrolledAway);
    }
    return false;
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final colors = LtColors.of(context);
    final foreground = widget.barForeground ?? colors.ink;
    final subtitle = widget.subtitle;

    return Scaffold(
      body: NotificationListener<ScrollNotification>(
        onNotification: _onScroll,
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              pinned: true,
              backgroundColor: widget.barColor ?? colors.paper,
              foregroundColor: foreground,
              surfaceTintColor: Colors.transparent,
              scrolledUnderElevation: 0,
              // The back and action icons line up with the content's edges.
              leadingWidth: 64,
              leading: const Center(child: BackButton()),
              actionsPadding: const EdgeInsetsDirectional.only(end: 8),
              actions: widget.actions,
              centerTitle: true,
              titleTextStyle: text.titleSmall?.copyWith(color: foreground),
              title: AnimatedOpacity(
                opacity: _scrolledAway ? 1 : 0,
                duration: Motion.of(context, Motion.quick),
                child: Text(widget.title),
              ),
              shape: Border(
                bottom: BorderSide(
                  color: _scrolledAway
                      ? foreground.withValues(alpha: 0.12)
                      : Colors.transparent,
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: KeyedSubtree(
                key: _top,
                child:
                    widget.header ??
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Semantics(
                            header: true,
                            child: Text(
                              widget.title,
                              style: text.headlineLarge,
                            ),
                          ),
                          if (subtitle != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              subtitle,
                              style: text.bodyLarge?.copyWith(
                                color: colors.pencil,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
              ),
            ),
            ...widget.slivers,
            const SliverSafeArea(
              top: false,
              sliver: SliverToBoxAdapter(child: SizedBox(height: 24)),
            ),
          ],
        ),
      ),
    );
  }
}
