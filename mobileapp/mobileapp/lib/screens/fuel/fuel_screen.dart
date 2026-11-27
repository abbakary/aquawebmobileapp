import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme.dart';
import '../../core/constants.dart';
import '../../core/formatters.dart';
import '../../models/models.dart';
import '../../providers/app_state.dart';
import '../../widgets/app_widgets.dart';
import '../dashboard/main_shell.dart';

class FuelScreen extends ConsumerStatefulWidget {
  const FuelScreen({super.key});

  @override
  ConsumerState<FuelScreen> createState() => _FuelScreenState();
}

class _FuelScreenState extends ConsumerState<FuelScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;

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
    final totalFuelDebt = data.suppliers
        .fold(0.0, (sum, s) => sum + supplierFuelDebt(data, s.id));

    return MainShell(
      selectedIndex: 4,
      child: Scaffold(
        backgroundColor: AppColors.grey50,
        appBar: AppBar(
          title: const Text('Fuel & Fisherman Credit'),
          bottom: TabBar(
            controller: _tabs,
            isScrollable: true,
            tabs: const [
              Tab(text: 'Issue Fuel'),
              Tab(text: 'Fisherman Accounts'),
              Tab(text: 'Fuel Stock & Tanks'),
            ],
          ),
        ),
        body: TabBarView(
          controller: _tabs,
          children: [
            _IssueFuelTab(data: data),
            _FishermanAccountsTab(data: data, totalDebt: totalFuelDebt),
            _FuelTanksTab(data: data),
          ],
        ),
        floatingActionButton: TabBuilder(
          tab: _tabs,
          builder: (i) => i == 0
              ? FloatingActionButton.extended(
                  onPressed: () => _showIssueFuelSheet(context),
                  backgroundColor: AppColors.warning,
                  icon: const Icon(Icons.local_gas_station, color: Colors.white),
                  label: const Text('Issue Fuel',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                )
              : const SizedBox.shrink(),
        ),
      ),
    );
  }

  void _showIssueFuelSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _IssueFuelSheet(),
    );
  }
}

// Helper widget to listen to tab changes
class TabBuilder extends StatefulWidget {
  final TabController tab;
  final Widget Function(int) builder;
  const TabBuilder({super.key, required this.tab, required this.builder});

  @override
  State<TabBuilder> createState() => _TabBuilderState();
}

class _TabBuilderState extends State<TabBuilder> {
  @override
  void initState() {
    super.initState();
    widget.tab.addListener(() => setState(() {}));
  }

  @override
  Widget build(BuildContext context) => widget.builder(widget.tab.index);
}

// ─── Issue Fuel Tab ───────────────────────────────────────────────────────────
class _IssueFuelTab extends StatelessWidget {
  final BranchData data;
  const _IssueFuelTab({required this.data});

