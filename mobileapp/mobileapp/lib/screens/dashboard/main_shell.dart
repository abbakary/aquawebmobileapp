import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';
import '../../providers/app_state.dart';

class MainShell extends ConsumerWidget {
  final Widget child;
  final int selectedIndex;

  const MainShell({super.key, required this.child, required this.selectedIndex});

  static const _items = [
    _NavItem(icon: Icons.home_rounded,         label: 'Home',      route: '/home'),
    _NavItem(icon: Icons.shopping_cart_rounded, label: 'Purchase',  route: '/procurement'),
    _NavItem(icon: Icons.warehouse_rounded,     label: 'Inventory', route: '/inventory'),
    _NavItem(icon: Icons.storefront_rounded,    label: 'Sales',     route: '/sales'),
    _NavItem(icon: Icons.more_horiz_rounded,    label: 'More',      route: '__more'),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingQC = ref.watch(pendingBatchesCountProvider);

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: AppShadows.bottomBar,
          border: const Border(top: BorderSide(color: AppColors.grey200)),
        ),
        child: SafeArea(
          top: false,
          child: SizedBox(
            height: 64,
            child: Row(
              children: List.generate(_items.length, (i) {
                final item = _items[i];
                final isSelected = i == selectedIndex;
                return Expanded(
                  child: GestureDetector(
                    onTap: () {
                      if (item.route == '__more') {
                        _openMore(context, ref);
                      } else {
                        context.go(item.route);
                      }
                    },
                    behavior: HitTestBehavior.opaque,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Stack(
                          clipBehavior: Clip.none,
                          children: [
                            AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? AppColors.primarySurface
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(item.icon, size: 22,
                                  color: isSelected
                                      ? AppColors.primary
                                      : AppColors.grey400),
                            ),
                            // QC badge on Purchase tab
                            if (item.route == '/procurement' && pendingQC > 0)
                              Positioned(
                                top: -2, right: -2,
                                child: Container(
                                  width: 16, height: 16,
                                  decoration: const BoxDecoration(
                                      color: AppColors.danger,
                                      shape: BoxShape.circle),
                                  child: Center(
                                    child: Text(
                                      pendingQC > 9 ? '9+' : '$pendingQC',
                                      style: const TextStyle(
                                          color: Colors.white, fontSize: 9,
                                          fontWeight: FontWeight.w700),
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 3),
                        Text(item.label,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: isSelected
                                  ? FontWeight.w600
                                  : FontWeight.w400,
                              color: isSelected
                                  ? AppColors.primary
                                  : AppColors.grey400,
                            )),
                      ],
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }

  void _openMore(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _MoreDrawer(widgetRef: ref),
    );
  }
}

class _NavItem {
  final IconData icon;
  final String label;
  final String route;
  const _NavItem(
      {required this.icon, required this.label, required this.route});
}

// ─── More Drawer ──────────────────────────────────────────────────────────────
class _MoreDrawer extends StatelessWidget {
  final WidgetRef widgetRef;
  const _MoreDrawer({required this.widgetRef});

  // All non-bottom-bar modules grouped into rows
  static const _groups = [
    _DrawerGroup(label: 'Operations', items: [
      _DrawerItem(icon: Icons.people_rounded,         label: 'Suppliers',    route: '/suppliers',   color: AppColors.primary),
      _DrawerItem(icon: Icons.verified_rounded,       label: 'Quality',      route: '/quality',     color: AppColors.success),
      _DrawerItem(icon: Icons.local_shipping_rounded, label: 'Transport',    route: '/transport',   color: Color(0xFF1D4ED8)),
    ]),
    _DrawerGroup(label: 'Finance', items: [
      _DrawerItem(icon: Icons.payments_rounded,           label: 'Payments',    route: '/payments',    color: Color(0xFF0E7490)),
      _DrawerItem(icon: Icons.local_gas_station_rounded,  label: 'Fuel',        route: '/fuel',        color: AppColors.warning),
      _DrawerItem(icon: Icons.receipt_long_rounded,       label: 'Expenses',    route: '/expenses',    color: Color(0xFF7C3AED)),
    ]),
    _DrawerGroup(label: 'Management', items: [
      _DrawerItem(icon: Icons.build_rounded,         label: 'Maintenance',  route: '/maintenance', color: Color(0xFF92400E)),
      _DrawerItem(icon: Icons.badge_rounded,         label: 'Staff',        route: '/staff',       color: Color(0xFF6D28D9)),
      _DrawerItem(icon: Icons.bar_chart_rounded,     label: 'Reports',      route: '/reports',     color: Color(0xFF0F766E)),
    ]),
    _DrawerGroup(label: 'Governance', items: [
      _DrawerItem(icon: Icons.description_rounded,   label: 'Compliance',   route: '/compliance',  color: AppColors.danger),
    ]),
  ];

  @override
  Widget build(BuildContext context) {
    final session = widgetRef.watch(sessionProvider);

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Container(
            width: 36, height: 4,
            decoration: BoxDecoration(
                color: AppColors.grey300,
                borderRadius: BorderRadius.circular(2)),
          ),
          const SizedBox(height: 16),

          // Company header card
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                Container(
                  width: 44, height: 44,
                  decoration: BoxDecoration(
                    color: Colors.white.withAlpha(40),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Center(
                      child: Text('🐟', style: TextStyle(fontSize: 22))),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Mwanza Fish Trading Co. Ltd',
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.w700)),
                      Text(session?.name ?? 'Manager',
                          style: const TextStyle(
                              color: Colors.white70, fontSize: 11),
                          overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withAlpha(40),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    session?.role ?? '',
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Grouped module tiles
          ..._groups.map((group) => Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Text(
                      group.label.toUpperCase(),
                      style: AppTextStyles.labelSmall.copyWith(
                          color: AppColors.grey400, letterSpacing: 1),
                    ),
                  ),
                  GridView.count(
                    crossAxisCount: 3,
                    shrinkWrap: true,
                    mainAxisSpacing: 8,
                    crossAxisSpacing: 8,
                    childAspectRatio: 1.15,
                    physics: const NeverScrollableScrollPhysics(),
                    children: group.items
                        .map((item) => _DrawerGridTile(item: item))
                        .toList(),
                  ),
                  const SizedBox(height: 12),
                ],
              )),

          const Divider(height: 8),

          // Logout
          ListTile(
            onTap: () async {
              Navigator.pop(context);
              await widgetRef.read(sessionProvider.notifier).logout();
              if (context.mounted) context.go('/landing');
            },
            leading: Container(
              width: 36, height: 36,
              decoration: BoxDecoration(
                  color: AppColors.dangerLight,
                  borderRadius: BorderRadius.circular(8)),
              child: const Icon(Icons.logout_rounded,
                  color: AppColors.danger, size: 18),
            ),
            title: const Text('Logout',
                style: TextStyle(
                    color: AppColors.danger,
                    fontWeight: FontWeight.w600)),
            contentPadding: EdgeInsets.zero,
            minLeadingWidth: 0,
          ),
        ],
      ),
    );
  }
}

class _DrawerGroup {
  final String label;
  final List<_DrawerItem> items;
  const _DrawerGroup({required this.label, required this.items});
}

class _DrawerItem {
  final IconData icon;
  final String label;
  final String route;
  final Color color;
  const _DrawerItem({
    required this.icon,
    required this.label,
    required this.route,
    required this.color,
  });
}

class _DrawerGridTile extends StatelessWidget {
  final _DrawerItem item;
  const _DrawerGridTile({required this.item});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.pop(context);
        context.go(item.route);
      },
      child: Container(
        decoration: BoxDecoration(
          color: item.color.withAlpha(15),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: item.color.withAlpha(38)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(item.icon, color: item.color, size: 24),
            const SizedBox(height: 5),
            Text(
              item.label,
              style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: item.color),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

