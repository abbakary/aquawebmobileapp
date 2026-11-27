import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../core/theme.dart';
import '../../core/constants.dart';
import '../../core/formatters.dart';
import '../../models/models.dart';
import '../../providers/app_state.dart';
import '../../widgets/app_widgets.dart';
import '../dashboard/main_shell.dart';

class ReportsScreen extends ConsumerStatefulWidget {
  const ReportsScreen({super.key});

  @override
  ConsumerState<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends ConsumerState<ReportsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  String _period = 'This Month';

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final data = ref.watch(branchDataProvider);

    // Compute P&L figures
    final revenue = data.sales.fold(0.0, (s, x) => s + x.total);
    final cogs = data.sales.fold(0.0, (s, x) => s + x.cogs);
    final transportCost = data.trips.fold(0.0, (s, t) => s + t.cost);
    final opExps = data.exps.fold(0.0, (s, e) => s + e.amt);
    final fuelIssued = data.fuelIssues.fold(0.0, (s, f) => s + f.total);
    final grossProfit = revenue - cogs;
    final netProfit = revenue - cogs - transportCost - opExps;
    final grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0.0;
    final netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0.0;
    final totalPurchased = data.batches.fold(0.0, (s, b) => s + b.total);

    return MainShell(
      selectedIndex: 4,
      child: Scaffold(
        backgroundColor: AppColors.grey50,
        appBar: AppBar(
          title: const Text('Reports & Analytics'),
          actions: [
            PopupMenuButton<String>(
              initialValue: _period,
              onSelected: (v) => setState(() => _period = v),
              itemBuilder: (_) => ['This Month', 'Last 3 Months', 'Custom']
                  .map((p) => PopupMenuItem(value: p, child: Text(p)))
                  .toList(),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                child: Row(
                  children: [
                    Text(_period,
                        style: const TextStyle(color: Colors.white, fontSize: 13)),
                    const Icon(Icons.keyboard_arrow_down, color: Colors.white, size: 18),
                  ],
                ),
              ),
            ),
          ],
          bottom: TabBar(
            controller: _tabs,
            tabs: const [
              Tab(text: 'P&L Overview'),
              Tab(text: 'Business'),
              Tab(text: 'Species'),
            ],
          ),
        ),
        body: TabBarView(
          controller: _tabs,
          children: [
            // ── P&L Tab ──────────────────────────────────────────────────
            _PLTab(
              revenue: revenue,
              cogs: cogs,
              grossProfit: grossProfit,
              netProfit: netProfit,
              grossMargin: grossMargin,
              netMargin: netMargin,
              transportCost: transportCost,
              opExps: opExps,
              totalPurchased: totalPurchased,
              fuelIssued: fuelIssued,
            ),

            // ── Business Performance Tab ──────────────────────────────────
            _BusinessTab(data: data),

            // ── Species Breakdown Tab ─────────────────────────────────────
            _SpeciesTab(data: data),
          ],
        ),
      ),
    );
  }
}

// ─── P&L Tab ──────────────────────────────────────────────────────────────────
class _PLTab extends StatelessWidget {
  final double revenue, cogs, grossProfit, netProfit;
  final double grossMargin, netMargin;
  final double transportCost, opExps, totalPurchased, fuelIssued;

  const _PLTab({
    required this.revenue,
    required this.cogs,
    required this.grossProfit,
    required this.netProfit,
    required this.grossMargin,
    required this.netMargin,
    required this.transportCost,
    required this.opExps,
    required this.totalPurchased,
    required this.fuelIssued,
  });

