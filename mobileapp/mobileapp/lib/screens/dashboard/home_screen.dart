import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../core/theme.dart';
import '../../core/formatters.dart';
import '../../models/models.dart';
import '../../providers/app_state.dart';
import '../../widgets/app_widgets.dart';
import 'main_shell.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider);
    final data = ref.watch(branchDataProvider);
    final totalKg = ref.watch(totalPurchasedKgProvider);
    final soldKg = ref.watch(totalSoldKgProvider);
    final stockKg = ref.watch(stockKgProvider);
    final grossProfit = ref.watch(grossProfitProvider);
    final totalRevenue = ref.watch(totalRevenueProvider);
    final pendingQC = ref.watch(pendingBatchesCountProvider);

    final hour = DateTime.now().hour;
    final greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    final greetingEmoji = hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙';

    return MainShell(
      selectedIndex: 0,
      child: Scaffold(
        backgroundColor: AppColors.grey50,
        body: CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: 0,
              floating: true,
              snap: true,
              backgroundColor: AppColors.primary,
              elevation: 0,
              title: Row(
                children: [
                  Container(
                    width: 32, height: 32,
                    decoration: BoxDecoration(
                      color: Colors.white.withAlpha(50),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Center(child: Text('🐟', style: TextStyle(fontSize: 16))),
                  ),
                  const SizedBox(width: 8),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('AquaCatch',
                          style: TextStyle(color: Colors.white, fontSize: 15,
                              fontWeight: FontWeight.w700, height: 1.1)),
                      Text('FishTrade ERP',
                          style: TextStyle(color: Colors.white60, fontSize: 10, height: 1)),
                    ],
                  ),
                ],
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.notifications_outlined, color: Colors.white),
                  onPressed: () {},
                ),
              ],
            ),

            SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header gradient section
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                    decoration: const BoxDecoration(gradient: AppColors.primaryGradient),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '$greeting, ${session?.name.split(' ')[0] ?? 'Manager'} $greetingEmoji',
                          style: const TextStyle(color: Colors.white, fontSize: 18,
                              fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 2),
                        const Text('Mwanza Fish Trading Co. Ltd',
                            style: TextStyle(color: Colors.white70, fontSize: 12)),
                        const SizedBox(height: 16),
                        const Text('This Month Overview',
                            style: TextStyle(color: Colors.white60, fontSize: 11,
                                fontWeight: FontWeight.w600)),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            _HeaderStat(icon: Icons.shopping_cart_outlined,
                                value: AppFormatters.kgShort(totalKg), label: 'Purchased'),
                            _HeaderStat(icon: Icons.storefront_outlined,
                                value: AppFormatters.kgShort(soldKg), label: 'Sold'),
                            _HeaderStat(icon: Icons.warehouse_outlined,
                                value: AppFormatters.kgShort(stockKg), label: 'In Stock'),
                            _HeaderStat(icon: Icons.trending_up_rounded,
                                value: AppFormatters.tzsShort(grossProfit), label: 'Gross Profit'),
                          ],
                        ),
                        const SizedBox(height: 20),
                      ],
                    ),
                  ),

                  Container(
                    height: 20,
                    color: AppColors.grey50,
                    child: Container(
                      decoration: const BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.vertical(bottom: Radius.circular(0)),
                      ),
                    ),
                  ),

                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 4),
                        SectionHeader(
                          title: 'Quick Actions',
                          actionLabel: 'View All',
                          onAction: () {},
                        ),
                        const SizedBox(height: 12),
                        GridView.count(
                          crossAxisCount: 3,
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          mainAxisSpacing: 10,
                          crossAxisSpacing: 10,
                          childAspectRatio: 1.05,
                          children: [
                            _QuickActionTile(icon: Icons.shopping_cart_rounded,
                                label: 'Fish\nProcurement', color: AppColors.primary,
                                onTap: () => context.go('/procurement')),
                            _QuickActionTile(icon: Icons.inventory_2_rounded,
                                label: 'Inventory\n& Batches', color: const Color(0xFF0E7490),
                                onTap: () => context.go('/inventory')),
                            _QuickActionTile(icon: Icons.storefront_rounded,
                                label: 'Industry\nSales', color: AppColors.success,
                                onTap: () => context.go('/sales')),
                            _QuickActionTile(icon: Icons.local_gas_station_rounded,
                                label: 'Fuel &\nCredit', color: AppColors.warning,
                                onTap: () => context.go('/fuel')),
                            _QuickActionTile(icon: Icons.build_rounded,
                                label: 'Fleet &\nMaintenance', color: const Color(0xFF7C3AED),
                                onTap: () => context.go('/maintenance')),
                            _QuickActionTile(icon: Icons.bar_chart_rounded,
                                label: 'Reports', color: const Color(0xFF0F766E),
                                onTap: () => context.go('/reports')),
                          ],
                        ).animate().fadeIn(duration: 400.ms),

                        const SizedBox(height: 20),

                        SectionHeader(
                          title: 'Purchases vs Sales (kg)',
                          actionLabel: 'See Report',
                          onAction: () => context.go('/reports'),
                        ),
                        const SizedBox(height: 12),
                        AppCard(
                          padding: const EdgeInsets.all(16),
                          child: SizedBox(
                            height: 180,
                            child: _PurchaseSalesChart(data: data),
                          ),
                        ).animate().fadeIn(delay: 200.ms),

                        const SizedBox(height: 20),

                        const SectionHeader(title: 'Business Performance'),
                        const SizedBox(height: 12),
                        Column(
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: StatCard(
                                    title: 'Total Purchased',
                                    value: AppFormatters.kgShort(totalKg),
                                    subtitle: '${data.batches.length} batches',
                                    icon: Icons.set_meal_rounded,
                                    iconColor: AppColors.primary,
                                    iconBg: AppColors.primarySurface,
                                    onTap: () => context.go('/procurement'),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: StatCard(
                                    title: 'Total Sold',
                                    value: AppFormatters.kgShort(soldKg),
                                    subtitle: '${data.sales.length} invoices',
                                    icon: Icons.storefront_rounded,
                                    iconColor: AppColors.success,
                                    iconBg: AppColors.successLight,
                                    onTap: () => context.go('/sales'),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Expanded(
                                  child: StatCard(
                                    title: 'Gross Profit',
                                    value: AppFormatters.tzsShort(grossProfit),
                                    subtitle: totalRevenue > 0
                                        ? '${((grossProfit / totalRevenue) * 100).toStringAsFixed(1)}% margin'
                                        : 'No sales yet',
                                    icon: Icons.trending_up_rounded,
                                    iconColor: AppColors.success,
                                    iconBg: AppColors.successLight,
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: StatCard(
                                    title: 'Pending QC',
                                    value: '$pendingQC batches',
                                    subtitle: 'Need inspection',
                                    icon: Icons.verified_rounded,
                                    iconColor: pendingQC > 0 ? AppColors.warning : AppColors.success,
                                    iconBg: pendingQC > 0 ? AppColors.warningLight : AppColors.successLight,
                                    onTap: () => context.go('/quality'),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),

                        const SizedBox(height: 20),

                        SectionHeader(
                          title: 'Recent Purchases',
                          actionLabel: 'View All',
                          onAction: () => context.go('/procurement'),
                        ),
                        const SizedBox(height: 10),
                        AppCard(
                          padding: EdgeInsets.zero,
                          child: Column(
                            children: () {
                              final batches = data.batches.reversed.take(4).toList();
                              return List.generate(batches.length, (i) {
                                final b = batches[i];
                                final supList = data.suppliers
                                    .where((s) => s.id == b.sup)
                                    .toList();
                                final supName = supList.isNotEmpty ? supList.first.name : '—';
                                return Column(
                                  children: [
                                    ItemListTile(
                                      leadingWidget: FishSpeciesIcon(species: b.sp, size: 42),
                                      title: '${b.sp} — Grade ${b.grade}',
                                      subtitle: '${b.no} · $supName\n${AppFormatters.kgShort(b.kg)} · ${AppFormatters.dateStr(b.date)}',
                                      badgeLabel: b.st == 'accepted' ? 'Accepted' : b.st == 'rejected' ? 'Rejected' : 'Pending QC',
                                      badgeVariant: b.st == 'accepted' ? BadgeVariant.green : b.st == 'rejected' ? BadgeVariant.red : BadgeVariant.amber,
                                      onTap: () => context.go('/procurement'),
                                    ),
                                    if (i < batches.length - 1) const Divider(height: 1),
                                  ],
                                );
                              });
                            }(),
                          ),
                        ).animate().fadeIn(delay: 300.ms),

                        const SizedBox(height: 20),

                        SectionHeader(
                          title: 'Fuel Stock',
                          actionLabel: 'Manage',
                          onAction: () => context.go('/fuel'),
                        ),
                        const SizedBox(height: 10),
                        Column(
                          children: data.fuelTanks.take(2).map((tank) => Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: FuelTankGauge(
                              name: tank.name,
                              fuelType: tank.fuel,
                              current: tank.current,
                              capacity: tank.capacity,
                            ),
                          )).toList(),
                        ).animate().fadeIn(delay: 400.ms),

                        const SizedBox(height: 80),
                      ],
                    ),
                  ),
                ],
              ).animate().fadeIn(duration: 300.ms),
            ),
          ],
        ),
      ),
    );
  }
}