  @override
  Widget build(BuildContext context) {
    final issues = data.fuelIssues;
    final totalIssued = issues.fold(0.0, (s, i) => s + i.total);
    final totalBalance = issues.fold(0.0, (s, i) => s + i.balance);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Stats
        Row(
          children: [
            Expanded(
              child: _FuelStatCard(
                icon: Icons.local_gas_station,
                label: 'Total Issued Value',
                value: AppFormatters.tzsShort(totalIssued),
                color: AppColors.warning,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _FuelStatCard(
                icon: Icons.account_balance_wallet_outlined,
                label: 'Outstanding Debt',
                value: AppFormatters.tzsShort(totalBalance),
                color: AppColors.danger,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        Text('Recent Fuel Issues', style: AppTextStyles.headlineSmall),
        const SizedBox(height: 10),

        if (issues.isEmpty)
          const EmptyState(
            icon: Icons.local_gas_station_outlined,
            title: 'No Fuel Issues',
            subtitle: 'Issue fuel to fishermen using the button below',
          )
        else
          ...issues.asMap().entries.map((e) {
            final issue = e.value;
            final sup = data.suppliers.firstWhere(
              (s) => s.id == issue.supId,
              orElse: () => Supplier(no: '', name: '—', phone: '', site: '', cat: ''),
            );
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _FuelIssueCard(issue: issue, supplier: sup)
                  .animate()
                  .fadeIn(delay: (e.key * 40).ms),
            );
          }),
      ],
    );
  }
}

// ─── Issue Fuel Sheet (3-step) ────────────────────────────────────────────────
class _IssueFuelSheet extends ConsumerStatefulWidget {
  const _IssueFuelSheet();

  @override
  ConsumerState<_IssueFuelSheet> createState() => _IssueFuelSheetState();
}

class _IssueFuelSheetState extends ConsumerState<_IssueFuelSheet> {
  int _step = 0;
  String? _supId;
  String? _boatId;
  String? _tankId;
  String _fuel = 'Petrol';
  double _litres = 100;
  double _price = 3200;
  String _arrangement = 'Partial';
  double _paid = 0;

  @override
  Widget build(BuildContext context) {
    final data = ref.watch(branchDataProvider);
    if (_supId == null && data.suppliers.isNotEmpty) _supId = data.suppliers.first.id;
    if (_tankId == null && data.fuelTanks.isNotEmpty) _tankId = data.fuelTanks.first.id;

    final sup = _supId != null ? data.suppliers.firstWhere((s) => s.id == _supId) : null;
    final total = _litres * _price;
    final outstanding = total - _paid;

    return DraggableScrollableSheet(
      initialChildSize: 0.88,
      maxChildSize: 0.95,
      builder: (_, scrollCtrl) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SingleChildScrollView(
          controller: scrollCtrl,
          padding: EdgeInsets.only(
            left: 20, right: 20, top: 12,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              BottomSheetHeader(title: 'Issue Fuel (Daily)', subtitle: 'Manage fuel supply to fishermen'),
              const SizedBox(height: 16),

              StepProgressBar(
                steps: const ['Details', 'Payment', 'Receipt'],
                currentStep: _step,
              ),
              const SizedBox(height: 20),

              // Step 0: Details
              if (_step == 0) ...[
                FieldWrapper(
                  label: 'Fisherman',
                  child: DropdownButtonFormField<String>(
                    value: _supId,
                    onChanged: (v) => setState(() {
                      _supId = v;
                      // Auto-link boat
                      final s = data.suppliers.firstWhere((s) => s.id == v);
                      _boatId = s.boatId;
                    }),
                    items: data.suppliers.map((s) => DropdownMenuItem(
                      value: s.id,
                      child: Text('${s.name} (${s.no})', style: AppTextStyles.bodyMedium, overflow: TextOverflow.ellipsis),
                    )).toList(),
                    decoration: const InputDecoration(),
                  ),
                ),
                const SizedBox(height: 10),

                if (sup != null)
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.grey50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.grey200),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.directions_boat_outlined, color: AppColors.primary, size: 16),
                        const SizedBox(width: 8),
                        Text('Boat: ${sup.boat} (${sup.boatReg})', style: AppTextStyles.bodyMedium),
                      ],
                    ),
                  ),

                const SizedBox(height: 10),

                FieldWrapper(
                  label: 'Fuel Type',
                  child: DropdownButtonFormField<String>(
                    value: _fuel,
                    onChanged: (v) => setState(() {
                      _fuel = v!;
                      final t = data.fuelTanks.firstWhere(
                        (t) => t.fuel == _fuel,
                        orElse: () => data.fuelTanks.first,
                      );
                      _tankId = t.id;
                      _price = t.sellPrice;
                    }),
                    items: ['Petrol', 'Diesel'].map((f) => DropdownMenuItem(value: f, child: Text(f, style: AppTextStyles.bodyMedium))).toList(),
                    decoration: const InputDecoration(),
                  ),
                ),
                const SizedBox(height: 10),

                Row(
                  children: [
                    Expanded(
                      child: FieldWrapper(
                        label: 'Quantity (Litres)',
                        child: TextFormField(
                          initialValue: _litres.toStringAsFixed(0),
                          keyboardType: TextInputType.number,
                          onChanged: (v) => setState(() => _litres = double.tryParse(v) ?? _litres),
                          decoration: const InputDecoration(suffixText: 'L'),
                          style: AppTextStyles.headlineSmall,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: FieldWrapper(
                        label: 'Price / Litre (TZS)',
                        child: TextFormField(
                          initialValue: _price.toStringAsFixed(0),
                          keyboardType: TextInputType.number,
                          onChanged: (v) => setState(() => _price = double.tryParse(v) ?? _price),
                          style: AppTextStyles.headlineSmall,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                AmountHighlightBox(
                  label: 'Total Amount',
                  amount: AppFormatters.tzs(total),
                ),

                const SizedBox(height: 20),

                Row(
                  children: [
                    OutlinedButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => setState(() => _step = 1),
                        icon: const Icon(Icons.arrow_forward, size: 18),
                        label: const Text('Next: Payment'),
                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.warning),
                      ),
                    ),
                  ],
                ),
              ],

              // Step 1: Payment
              if (_step == 1) ...[
                Text('Payment Details', style: AppTextStyles.headlineSmall),
                const SizedBox(height: 14),

                InfoRow(label: 'Total Amount', value: AppFormatters.tzs(total), highlight: true),
                const Divider(height: 16),

                FieldWrapper(
                  label: 'Amount Paid Now (TZS)',
                  child: TextFormField(
                    initialValue: '0',
                    keyboardType: TextInputType.number,
                    onChanged: (v) => setState(() {
                      final val = double.tryParse(v) ?? 0;
                      _paid = val.clamp(0, total);
                    }),
                    style: AppTextStyles.headlineSmall,
                    decoration: const InputDecoration(hintText: '0'),
                  ),
                ),
                const SizedBox(height: 4),
                Text('Outstanding (Auto): ${AppFormatters.tzs(outstanding)}',
                    style: AppTextStyles.bodySmall.copyWith(color: AppColors.grey500)),

                const SizedBox(height: 12),

                FieldWrapper(
                  label: 'Payment Arrangement',
                  child: Column(
                    children: FuelArrangements.all.map((a) => GestureDetector(
                      onTap: () => setState(() => _arrangement = a),
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 4),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          color: _arrangement == a ? AppColors.primarySurface : Colors.white,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: _arrangement == a ? AppColors.primary : AppColors.grey200,
                            width: _arrangement == a ? 1.5 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 18, height: 18,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: _arrangement == a ? AppColors.primary : AppColors.grey300,
                                  width: 2,
                                ),
                                color: _arrangement == a ? AppColors.primary : Colors.transparent,
                              ),
                              child: _arrangement == a
                                  ? const Icon(Icons.check, color: Colors.white, size: 10)
                                  : null,
                            ),
                            const SizedBox(width: 10),
                            Text(a, style: AppTextStyles.bodyMedium),
                          ],
                        ),
                      ),
                    )).toList(),
                  ),
                ),

                const SizedBox(height: 14),

                // What this will do
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.successLight,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.success.withAlpha(77)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('This will:', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                      const SizedBox(height: 6),
                      _WillDo(text: 'Deduct ${AppFormatters.litres(_litres)} from fuel stock'),
                      _WillDo(text: 'Add ${AppFormatters.tzs(total)} to ${sup?.name ?? "fisherman"} fuel account'),
                      if (_paid > 0) _WillDo(text: 'Record ${AppFormatters.tzs(_paid)} as payment received'),
                      if (outstanding > 0) _WillDo(text: 'Leave ${AppFormatters.tzs(outstanding)} outstanding'),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                Row(
                  children: [
                    OutlinedButton.icon(
                      onPressed: () => setState(() => _step = 0),
                      icon: const Icon(Icons.arrow_back, size: 18),
                      label: const Text('Back'),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () async {
                          await ref.read(branchDataProvider.notifier).issueFuel(
                            supId: _supId!,
                            boatId: _boatId ?? '',
                            boatReg: sup?.boatReg ?? '',
                            tankId: _tankId!,
                            fuel: _fuel,
                            litres: _litres,
                            price: _price,
                            arrangement: _arrangement,
                            paid: _paid,
                          );
                          setState(() => _step = 2);
                        },
                        icon: const Icon(Icons.check_circle_outline, size: 18),
                        label: const Text('Record Fuel Issue'),
                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.warning),
                      ),
                    ),
                  ],
                ),
              ],

              // Step 2: Receipt
              if (_step == 2) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.successLight,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.success.withAlpha(77)),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.check_circle, color: AppColors.success, size: 48),
                      const SizedBox(height: 8),
                      const Text('Fuel Issue Recorded!',
                          style: TextStyle(color: AppColors.success, fontSize: 18, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      Text('${AppFormatters.litres(_litres)} $_fuel issued to ${sup?.name ?? "fisherman"}',
                          style: AppTextStyles.bodyMedium),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                AppCard(
                  child: Column(
                    children: [
                      InfoRow(label: 'Fisherman', value: sup?.name ?? '—'),
                      const Divider(height: 14),
                      InfoRow(label: 'Boat', value: '${sup?.boat ?? '—'} (${sup?.boatReg ?? '—'})'),
                      const Divider(height: 14),
                      InfoRow(label: 'Fuel Type', value: _fuel),
                      const Divider(height: 14),
                      InfoRow(label: 'Quantity', value: AppFormatters.litres(_litres)),
                      const Divider(height: 14),
                      InfoRow(label: 'Price / Litre', value: AppFormatters.tzs(_price)),
                      const Divider(height: 14),
                      InfoRow(label: 'Total Amount', value: AppFormatters.tzs(total), highlight: true),
                      const Divider(height: 14),
                      InfoRow(label: 'Paid Now', value: AppFormatters.tzs(_paid)),
                      const Divider(height: 14),
                      InfoRow(
                        label: 'Outstanding Balance',
                        value: AppFormatters.tzs(total - _paid),
                        valueColor: total - _paid > 0 ? AppColors.danger : AppColors.success,
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {},
                        icon: const Icon(Icons.share, size: 16),
                        label: const Text('Share'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {},
                        icon: const Icon(Icons.print, size: 16),
                        label: const Text('Print'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.check, size: 16),
                        label: const Text('Done'),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _WillDo extends StatelessWidget {
  final String text;
  const _WillDo({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          const Icon(Icons.check, color: AppColors.success, size: 14),
          const SizedBox(width: 6),
          Expanded(child: Text(text, style: AppTextStyles.bodySmall)),
        ],
      ),
    );
  }
}

// ─── Fisherman Accounts Tab ───────────────────────────────────────────────────
class _FishermanAccountsTab extends StatelessWidget {
  final BranchData data;
  final double totalDebt;

  const _FishermanAccountsTab({required this.data, required this.totalDebt});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Total debt card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.warning.withAlpha(26),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.warning.withAlpha(77)),
          ),
          child: Row(
            children: [
              const Icon(Icons.account_balance_wallet_outlined, color: AppColors.warning, size: 28),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Total Outstanding Fuel Debt',
                      style: TextStyle(color: AppColors.grey600, fontSize: 12)),
                  Text(AppFormatters.tzs(totalDebt),
                      style: const TextStyle(
                          color: AppColors.warning, fontSize: 20, fontWeight: FontWeight.w800)),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        ...data.suppliers.asMap().entries.map((e) {
          final sup = e.value;
          final debt = supplierFuelDebt(data, sup.id);
          final issues = data.fuelIssues.where((f) => f.supId == sup.id).toList();
          final fishDelivered = data.batches
              .where((b) => b.sup == sup.id)
              .fold(0.0, (s, b) => s + b.kg);

          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      AvatarCircle(name: sup.name, size: 46),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(sup.name, style: AppTextStyles.headlineSmall),
                            Text('${sup.no} · ${sup.site}', style: AppTextStyles.caption),
                          ],
                        ),
                      ),
                      AppBadge(
                        label: sup.status,
                        variant: sup.status == 'Active' ? BadgeVariant.green : BadgeVariant.grey,
                      ),
                    ],
                  ),
                  const Divider(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          children: [
                            Text('Fuel Debt', style: AppTextStyles.caption),
                            Text(
                              AppFormatters.tzs(debt),
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: debt > 0 ? AppColors.danger : AppColors.success,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(width: 1, height: 36, color: AppColors.grey200),
                      Expanded(
                        child: Column(
                          children: [
                            Text('Fish Delivered', style: AppTextStyles.caption),
                            Text(AppFormatters.kgShort(fishDelivered),
                                style: AppTextStyles.titleLarge),
                          ],
                        ),
                      ),
                      Container(width: 1, height: 36, color: AppColors.grey200),
                      Expanded(
                        child: Column(
                          children: [
                            Text('Issues', style: AppTextStyles.caption),
                            Text('${issues.length}',
                                style: AppTextStyles.titleLarge),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (issues.isNotEmpty) ...[
                    const Divider(height: 14),
                    Text('Account Activity', style: AppTextStyles.titleMedium),
                    const SizedBox(height: 6),
                    ...issues.take(3).map((fi) => Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(AppFormatters.dateStr(fi.date), style: AppTextStyles.caption),
                          Text('Fuel Issue ${AppFormatters.litres(fi.litres)}',
                              style: AppTextStyles.caption),
                          Text(AppFormatters.tzs(fi.total),
                              style: AppTextStyles.caption.copyWith(
                                  color: AppColors.danger, fontWeight: FontWeight.w600)),
                          if (fi.balance > 0)
                            Text('—', style: AppTextStyles.caption)
                          else
                            Text(AppFormatters.tzs(fi.paid),
                                style: AppTextStyles.caption.copyWith(color: AppColors.success)),
                        ],
                      ),
                    )),
                    if (debt > 0) ...[
                      const SizedBox(height: 4),
                      Text('Balance (Outstanding): ${AppFormatters.tzs(debt)}',
                          style: AppTextStyles.bodySmall.copyWith(
                              color: AppColors.danger, fontWeight: FontWeight.w700)),
                    ],
                  ],
                ],
              ),
            ).animate().fadeIn(delay: (e.key * 60).ms),
          );
        }),
        const SizedBox(height: 80),
      ],
    );
  }
}

