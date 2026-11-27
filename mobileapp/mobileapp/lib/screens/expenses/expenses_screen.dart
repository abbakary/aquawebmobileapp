import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../core/theme.dart';
import '../../core/formatters.dart';
import '../../models/models.dart';
import '../../providers/app_state.dart';
import '../../widgets/app_widgets.dart';
import '../dashboard/main_shell.dart';

// ─── Expense categories ───────────────────────────────────────────────────────
const _expenseCategories = [
  'Flake Ice & Insulated Crates',
  'Cold Storage Electricity / Generator',
  'Loading & Dock Handling Labor',
  'Mishahara & Posho (Staff Payroll)',
  'Fuel & Lubricants (Operations)',
  'Office & Administration',
  'Repairs & Maintenance (Non-Fleet)',
  'Packaging & Labelling',
  'Security & Insurance',
  'Other Operating Expense',
];

class ExpensesScreen extends ConsumerStatefulWidget {
  const ExpensesScreen({super.key});

  @override
  ConsumerState<ExpensesScreen> createState() => _ExpensesScreenState();
}

class _ExpensesScreenState extends ConsumerState<ExpensesScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final data = ref.watch(branchDataProvider);

    // ── P&L figures ───────────────────────────────────────────────────────────
    final revenue = data.sales.fold(0.0, (s, x) => s + x.total);
    final cogs    = data.sales.fold(0.0, (s, x) => s + x.cogs);
    final trCost  = data.trips.fold(0.0, (s, t) => s + t.cost);
    final opExps  = data.exps.fold(0.0, (s, e) => s + e.amt);
    final grossProfit = revenue - cogs;
    final netProfit   = grossProfit - trCost - opExps;

    return MainShell(
      selectedIndex: 4,
      child: Scaffold(
        backgroundColor: AppColors.grey50,
        appBar: AppBar(
          title: const Text('Expenses & Landed Cost'),
          bottom: TabBar(
            controller: _tabs,
            tabs: const [
              Tab(text: 'P&L Summary'),
              Tab(text: 'Expense Ledger'),
            ],
          ),
        ),
        body: TabBarView(
          controller: _tabs,
          children: [
            _PLSummaryTab(
              revenue: revenue,
              cogs: cogs,
              trCost: trCost,
              opExps: opExps,
              grossProfit: grossProfit,
              netProfit: netProfit,
            ),
            _ExpenseLedgerTab(
              data: data,
              opExps: opExps,
            ),
          ],
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => _showAddExpenseSheet(context),
          backgroundColor: const Color(0xFF7C3AED),
          icon: const Icon(Icons.add, color: Colors.white),
          label: const Text('Add Expense',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
        ),
      ),
    );
  }

  void _showAddExpenseSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _AddExpenseSheet(),
    );
  }
}

// ─── P&L Summary Tab ─────────────────────────────────────────────────────────
class _PLSummaryTab extends StatelessWidget {
  final double revenue, cogs, trCost, opExps, grossProfit, netProfit;

  const _PLSummaryTab({
    required this.revenue,
    required this.cogs,
    required this.trCost,
    required this.opExps,
    required this.grossProfit,
    required this.netProfit,
  });

  @override
  Widget build(BuildContext context) {
    final isProfit = netProfit >= 0;
    final grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0.0;
    final netMargin   = revenue > 0 ? (netProfit   / revenue) * 100 : 0.0;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      children: [
        // ── Net result card ───────────────────────────────────────────────
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: isProfit
                  ? const [Color(0xFF065F46), Color(0xFF10B981)]
                  : const [Color(0xFF7F1D1D), Color(0xFFDC2626)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(18),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(isProfit ? 'Net Profit' : 'Net Loss',
                  style: const TextStyle(
                      color: Colors.white70, fontSize: 12,
                      fontWeight: FontWeight.w500)),
              const SizedBox(height: 4),
              Text(AppFormatters.tzs(netProfit.abs()),
                  style: const TextStyle(
                      color: Colors.white, fontSize: 26,
                      fontWeight: FontWeight.w800)),
              Text('${netMargin.toStringAsFixed(1)}% net margin',
                  style: const TextStyle(color: Colors.white70, fontSize: 12)),
              const Divider(color: Colors.white24, height: 20),
              Row(
                children: [
                  _PLTopStat('Revenue',       AppFormatters.tzsShort(revenue)),
                  _PLTopStat('Gross Profit',  AppFormatters.tzsShort(grossProfit)),
                  _PLTopStat('Gross Margin',  '${grossMargin.toStringAsFixed(1)}%'),
                ],
              ),
            ],
          ),
        ).animate().fadeIn(),