class _HeaderStat extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  const _HeaderStat({required this.icon, required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, color: Colors.white70, size: 18),
          const SizedBox(height: 4),
          Text(value,
              style: const TextStyle(color: Colors.white, fontSize: 13,
                  fontWeight: FontWeight.w700)),
          Text(label,
              style: const TextStyle(color: Colors.white60, fontSize: 9),
              textAlign: TextAlign.center),
        ],
      ),
    );
  }
}

class _QuickActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _QuickActionTile({required this.icon, required this.label,
      required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: color.withAlpha(20),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withAlpha(38)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(
                color: color.withAlpha(38),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 8),
            Text(label,
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: color),
                textAlign: TextAlign.center, maxLines: 2,
                overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }
}

class _PurchaseSalesChart extends StatelessWidget {
  final BranchData data;
  const _PurchaseSalesChart({required this.data});

  @override
  Widget build(BuildContext context) {
    final weeks = List.generate(4, (i) {
      final weekStart = DateTime.now().subtract(Duration(days: (3 - i) * 7 + 6));
      final weekEnd = DateTime.now().subtract(Duration(days: (3 - i) * 7));
      double bought = 0, sold = 0;
      for (final b in data.batches) {
        final d = DateTime.tryParse(b.date) ?? DateTime.now();
        if (d.isAfter(weekStart) && d.isBefore(weekEnd.add(const Duration(days: 1)))) {
          bought += b.kg;
        }
      }
      for (final s in data.sales) {
        final d = DateTime.tryParse(s.date) ?? DateTime.now();
        if (d.isAfter(weekStart) && d.isBefore(weekEnd.add(const Duration(days: 1)))) {
          sold += s.kg;
        }
      }
      return {'w': 'W${i + 1}', 'bought': bought, 'sold': sold};
    });

    double maxY = 100;
    for (final w in weeks) {
      final b = (w['bought'] as double);
      final s = (w['sold'] as double);
      if (b > maxY) maxY = b;
      if (s > maxY) maxY = s;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            _LegendDot(color: AppColors.primary, label: 'Purchased'),
            const SizedBox(width: 16),
            _LegendDot(color: AppColors.success, label: 'Sold'),
          ],
        ),
        const SizedBox(height: 12),
        Expanded(
          child: BarChart(
            BarChartData(
              alignment: BarChartAlignment.spaceAround,
              maxY: maxY * 1.2,
              minY: 0,
              barTouchData: BarTouchData(
                touchTooltipData: BarTouchTooltipData(
                  getTooltipItem: (group, groupIndex, rod, rodIndex) {
                    final w = weeks[groupIndex];
                    final val = rodIndex == 0 ? w['bought'] as double : w['sold'] as double;
                    return BarTooltipItem(AppFormatters.kgShort(val),
                        const TextStyle(color: Colors.white, fontSize: 11));
                  },
                ),
              ),
              titlesData: FlTitlesData(
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    getTitlesWidget: (v, _) => Text(weeks[v.toInt()]['w'] as String,
                        style: AppTextStyles.caption),
                    reservedSize: 20,
                  ),
                ),
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 36,
                    getTitlesWidget: (v, _) =>
                        Text(AppFormatters.kgShort(v), style: AppTextStyles.caption),
                    interval: maxY / 4,
                  ),
                ),
                topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
              ),
              gridData: FlGridData(
                show: true,
                drawVerticalLine: false,
                getDrawingHorizontalLine: (_) => const FlLine(
                    color: AppColors.grey200, strokeWidth: 1, dashArray: [4, 4]),
              ),
              borderData: FlBorderData(show: false),
              barGroups: weeks.asMap().entries.map((e) {
                final w = e.value;
                return BarChartGroupData(
                  x: e.key,
                  barRods: [
                    BarChartRodData(
                      toY: ((w['bought'] as double) < 1 ? 1 : w['bought'] as double),
                      color: AppColors.primary,
                      width: 12,
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                    ),
                    BarChartRodData(
                      toY: ((w['sold'] as double) < 1 ? 1 : w['sold'] as double),
                      color: AppColors.success,
                      width: 12,
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                    ),
                  ],
                );
              }).toList(),
            ),
          ),
        ),
      ],
    );
  }
}

class _LegendDot extends StatelessWidget {
  final Color color;
  final String label;
  const _LegendDot({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 10, height: 10,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 4),
        Text(label, style: AppTextStyles.caption),
      ],
    );
  }
}