// ─── Fuel Tanks Tab ───────────────────────────────────────────────────────────
class _FuelTanksTab extends StatelessWidget {
  final BranchData data;
  const _FuelTanksTab({required this.data});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Stock Overview', style: AppTextStyles.headlineSmall),
        const SizedBox(height: 10),
        ...data.fuelTanks.asMap().entries.map((e) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: FuelTankGauge(
                name: e.value.name,
                fuelType: e.value.fuel,
                current: e.value.current,
                capacity: e.value.capacity,
              ).animate().fadeIn(delay: (e.key * 60).ms),
            )),
        const SizedBox(height: 16),

        Text('Recent Fuel Purchases', style: AppTextStyles.headlineSmall),
        const SizedBox(height: 10),
        ...data.fuelPurchases.asMap().entries.map((e) {
          final p = e.value;
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: AppCard(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: AppColors.warningLight,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.local_gas_station, color: AppColors.warning, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(p.no, style: AppTextStyles.titleMedium),
                        Text('${p.fuel} · ${AppFormatters.litres(p.litres)}',
                            style: AppTextStyles.bodySmall),
                        Text(AppFormatters.dateStr(p.date), style: AppTextStyles.caption),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(AppFormatters.tzs(p.total), style: AppTextStyles.titleLarge),
                      AppBadge(
                        label: p.status,
                        variant: p.status == 'Paid' ? BadgeVariant.green : BadgeVariant.amber,
                      ),
                    ],
                  ),
                ],
              ),
            ).animate().fadeIn(delay: (e.key * 40).ms),
          );
        }),
        const SizedBox(height: 80),
      ],
    );
  }
}