        const SizedBox(height: 16),

        // ── Income statement card ─────────────────────────────────────────
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Income Statement', style: AppTextStyles.headlineSmall),
              const Divider(height: 20),
              _PLLine(label: 'Sales Revenue',           value: revenue,     isRevenue: true),
              _PLLine(label: '  Less: COGS (Fish Purchases)', value: cogs),
              const Divider(height: 10),
              _PLLine(label: 'Gross Profit',            value: grossProfit, bold: true),
              const Divider(height: 10),
              _PLLine(label: '  Cold Chain Transport',  value: trCost),
              _PLLine(label: '  Operating Expenses',    value: opExps),
              const Divider(height: 10),
              _PLLine(label: 'Net Profit / (Loss)',     value: netProfit,   bold: true,
                  color: netProfit >= 0 ? AppColors.success : AppColors.danger),
            ],
          ),
        ).animate().fadeIn(delay: 100.ms),

        const SizedBox(height: 16),

        // ── Cost structure donut ──────────────────────────────────────────
        if (cogs + trCost + opExps > 0) ...[
          Text('Cost Structure', style: AppTextStyles.headlineSmall),
          const SizedBox(height: 10),
          AppCard(
            child: SizedBox(
              height: 200,
              child: _CostDonut(cogs: cogs, trCost: trCost, opExps: opExps),
            ),
          ).animate().fadeIn(delay: 200.ms),
        ],
      ],
    );
  }
}

class _PLTopStat extends StatelessWidget {
  final String label;
  final String value;
  const _PLTopStat(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(value,
              style: const TextStyle(
                  color: Colors.white, fontSize: 13,
                  fontWeight: FontWeight.w700),
              overflow: TextOverflow.ellipsis),
          Text(label,
              style: const TextStyle(color: Colors.white60, fontSize: 10)),
        ],
      ),
    );
  }
}

class _PLLine extends StatelessWidget {
  final String label;
  final double value;
  final bool isRevenue;
  final bool bold;
  final Color? color;