  @override
  Widget build(BuildContext context) {
    final isProfit = netProfit >= 0;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Profit summary card
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: isProfit
                ? const LinearGradient(
                    colors: [Color(0xFF065F46), Color(0xFF10B981)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight)
                : const LinearGradient(
                    colors: [Color(0xFF7F1D1D), Color(0xFFDC2626)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(isProfit ? 'Net Profit' : 'Net Loss',
                  style: const TextStyle(color: Colors.white60, fontSize: 12)),
              const SizedBox(height: 6),
              Text(
                AppFormatters.tzs(netProfit.abs()),
                style: const TextStyle(
                    color: Colors.white, fontSize: 28, fontWeight: FontWeight.w800),
              ),
              Text('${netMargin.toStringAsFixed(1)}% of revenue',
                  style: const TextStyle(color: Colors.white70, fontSize: 12)),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _PLMiniStat(
                        label: 'Revenue', value: AppFormatters.tzsShort(revenue)),
                  ),
                  Expanded(
                    child: _PLMiniStat(
                        label: 'Gross Profit', value: AppFormatters.tzsShort(grossProfit)),
                  ),
                  Expanded(
                    child: _PLMiniStat(
                        label: 'Margin', value: '${grossMargin.toStringAsFixed(1)}%'),
                  ),
                ],
              ),
            ],
          ),
        ).animate().fadeIn(),

        const SizedBox(height: 16),

        // P&L breakdown
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Income Statement', style: AppTextStyles.headlineSmall),
              const Divider(height: 20),
              _PLRow(label: 'Sales Revenue', value: revenue, isRevenue: true),
              _PLRow(label: '  Less: Cost of Goods Sold (COGS)', value: cogs),
              const Divider(height: 12),
              _PLRow(label: 'Gross Profit', value: grossProfit, bold: true),
              const Divider(height: 12),
              _PLRow(label: '  Transport / Cold Chain', value: transportCost),
              _PLRow(label: '  Operating Expenses', value: opExps),
              const Divider(height: 12),
              _PLRow(label: 'Net Profit / (Loss)', value: netProfit, bold: true,
                  color: netProfit >= 0 ? AppColors.success : AppColors.danger),
            ],
          ),
        ).animate().fadeIn(delay: 100.ms),

        const SizedBox(height: 16),

        // Cost donut chart
        Text('Cost Structure', style: AppTextStyles.headlineSmall),
        const SizedBox(height: 10),
        AppCard(
          child: SizedBox(
            height: 200,
            child: _CostPieChart(
              cogs: cogs,
              transport: transportCost,
              opExps: opExps,
            ),
          ),
        ).animate().fadeIn(delay: 200.ms),

        const SizedBox(height: 80),
      ],
    );
  }
}

class _PLRow extends StatelessWidget {
  final String label;
  final double value;
  final bool isRevenue;
  final bool bold;
  final Color? color;

  const _PLRow({
    required this.label,
    required this.value,
    this.isRevenue = false,
    this.bold = false,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final displayColor = color ??
        (isRevenue ? AppColors.success : bold ? AppColors.grey900 : AppColors.grey600);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(label,
                style: TextStyle(
                  fontSize: bold ? 14 : 13,
                  fontWeight: bold ? FontWeight.w700 : FontWeight.w400,
                  color: bold ? AppColors.grey900 : AppColors.grey600,
                )),
          ),
          Text(
            '${isRevenue ? '+' : value > 0 && !bold ? '(' : ''}${AppFormatters.tzs(value.abs())}${!isRevenue && value > 0 && !bold ? ')' : ''}',
            style: TextStyle(
              fontSize: bold ? 14 : 13,
              fontWeight: bold ? FontWeight.w700 : FontWeight.w500,
              color: displayColor,
            ),
          ),
        ],
      ),
    );
  }
}

class _PLMiniStat extends StatelessWidget {
  final String label;
  final String value;
  const _PLMiniStat({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700)),
        Text(label, style: const TextStyle(color: Colors.white60, fontSize: 10)),
      ],
    );
  }
}

// ─── Business Performance Tab ─────────────────────────────────────────────────
class _BusinessTab extends StatelessWidget {
  final BranchData data;
  const _BusinessTab({required this.data});

  @override
  Widget build(BuildContext context) {
    final totalPurchasedKg = data.batches.fold(0.0, (s, b) => s + b.kg);
    final totalSoldKg = data.sales.fold(0.0, (s, x) => s + x.kg);
    final totalRevenue = data.sales.fold(0.0, (s, x) => s + x.total);
    final grossProfit = totalRevenue - data.sales.fold(0.0, (s, x) => s + x.cogs);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // KPI Grid
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 1.6,
          children: [
            _KpiCard(
              label: 'Total Purchased',
              value: AppFormatters.kgShort(totalPurchasedKg),
              icon: Icons.set_meal_rounded,
              color: AppColors.primary,
            ),
            _KpiCard(
              label: 'Total Sold',
              value: AppFormatters.kgShort(totalSoldKg),
              icon: Icons.storefront_rounded,
              color: AppColors.success,
            ),
            _KpiCard(
              label: 'Total Revenue',
              value: AppFormatters.tzsShort(totalRevenue),
              icon: Icons.trending_up_rounded,
              color: const Color(0xFF0E7490),
            ),
            _KpiCard(
              label: 'Gross Profit',
              value: AppFormatters.tzsShort(grossProfit),
              icon: Icons.savings_outlined,
              color: AppColors.warning,
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Weekly chart
        Text('Weekly Purchases vs Sales', style: AppTextStyles.headlineSmall),
        const SizedBox(height: 10),
        AppCard(
          child: SizedBox(
            height: 200,
            child: _WeeklyChart(data: data),
          ),
        ),
        const SizedBox(height: 80),
      ],
    );
  }
}