class _FuelStatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _FuelStatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withAlpha(26),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withAlpha(51)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 6),
          Text(value,
              style: TextStyle(
                  fontSize: 16, fontWeight: FontWeight.w800, color: color)),
          Text(label, style: AppTextStyles.caption),
        ],
      ),
    );
  }
}

class _FuelIssueCard extends StatelessWidget {
  final FuelIssue issue;
  final Supplier supplier;
  const _FuelIssueCard({required this.issue, required this.supplier});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(issue.no,
                      style: AppTextStyles.titleMedium.copyWith(color: AppColors.warning)),
                  Text('${supplier.name} · ${issue.boatReg}',
                      style: AppTextStyles.headlineSmall),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(AppFormatters.tzs(issue.total), style: AppTextStyles.moneyMedium),
                  AppBadge(
                    label: issue.arrangement,
                    variant: issue.arrangement == 'Cash' ? BadgeVariant.green : BadgeVariant.amber,
                  ),
                ],
              ),
            ],
          ),
          const Divider(height: 12),
          Row(
            children: [
              const Icon(Icons.local_gas_station, size: 14, color: AppColors.grey400),
              const SizedBox(width: 4),
              Text('${AppFormatters.litres(issue.litres)} ${issue.fuel} · TZS ${AppFormatters.num(issue.price)}/L',
                  style: AppTextStyles.bodySmall),
              const Spacer(),
              Text(AppFormatters.dateStr(issue.date), style: AppTextStyles.caption),
            ],
          ),
          if (issue.balance > 0) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(Icons.warning_amber, size: 14, color: AppColors.danger),
                const SizedBox(width: 4),
                Text('Outstanding: ${AppFormatters.tzs(issue.balance)}',
                    style: AppTextStyles.bodySmall.copyWith(color: AppColors.danger, fontWeight: FontWeight.w600)),
              ],
            ),
          ],
        ],
      ),
    );
  }
}