  const _PLLine({
    required this.label,
    required this.value,
    this.isRevenue = false,
    this.bold = false,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final displayColor = color ??
        (isRevenue
            ? AppColors.success
            : bold
                ? AppColors.grey900
                : AppColors.grey600);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: bold ? 14 : 13,
                fontWeight: bold ? FontWeight.w700 : FontWeight.w400,
                color: bold ? AppColors.grey900 : AppColors.grey600,
              ),
            ),
          ),
          Text(
            isRevenue
                ? '+${AppFormatters.tzs(value)}'
                : !bold && value > 0
                    ? '(${AppFormatters.tzs(value)})'
                    : AppFormatters.tzs(value.abs()),
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

class _CostDonut extends StatelessWidget {
  final double cogs, trCost, opExps;
  const _CostDonut({required this.cogs, required this.trCost, required this.opExps});

  @override
  Widget build(BuildContext context) {
    final total = cogs + trCost + opExps;
    return Row(
      children: [
        Expanded(
          child: PieChart(PieChartData(
            sections: [
              PieChartSectionData(
                value: cogs,
                title: '${(cogs / total * 100).toStringAsFixed(0)}%',
                color: AppColors.primary,
                radius: 68,
                titleStyle: const TextStyle(
                    color: Colors.white, fontSize: 11,
                    fontWeight: FontWeight.w700),
              ),
              PieChartSectionData(
                value: trCost,
                title: '${(trCost / total * 100).toStringAsFixed(0)}%',
                color: AppColors.warning,
                radius: 68,
                titleStyle: const TextStyle(
                    color: Colors.white, fontSize: 11,
                    fontWeight: FontWeight.w700),
              ),
              PieChartSectionData(
                value: opExps,
                title: '${(opExps / total * 100).toStringAsFixed(0)}%',
                color: AppColors.success,
                radius: 68,
                titleStyle: const TextStyle(
                    color: Colors.white, fontSize: 11,
                    fontWeight: FontWeight.w700),
              ),
            ],
            centerSpaceRadius: 28,
            sectionsSpace: 2,
          )),
        ),
        const SizedBox(width: 16),
        Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _DonutLegend(color: AppColors.primary,
                label: 'Fish COGS', value: AppFormatters.tzsShort(cogs)),
            const SizedBox(height: 8),
            _DonutLegend(color: AppColors.warning,
                label: 'Transport', value: AppFormatters.tzsShort(trCost)),
            const SizedBox(height: 8),
            _DonutLegend(color: AppColors.success,
                label: 'Operating', value: AppFormatters.tzsShort(opExps)),
          ],
        ),
      ],
    );
  }
}

class _DonutLegend extends StatelessWidget {
  final Color color;
  final String label, value;
  const _DonutLegend({required this.color, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(width: 12, height: 12,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 6),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: AppTextStyles.caption),
          Text(value,
              style: AppTextStyles.bodySmall
                  .copyWith(fontWeight: FontWeight.w600)),
        ]),
      ],
    );
  }
}

// ─── Expense Ledger Tab ───────────────────────────────────────────────────────
class _ExpenseLedgerTab extends StatefulWidget {
  final BranchData data;
  final double opExps;
  const _ExpenseLedgerTab({required this.data, required this.opExps});

  @override
  State<_ExpenseLedgerTab> createState() => _ExpenseLedgerTabState();
}

class _ExpenseLedgerTabState extends State<_ExpenseLedgerTab> {
  String _cat = 'All';

  @override
  Widget build(BuildContext context) {
    // Build category list from data
    final cats = <String>{'All'};
    for (final e in widget.data.exps) {
      cats.add(e.cat);
    }

    final filtered = widget.data.exps.reversed.where((e) {
      return _cat == 'All' || e.cat == _cat;
    }).toList();

    // Group by category for totals
    final byCategory = <String, double>{};
    for (final e in widget.data.exps) {
      byCategory[e.cat] = (byCategory[e.cat] ?? 0) + e.amt;
    }

    return Column(
      children: [
        // Total + category filter
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Total Operating Expenses',
                      style: AppTextStyles.bodyMedium),
                  Text(AppFormatters.tzs(widget.opExps),
                      style: AppTextStyles.moneyMedium
                          .copyWith(color: AppColors.danger)),
                ],
              ),
              const SizedBox(height: 8),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: cats.map((c) {
                    final isSelected = _cat == c;
                    final label = c == 'All' ? 'All' : c.split(' ').take(2).join(' ');
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        label: Text(label),
                        selected: isSelected,
                        onSelected: (_) => setState(() => _cat = c),
                        selectedColor: AppColors.primarySurface,
                        checkmarkColor: AppColors.primary,
                        labelStyle: TextStyle(
                          color: isSelected ? AppColors.primary : AppColors.grey600,
                          fontSize: 12,
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ),
        const Divider(height: 1),

        // Category totals row
        if (_cat == 'All' && byCategory.isNotEmpty)
          Container(
            height: 76,
            color: AppColors.grey50,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              children: byCategory.entries.map((e) => Container(
                margin: const EdgeInsets.only(right: 8),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.grey200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      e.key.split(' ').take(3).join(' '),
                      style: AppTextStyles.caption,
                    ),
                    Text(
                      AppFormatters.tzsShort(e.value),
                      style: AppTextStyles.titleMedium
                          .copyWith(color: AppColors.danger),
                    ),
                  ],
                ),
              )).toList(),
            ),
          ),

        // Expense list
        Expanded(
          child: filtered.isEmpty
              ? EmptyState(
                  icon: Icons.receipt_long_outlined,
                  title: 'No Expenses',
                  subtitle: 'Tap the button to log an operating expense',
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(12),
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (_, i) => _ExpenseCard(expense: filtered[i])
                      .animate()
                      .fadeIn(delay: (i * 30).ms),
                ),
        ),
      ],
    );
  }
}

