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

class ProcurementScreen extends ConsumerStatefulWidget {
  const ProcurementScreen({super.key});

  @override
  ConsumerState<ProcurementScreen> createState() => _ProcurementScreenState();
}

class _ProcurementScreenState extends ConsumerState<ProcurementScreen> {
  String _search = '';
  String _filterSp = 'All';
  final _searchCtrl = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final data = ref.watch(branchDataProvider);

    final filtered = data.batches.reversed.toList().where((b) {
      final supList = data.suppliers.where((s) => s.id == b.sup).toList();
      final supName = supList.isNotEmpty ? supList.first.name : '';
      final matchSearch = _search.isEmpty ||
          b.no.toLowerCase().contains(_search) ||
          b.pur.toLowerCase().contains(_search) ||
          b.sp.toLowerCase().contains(_search) ||
          supName.toLowerCase().contains(_search);
      final matchSp = _filterSp == 'All' || b.sp == _filterSp;
      return matchSearch && matchSp;
    }).toList();

    return MainShell(
      selectedIndex: 1,
      child: Scaffold(
        backgroundColor: AppColors.grey50,
        appBar: AppBar(
          title: const Text('Fish Procurement'),
          actions: [
            IconButton(
              icon: const Icon(Icons.add_circle_outline),
              onPressed: () => _showBuyWizard(context),
            ),
          ],
        ),
        body: Column(
          children: [
            // Summary banner
            Container(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              color: Colors.white,
              child: Row(
                children: [
                  Expanded(
                    child: _SummaryChip(
                      label: 'Total Purchased',
                      value: AppFormatters.kgShort(
                          data.batches.fold(0.0, (s, b) => s + b.kg)),
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _SummaryChip(
                      label: 'Pending QC',
                      value: '${data.batches.where((b) => b.st == "pending").length} batches',
                      color: AppColors.warning,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _SummaryChip(
                      label: 'In Stock',
                      value: AppFormatters.kgShort(data.batches
                          .where((b) => b.st == "accepted")
                          .fold(0.0, (s, b) => s + b.rem)),
                      color: AppColors.success,
                    ),
                  ),
                ],
              ),
            ),

            // Search + filters
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
              child: Column(
                children: [
                  AppSearchBar(
                    hint: 'Search batches...',
                    controller: _searchCtrl,
                    onChanged: (v) => setState(() => _search = v.toLowerCase()),
                  ),
                  const SizedBox(height: 10),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: ['All', ...FishSpecies.all]
                          .map((sp) => Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: FilterChip(
                                  label: Text(sp == 'All' ? 'All' : sp.split(' ')[0]),
                                  selected: _filterSp == sp,
                                  onSelected: (_) => setState(() => _filterSp = sp),
                                  selectedColor: AppColors.primarySurface,
                                  checkmarkColor: AppColors.primary,
                                  labelStyle: TextStyle(
                                    color: _filterSp == sp ? AppColors.primary : AppColors.grey600,
                                    fontSize: 12,
                                    fontWeight: _filterSp == sp ? FontWeight.w600 : FontWeight.w400,
                                  ),
                                ),
                              ))
                          .toList(),
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),

            // Batch list
            Expanded(
              child: filtered.isEmpty
                  ? EmptyState(
                      icon: Icons.set_meal_outlined,
                      title: 'No Batches Found',
                      subtitle: 'Record your first fish purchase',
                      actionLabel: 'Record Purchase',
                      onAction: () => _showBuyWizard(context),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: filtered.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (_, i) => _BatchCard(
                        batch: filtered[i],
                        supplier: () {
                          final list = data.suppliers.where((s) => s.id == filtered[i].sup).toList();
                          return list.isNotEmpty ? list.first : Supplier(no: '', name: 'Unknown', phone: '', site: '', cat: '');
                        }(),
                      ).animate().fadeIn(delay: (i * 40).ms),
                    ),
            ),
          ],
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => _showBuyWizard(context),
          backgroundColor: AppColors.primary,
          icon: const Icon(Icons.add, color: Colors.white),
          label: const Text('New Purchase', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
        ),
      ),
    );
  }

  void _showBuyWizard(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _BuyWizard(),
    );
  }
}

// ─── Buy Wizard (3-step) ─────────────────────────────────────────────────────
class _BuyWizard extends ConsumerStatefulWidget {
  const _BuyWizard();