class _KpiCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _KpiCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withAlpha(51)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Icon(icon, color: color, size: 24),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: color)),
              Text(label, style: AppTextStyles.caption),
            ],
          ),
        ],
      ),
    );
  }
}

class _WeeklyChart extends StatelessWidget {
  final BranchData data;
  const _WeeklyChart({required this.data});

  @override
  Widget build(BuildContext context) {
    final weeks = List.generate(4, (i) {
      final start = DateTime.now().subtract(Duration(days: (3 - i) * 7 + 6));
      final end = DateTime.now().subtract(Duration(days: (3 - i) * 7));
      double bought = 0, sold = 0;
      for (final b in data.batches) {
        final d = DateTime.tryParse(b.date) ?? DateTime.now();
        if (d.isAfter(start) && d.isBefore(end.add(const Duration(days: 1)))) bought += b.kg;
      }
      for (final s in data.sales) {
        final d = DateTime.tryParse(s.date) ?? DateTime.now();
        if (d.isAfter(start) && d.isBefore(end.add(const Duration(days: 1)))) sold += s.kg;
      }
      return {'w': 'W${i + 1}', 'bought': bought.clamp(1.0, double.infinity), 'sold': sold.clamp(1.0, double.infinity)};
    });

    final maxY = weeks.fold<double>(100, (m, w) {
      final v = (w['bought'] as double) > (w['sold'] as double) ? w['bought'] as double : w['sold'] as double;
      return m > v ? m : v;
    });

    return BarChart(
      BarChartData(
        alignment: BarChartAlignment.spaceAround,
        maxY: maxY * 1.2,
        barTouchData: BarTouchData(enabled: true),
        titlesData: FlTitlesData(
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (v, _) => Text(weeks[v.toInt()]['w'] as String, style: AppTextStyles.caption),
              reservedSize: 20,
            ),
          ),
          leftTitles: AxisTitles(sideTitles: SideTitles(
            showTitles: true,
            reservedSize: 42,
            interval: maxY / 3,
            getTitlesWidget: (v, _) => Text(AppFormatters.kgShort(v), style: AppTextStyles.caption),
          )),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        gridData: FlGridData(
          drawVerticalLine: false,
          getDrawingHorizontalLine: (_) => FlLine(color: AppColors.grey200, strokeWidth: 1, dashArray: [4, 4]),
        ),
        borderData: FlBorderData(show: false),
        barGroups: weeks.asMap().entries.map((e) => BarChartGroupData(
          x: e.key,
          barRods: [
            BarChartRodData(toY: e.value['bought'] as double, color: AppColors.primary, width: 12, borderRadius: const BorderRadius.vertical(top: Radius.circular(4))),
            BarChartRodData(toY: e.value['sold'] as double, color: AppColors.success, width: 12, borderRadius: const BorderRadius.vertical(top: Radius.circular(4))),
          ],
        )).toList(),
      ),
    );
  }
}

// ─── Species Tab ──────────────────────────────────────────────────────────────
class _SpeciesTab extends StatelessWidget {
  final BranchData data;
  const _SpeciesTab({required this.data});