class _ExpenseCard extends StatelessWidget {
  final Expense expense;
  const _ExpenseCard({required this.expense});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          Container(
            width: 42, height: 42,
            decoration: BoxDecoration(
              color: AppColors.dangerLight,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.receipt_rounded,
                color: AppColors.danger, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(expense.cat, style: AppTextStyles.titleMedium),
                if (expense.desc.isNotEmpty)
                  Text(expense.desc,
                      style: AppTextStyles.bodySmall,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis),
                Text(AppFormatters.dateStr(expense.date),
                    style: AppTextStyles.caption),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            AppFormatters.tzs(expense.amt),
            style: AppTextStyles.titleLarge.copyWith(color: AppColors.danger),
          ),
        ],
      ),
    );
  }
}

// ─── Add Expense Sheet ────────────────────────────────────────────────────────
class _AddExpenseSheet extends ConsumerStatefulWidget {
  @override
  ConsumerState<_AddExpenseSheet> createState() => _AddExpenseSheetState();
}

class _AddExpenseSheetState extends ConsumerState<_AddExpenseSheet> {
  String _cat = _expenseCategories[0];
  final _amtCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _amtCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final amt = double.tryParse(_amtCtrl.text) ?? 0;

    return Padding(
      padding:
          EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.all(20),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const BottomSheetHeader(
                title: 'Log Operating Expense',
                subtitle: 'Record a daily station overhead or cost',
              ),
              const SizedBox(height: 16),

              FieldWrapper(
                label: 'Expense Category',
                child: DropdownButtonFormField<String>(
                  value: _cat,
                  onChanged: (v) => setState(() => _cat = v!),
                  items: _expenseCategories
                      .map((c) => DropdownMenuItem(
                          value: c,
                          child: Text(c,
                              style: AppTextStyles.bodyMedium,
                              overflow: TextOverflow.ellipsis)))
                      .toList(),
                  decoration: const InputDecoration(),
                  isExpanded: true,
                ),
              ),
              const SizedBox(height: 12),

              FieldWrapper(
                label: 'Amount (TZS)',
                child: TextField(
                  controller: _amtCtrl,
                  keyboardType: TextInputType.number,
                  style: AppTextStyles.headlineSmall,
                  decoration: const InputDecoration(hintText: '0'),
                  onChanged: (_) => setState(() {}),
                ),
              ),
              const SizedBox(height: 12),

              FieldWrapper(
                label: 'Description (optional)',
                child: TextField(
                  controller: _descCtrl,
                  maxLines: 2,
                  decoration: const InputDecoration(
                      hintText: 'e.g. 50 bags food-grade crushed ice for landing site'),
                ),
              ),
              const SizedBox(height: 20),

              PrimaryButton(
                label: 'Save Expense',
                icon: Icons.save_rounded,
                isLoading: _saving,
                onPressed: amt > 0
                    ? () async {
                        setState(() => _saving = true);
                        await ref.read(branchDataProvider.notifier).addExpense(
                          Expense(
                            cat: _cat,
                            amt: amt,
                            date: today(),
                            desc: _descCtrl.text.trim(),
                          ),
                        );
                        setState(() => _saving = false);
                        if (context.mounted) Navigator.pop(context);
                      }
                    : null,
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }
}