  @override
  ConsumerState<_BuyWizard> createState() => _BuyWizardState();
}

class _BuyWizardState extends ConsumerState<_BuyWizard> {
  int _step = 0;

  // Form data
  String? _supId;
  String _sp = FishSpecies.all[0];
  String _grade = 'A';
  double _kg = 350;
  double _price = 8000;
  String _method = 'M-Pesa (Mobile Money)';
  bool _deductFuel = true;
  String _site = LandingSites.all[0];

  // Scale simulation
  double _scaleReading = 350.0;

  @override
  Widget build(BuildContext context) {
    final data = ref.watch(branchDataProvider);
    if (_supId == null && data.suppliers.isNotEmpty) {
      _supId = data.suppliers.first.id;
    }

    final sup = _supId != null
        ? data.suppliers.firstWhere((s) => s.id == _supId,
            orElse: () => data.suppliers.first)
        : null;
    final fuelDebt = _supId != null ? supplierFuelDebt(data, _supId!) : 0.0;
    final fuelOff = _deductFuel && fuelDebt > 0 ? fuelDebt : 0.0;
    final fishTotal = _kg * _price;
    final netEarnings = (fishTotal - fuelOff).clamp(0.0, double.infinity);

    return DraggableScrollableSheet(
      initialChildSize: 0.88,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (_, scrollCtrl) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SingleChildScrollView(
          controller: scrollCtrl,
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 12,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              BottomSheetHeader(
                title: 'Record Fish Purchase',
                subtitle: 'Tanzania Lake Victoria Landing Protocol',
              ),
              const SizedBox(height: 16),

              // Step progress
              StepProgressBar(
                steps: const ['Supplier', 'Weigh', 'Quality', 'Payment'],
                currentStep: _step,
              ),
              const SizedBox(height: 20),

              // ── Step 0: Supplier + Weigh ───────────────────────────────
              if (_step == 0) ...[
                // Digital scale terminal
                _ScaleTerminal(
                  reading: _scaleReading,
                  onSimulate: () => setState(() {
                    _scaleReading = 200 + (DateTime.now().millisecond % 400).toDouble();
                    _kg = _scaleReading;
                  }),
                  onTare: () => setState(() => _scaleReading = 0),
                ),
                const SizedBox(height: 16),

                FieldWrapper(
                  label: 'Supplier / Fisherman / BMU',
                  hint: 'Registered lake fishers',
                  child: DropdownButtonFormField<String>(
                    value: _supId,
                    onChanged: (v) => setState(() => _supId = v),
                    items: data.suppliers
                        .map((s) => DropdownMenuItem(
                              value: s.id,
                              child: Text('${s.name} (${s.no})', style: AppTextStyles.bodyMedium, overflow: TextOverflow.ellipsis),
                            ))
                        .toList(),
                    decoration: const InputDecoration(),
                  ),
                ),
                const SizedBox(height: 12),

                Row(
                  children: [
                    Expanded(
                      child: FieldWrapper(
                        label: 'Net Weight (kg)',
                        child: TextFormField(
                          initialValue: _kg.toStringAsFixed(1),
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(suffixText: 'kg'),
                          onChanged: (v) => setState(() => _kg = double.tryParse(v) ?? _kg),
                          style: AppTextStyles.headlineSmall,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: FieldWrapper(
                        label: 'Landing Site',
                        child: DropdownButtonFormField<String>(
                          value: _site,
                          onChanged: (v) => setState(() => _site = v!),
                          items: LandingSites.all
                              .map((s) => DropdownMenuItem(value: s, child: Text(s.split('(')[0].trim(), style: AppTextStyles.bodyMedium)))
                              .toList(),
                          decoration: const InputDecoration(),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                Row(
                  children: [
                    OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Cancel'),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _kg > 0 ? () => setState(() => _step = 1) : null,
                        icon: const Icon(Icons.arrow_forward, size: 18),
                        label: const Text('Next: Species & Grade'),
                      ),
                    ),
                  ],
                ),
              ],

              // ── Step 1: Species + Grade + Price ───────────────────────
              if (_step == 1) ...[
                FieldWrapper(
                  label: 'Fish Species',
                  child: GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 8,
                    crossAxisSpacing: 8,
                    childAspectRatio: 2.5,
                    children: FishSpecies.all
                        .map((sp) => GestureDetector(
                              onTap: () => setState(() {
                                _sp = sp;
                                _price = (FishSpecies.defaultPrices[sp] ?? 7000).toDouble();
                              }),
                              child: Container(
                                decoration: BoxDecoration(
                                  color: _sp == sp ? AppColors.primarySurface : Colors.white,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                    color: _sp == sp ? AppColors.primary : AppColors.grey200,
                                    width: _sp == sp ? 1.5 : 1,
                                  ),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    FishSpeciesIcon(species: sp, size: 28),
                                    const SizedBox(width: 8),
                                    Flexible(
                                      child: Text(
                                        sp.split(' ')[0],
                                        style: AppTextStyles.titleMedium.copyWith(
                                          color: _sp == sp ? AppColors.primary : AppColors.grey700,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ))
                        .toList(),
                  ),
                ),
                const SizedBox(height: 14),

                Row(
                  children: [
                    Expanded(
                      child: FieldWrapper(
                        label: 'Quality Grade',
                        child: DropdownButtonFormField<String>(
                          value: _grade,
                          onChanged: (v) => setState(() => _grade = v!),
                          items: ['A', 'B', 'C', 'Standard']
                              .map((g) => DropdownMenuItem(
                                    value: g,
                                    child: Text(
                                      g == 'A' ? 'Grade A (Export)' : g == 'B' ? 'Grade B (Local)' : g == 'C' ? 'Grade C (Smoke)' : 'Standard',
                                      style: AppTextStyles.bodyMedium,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ))
                              .toList(),
                          decoration: const InputDecoration(),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: FieldWrapper(
                        label: 'Price / kg (TZS)',
                        child: TextFormField(
                          key: ValueKey(_sp),
                          initialValue: _price.toStringAsFixed(0),
                          keyboardType: TextInputType.number,
                          onChanged: (v) => setState(() => _price = double.tryParse(v) ?? _price),
                          style: AppTextStyles.headlineSmall,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // Total calculation
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.primarySurface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.primary.withAlpha(51)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${AppFormatters.kg(_kg)} × TZS ${AppFormatters.num(_price)}',
                            style: AppTextStyles.bodySmall.copyWith(color: AppColors.primary),
                          ),
                          Text(
                            AppFormatters.tzs(fishTotal),
                            style: AppTextStyles.moneyLarge.copyWith(color: AppColors.primary),
                          ),
                        ],
                      ),
                      AppBadge(label: 'BATCH-${data.batches.length + 1}', variant: BadgeVariant.blue),
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
                        onPressed: () => setState(() => _step = 2),
                        icon: const Icon(Icons.arrow_forward, size: 18),
                        label: const Text('Review & Pay'),
                      ),
                    ),
                  ],
                ),
              ],

              // ── Step 2: Review + Pay ──────────────────────────────────
              if (_step == 2) ...[
                Text('Purchase Summary', style: AppTextStyles.headlineSmall),
                const SizedBox(height: 12),

                AppCard(
                  child: Column(
                    children: [
                      InfoRow(label: 'Supplier', value: sup?.name ?? '—'),
                      const Divider(height: 16),
                      InfoRow(label: 'Landing Site', value: _site.split('(')[0].trim()),
                      const Divider(height: 16),
                      InfoRow(label: 'Fish & Grade', value: '$_sp · Grade $_grade'),
                      const Divider(height: 16),
                      InfoRow(label: 'Weight', value: AppFormatters.kg(_kg)),
                      const Divider(height: 16),
                      InfoRow(label: 'Price / kg', value: AppFormatters.tzs(_price)),
                      const Divider(height: 16),
                      InfoRow(label: 'Fish Total', value: AppFormatters.tzs(fishTotal), highlight: true),
                    ],
                  ),
                ),

                if (fuelDebt > 0) ...[
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.warningLight,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.warning.withAlpha(102)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.local_gas_station, color: AppColors.warning, size: 16),
                                const SizedBox(width: 6),
                                Text('Outstanding Fuel Debt', style: AppTextStyles.titleMedium),
                              ],
                            ),
                            Text(AppFormatters.tzs(fuelDebt),
                                style: AppTextStyles.titleMedium.copyWith(color: AppColors.warning)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Deduct from payout?', style: AppTextStyles.bodyMedium),
                            Switch(
                              value: _deductFuel,
                              activeColor: AppColors.primary,
                              onChanged: (v) => setState(() => _deductFuel = v),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 14),

                // Net earnings
                AmountHighlightBox(
                  label: 'Net Payout to Fisherman',
                  amount: AppFormatters.tzs(netEarnings),
                ),

                const SizedBox(height: 14),

                FieldWrapper(
                  label: 'Payment Method',
                  child: DropdownButtonFormField<String>(
                    value: _method,
                    onChanged: (v) => setState(() => _method = v!),
                    items: PaymentMethods.all
                        .map((m) => DropdownMenuItem(value: m, child: Text(m, style: AppTextStyles.bodyMedium)))
                        .toList(),
                    decoration: const InputDecoration(),
                  ),
                ),

                const SizedBox(height: 20),

                Row(
                  children: [
                    OutlinedButton.icon(
                      onPressed: () => setState(() => _step = 1),
                      icon: const Icon(Icons.arrow_back, size: 18),
                      label: const Text('Back'),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () async {
                          await ref.read(branchDataProvider.notifier).buyFish(
                            supId: _supId!,
                            sp: _sp,
                            grade: _grade,
                            kg: _kg,
                            price: _price,
                            site: _site,
                            fuelDeducted: fuelOff > 0 ? fuelOff : null,
                            method: _method,
                          );
                          if (context.mounted) {
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Purchase recorded! ${AppFormatters.kg(_kg)} ${_sp}'),
                                backgroundColor: AppColors.success,
                                behavior: SnackBarBehavior.floating,
                              ),
                            );
                          }
                        },
                        icon: const Icon(Icons.check_circle_outline, size: 18),
                        label: const Text('Save & Issue Receipt'),
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

// ─── Scale Terminal ───────────────────────────────────────────────────────────
class _ScaleTerminal extends StatelessWidget {
  final double reading;
  final VoidCallback onSimulate;
  final VoidCallback onTare;

  const _ScaleTerminal({
    required this.reading,
    required this.onSimulate,
    required this.onTare,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF0D1B2A),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.scale, color: Color(0xFF4ADE80), size: 14),
                  SizedBox(width: 6),
                  Text('CONNECTED DIGITAL SCALE · PANASONIC',
                      style: TextStyle(color: Color(0xFF4ADE80), fontSize: 10, fontFamily: 'monospace')),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  border: Border.all(color: const Color(0xFF4ADE80)),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text('STABLE',
                    style: TextStyle(color: Color(0xFF4ADE80), fontSize: 9, fontFamily: 'monospace')),
              ),
            ],
          ),
          const SizedBox(height: 12),

          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('GROSS WEIGHT',
                        style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontFamily: 'monospace')),
                    Text(
                      reading.toStringAsFixed(1),
                      style: const TextStyle(
                        color: Color(0xFF4ADE80),
                        fontSize: 42,
                        fontWeight: FontWeight.w800,
                        fontFamily: 'monospace',
                        height: 1,
                      ),
                    ),
                    const Text('kg', style: TextStyle(color: Color(0xFF4ADE80), fontSize: 16)),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          Row(
            children: [
              OutlinedButton(
                onPressed: onTare,
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF94A3B8),
                  side: const BorderSide(color: Color(0xFF334155)),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                  textStyle: const TextStyle(fontSize: 11, fontFamily: 'monospace'),
                ),
                child: const Text('TARE (ZERO)'),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: onSimulate,
                  icon: const Icon(Icons.refresh, size: 14),
                  label: const Text('Auto-Capture Scale'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF14532D),
                    foregroundColor: const Color(0xFF4ADE80),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                    textStyle: const TextStyle(fontSize: 11),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Batch Card ───────────────────────────────────────────────────────────────
class _BatchCard extends StatelessWidget {
  final FishBatch batch;
  final Supplier supplier;

  const _BatchCard({required this.batch, required this.supplier});

  @override
  Widget build(BuildContext context) {
    final statusVariant = batch.st == 'accepted'
        ? BadgeVariant.green
        : batch.st == 'rejected'
            ? BadgeVariant.red
            : BadgeVariant.amber;
    final statusLabel = batch.st == 'accepted'
        ? 'Accepted'
        : batch.st == 'rejected'
            ? 'Rejected'
            : 'Pending QC';

    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              FishSpeciesIcon(species: batch.sp, size: 44),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(batch.no,
                            style: AppTextStyles.titleMedium
                                .copyWith(color: AppColors.primary)),
                        AppBadge(label: statusLabel, variant: statusVariant),
                      ],
                    ),
                    Text('${batch.sp} · Grade ${batch.grade}',
                        style: AppTextStyles.headlineSmall),
                    Text('${supplier.name} · ${batch.site}',
                        style: AppTextStyles.caption),
                  ],
                ),
              ),
            ],
          ),
          const Divider(height: 16),

          Row(
            children: [
              _DataPill(label: 'Total', value: AppFormatters.kg(batch.kg)),
              const SizedBox(width: 8),
              if (batch.st == 'accepted')
                _DataPill(label: 'Remaining', value: AppFormatters.kg(batch.rem), highlight: true),
              if (batch.rej > 0)
                _DataPill(label: 'Rejected', value: AppFormatters.kg(batch.rej), danger: true),
              const Spacer(),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(AppFormatters.tzs(batch.total),
                      style: AppTextStyles.moneyMedium),
                  Text('@ TZS ${AppFormatters.num(batch.price)}/kg',
                      style: AppTextStyles.caption),
                ],
              ),
            ],
          ),

          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('${batch.pur} · ${AppFormatters.dateStr(batch.date)}',
                  style: AppTextStyles.caption),
              Text(batch.wh,
                  style: AppTextStyles.caption
                      .copyWith(color: AppColors.primary),
                  overflow: TextOverflow.ellipsis),
            ],
          ),
        ],
      ),
    );
  }
}

class _DataPill extends StatelessWidget {
  final String label;
  final String value;
  final bool highlight;
  final bool danger;

  const _DataPill({
    required this.label,
    required this.value,
    this.highlight = false,
    this.danger = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = danger
        ? AppColors.danger
        : highlight
            ? AppColors.success
            : AppColors.grey600;
    final bg = danger
        ? AppColors.dangerLight
        : highlight
            ? AppColors.successLight
            : AppColors.grey100;

    return Container(
      margin: const EdgeInsets.only(right: 6),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Column(
        children: [
          Text(label, style: TextStyle(fontSize: 9, color: color)),
          Text(value, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
        ],
      ),
    );
  }
}

class _SummaryChip extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _SummaryChip({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withAlpha(51)),
      ),
      child: Column(
        children: [
          Text(value,
              style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: color),
              overflow: TextOverflow.ellipsis),
          Text(label,
              style: const TextStyle(fontSize: 9, color: AppColors.grey500),
              textAlign: TextAlign.center),
        ],
      ),
    );
  }
}