  @override
  Widget build(BuildContext context) {
    final speciesData = FishSpecies.all.map((sp) {
      final batches = data.batches.where((b) => b.sp == sp);
      final sales = data.sales.where((s) => s.sp == sp);
      final bKg = batches.fold(0.0, (s, b) => s + b.kg);
      final bCost = batches.fold(0.0, (s, b) => s + b.total);
      final sKg = sales.fold(0.0, (s, x) => s + x.kg);
      final sRev = sales.fold(0.0, (s, x) => s + x.total);
      final sCogs = sales.fold(0.0, (s, x) => s + x.cogs);
      final profit = sRev - (sCogs > 0 ? sCogs : bCost);
      final margin = sRev > 0 ? (profit / sRev) * 100 : 0.0;
      return {'sp': sp, 'bKg': bKg, 'sKg': sKg, 'sRev': sRev, 'profit': profit, 'margin': margin};
    }).where((r) => (r['bKg'] as double) > 0 || (r['sKg'] as double) > 0).toList();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        ...speciesData.asMap().entries.map((e) {
          final r = e.value;
          final sp = r['sp'] as String;
          final margin = r['margin'] as double;
          final profit = r['profit'] as double;

          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      FishSpeciesIcon(species: sp, size: 44),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(sp, style: AppTextStyles.headlineSmall),
                            Text('${AppFormatters.kgShort(r['bKg'] as double)} purchased · ${AppFormatters.kgShort(r['sKg'] as double)} sold',
                                style: AppTextStyles.bodySmall),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            AppFormatters.tzsShort(r['sRev'] as double),
                            style: AppTextStyles.moneyMedium,
                          ),
                          Text(
                            '${margin.toStringAsFixed(1)}% margin',
                            style: AppTextStyles.caption.copyWith(
                              color: margin > 20 ? AppColors.success : margin > 10 ? AppColors.warning : AppColors.danger,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const Divider(height: 14),
                  // Profit bar
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Profit', style: AppTextStyles.caption),
                                Text(
                                  AppFormatters.tzsShort(profit),
                                  style: AppTextStyles.caption.copyWith(
                                    color: profit >= 0 ? AppColors.success : AppColors.danger,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                value: margin > 0 ? (margin / 100).clamp(0, 1) : 0,
                                minHeight: 6,
                                backgroundColor: AppColors.grey100,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  margin > 20 ? AppColors.success : margin > 10 ? AppColors.warning : AppColors.danger,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ).animate().fadeIn(delay: (e.key * 80).ms),
          );
        }),
        const SizedBox(height: 80),
      ],
    );
  }
}

// ─── Cost Pie Chart ───────────────────────────────────────────────────────────
class _CostPieChart extends StatelessWidget {
  final double cogs;
  final double transport;
  final double opExps;

  const _CostPieChart({required this.cogs, required this.transport, required this.opExps});

  @override
  Widget build(BuildContext context) {
    final total = cogs + transport + opExps;
    if (total <= 0) {
      return const Center(child: Text('No cost data', style: TextStyle(color: AppColors.grey400)));
    }

    final sections = [
      PieChartSectionData(
        value: cogs,
        title: 'COGS\n${(cogs / total * 100).toStringAsFixed(0)}%',
        color: AppColors.primary,
        radius: 70,
        titleStyle: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600),
      ),
      PieChartSectionData(
        value: transport,
        title: 'Transport\n${(transport / total * 100).toStringAsFixed(0)}%',
        color: AppColors.warning,
        radius: 70,
        titleStyle: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600),
      ),
      PieChartSectionData(
        value: opExps,
        title: 'Opex\n${(opExps / total * 100).toStringAsFixed(0)}%',
        color: AppColors.success,
        radius: 70,
        titleStyle: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600),
      ),
    ];

    return Row(
      children: [
        Expanded(
          child: PieChart(
            PieChartData(
              sections: sections,
              centerSpaceRadius: 30,
              sectionsSpace: 2,
            ),
          ),
        ),
        const SizedBox(width: 16),
        Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _PieLegend(color: AppColors.primary, label: 'COGS', value: AppFormatters.tzsShort(cogs)),
            const SizedBox(height: 8),
            _PieLegend(color: AppColors.warning, label: 'Transport', value: AppFormatters.tzsShort(transport)),
            const SizedBox(height: 8),
            _PieLegend(color: AppColors.success, label: 'Operating', value: AppFormatters.tzsShort(opExps)),
          ],
        ),
      ],
    );
  }
}

class _PieLegend extends StatelessWidget {
  final Color color;
  final String label;
  final String value;
  const _PieLegend({required this.color, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(width: 12, height: 12, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 6),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: AppTextStyles.caption),
            Text(value, style: AppTextStyles.bodySmall.copyWith(fontWeight: FontWeight.w600)),
          ],
        ),
      ],
    );
  }
}



