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

class InventoryScreen extends ConsumerStatefulWidget {
  const InventoryScreen({super.key});

  @override
  ConsumerState<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends ConsumerState<InventoryScreen>
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
    final stockMap = computeStock(data);
    final totalStock = stockMap.values.fold(0.0, (s, v) => s + v);
    final warehouseCount = data.wh.length;

    return MainShell(
      selectedIndex: 2,
      child: Scaffold(
        backgroundColor: AppColors.grey50,
        appBar: AppBar(
          title: const Text('Inventory'),
          bottom: TabBar(
            controller: _tabs,
            tabs: const [
              Tab(text: 'Stock Summary'),
              Tab(text: 'Batches'),
            ],
          ),
        ),
        body: TabBarView(
          controller: _tabs,
          children: [
            // ── Tab 1: Stock Summary ─────────────────────────────────────
            _StockSummaryTab(
              stockMap: stockMap,
              totalStock: totalStock,
              warehouseCount: warehouseCount,
              warehouses: data.wh,
              batches: data.batches,
            ),

            // ── Tab 2: Batch List ─────────────────────────────────────────
            _BatchListTab(data: data),
          ],
        ),
      ),
    );
  }
}

// ─── Stock Summary Tab ────────────────────────────────────────────────────────
class _StockSummaryTab extends StatelessWidget {
  final Map<String, double> stockMap;
  final double totalStock;
  final int warehouseCount;
  final List<String> warehouses;
  final List<FishBatch> batches;

  const _StockSummaryTab({
    required this.stockMap,
    required this.totalStock,
    required this.warehouseCount,
    required this.warehouses,
    required this.batches,
  });

  @override
  Widget build(BuildContext context) {
    // Group by species
    final bySpecies = <String, double>{};
    for (final entry in stockMap.entries) {
      final sp = entry.key.split('|')[0];
      bySpecies[sp] = (bySpecies[sp] ?? 0) + entry.value;
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Header stats
        Row(
          children: [
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Available Stock', style: TextStyle(color: Colors.white60, fontSize: 11)),
                    const SizedBox(height: 4),
                    Text(AppFormatters.kgShort(totalStock),
                        style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800)),
                    Text('across $warehouseCount warehouses',
                        style: const TextStyle(color: Colors.white60, fontSize: 11)),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.successLight,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.success.withAlpha(77)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Warehouses', style: AppTextStyles.bodySmall.copyWith(color: AppColors.success)),
                    const SizedBox(height: 4),
                    Text('$warehouseCount',
                        style: TextStyle(color: AppColors.success, fontSize: 24, fontWeight: FontWeight.w800)),
                    Text('cold rooms active',
                        style: AppTextStyles.caption.copyWith(color: AppColors.success)),
                  ],
                ),
              ),
            ),
          ],
        ),

        const SizedBox(height: 16),

        // Stock by species
        Text('Stock by Fish Type', style: AppTextStyles.headlineSmall),
        const SizedBox(height: 10),
        ...FishSpecies.all.map((sp) {
          final kg = bySpecies[sp] ?? 0;
          final grades = stockMap.entries
              .where((e) => e.key.startsWith(sp))
              .toList();
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: AppCard(
              child: Column(
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
                            Text(AppFormatters.kg(kg), style: AppTextStyles.bodySmall),
                          ],
                        ),
                      ),
                      if (kg == 0)
                        const AppBadge(label: 'Out of Stock', variant: BadgeVariant.red)
                      else
                        AppBadge(label: AppFormatters.kgShort(kg), variant: BadgeVariant.green),
                    ],
                  ),
                  if (grades.isNotEmpty) ...[
                    const Divider(height: 16),
                    Wrap(
                      spacing: 8,
                      children: grades.map((e) {
                        final grade = e.key.split('|')[1];
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: AppColors.primarySurface,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'Grade $grade: ${AppFormatters.kgShort(e.value)}',
                            style: AppTextStyles.bodySmall.copyWith(color: AppColors.primary, fontWeight: FontWeight.w600),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ],
              ),
            ),
          );
        }).toList(),

        const SizedBox(height: 16),

        // Warehouse capacity
        Text('Warehouse Status', style: AppTextStyles.headlineSmall),
        const SizedBox(height: 10),
        ...warehouses.asMap().entries.map((e) {
          final batchesInWh = batches.where((b) => b.wh == e.value && b.st == 'accepted' && b.rem > 0);
          final totalInWh = batchesInWh.fold(0.0, (s, b) => s + b.rem);
          final capacityEst = 3000.0 + e.key * 500;
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.warehouse_outlined, color: AppColors.primary, size: 18),
                          const SizedBox(width: 8),
                          Text(e.value.split('(')[0].trim(), style: AppTextStyles.titleLarge),
                        ],
                      ),
                      Text(AppFormatters.kg(totalInWh), style: AppTextStyles.moneyMedium),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: (totalInWh / capacityEst).clamp(0, 1),
                      minHeight: 6,
                      backgroundColor: AppColors.grey100,
                      valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${(totalInWh / capacityEst * 100).toStringAsFixed(0)}% full · ${batchesInWh.length} batches',
                    style: AppTextStyles.caption,
                  ),
                ],
              ),
            ),
          );
        }),

        const SizedBox(height: 80),
      ],
    );
  }
}

// ─── Batch List Tab ───────────────────────────────────────────────────────────
class _BatchListTab extends ConsumerStatefulWidget {
  final BranchData data;
  const _BatchListTab({required this.data});

  @override
  ConsumerState<_BatchListTab> createState() => _BatchListTabState();
}

class _BatchListTabState extends ConsumerState<_BatchListTab> {
  String _filter = 'All';

  @override
  Widget build(BuildContext context) {
    final batches = widget.data.batches.reversed
        .where((b) {
          if (_filter == 'Available') return b.st == 'accepted' && b.rem > 0;
          if (_filter == 'Pending') return b.st == 'pending';
          if (_filter == 'Rejected') return b.st == 'rejected';
          return true;
        })
        .toList();

    return Column(
      children: [
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: ['All', 'Available', 'Pending', 'Rejected']
                  .map((f) => Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          label: Text(f),
                          selected: _filter == f,
                          onSelected: (_) => setState(() => _filter = f),
                          selectedColor: AppColors.primarySurface,
                          checkmarkColor: AppColors.primary,
                          labelStyle: TextStyle(
                            color: _filter == f ? AppColors.primary : AppColors.grey600,
                            fontSize: 12,
                            fontWeight: _filter == f ? FontWeight.w600 : FontWeight.w400,
                          ),
                        ),
                      ))
                  .toList(),
            ),
          ),
        ),
        const Divider(height: 1),
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: batches.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (_, i) {
              final b = batches[i];
              final sup = widget.data.suppliers.firstWhere(
                (s) => s.id == b.sup,
                orElse: () => Supplier(no: '', name: '—', phone: '', site: '', cat: ''),
              );
              return _BatchDetailCard(
                batch: b,
                supplier: sup,
                warehouses: widget.data.wh,
                onTransfer: (to) => ref.read(branchDataProvider.notifier).transferBatch(b.id, to),
                onDispatch: () {},
              ).animate().fadeIn(delay: (i * 30).ms);
            },
          ),
        ),
      ],
    );
  }
}

class _BatchDetailCard extends StatelessWidget {
  final FishBatch batch;
  final Supplier supplier;
  final List<String> warehouses;
  final ValueChanged<String> onTransfer;
  final VoidCallback onDispatch;

  const _BatchDetailCard({
    required this.batch,
    required this.supplier,
    required this.warehouses,
    required this.onTransfer,
    required this.onDispatch,
  });

  @override
  Widget build(BuildContext context) {
    final statusVariant = batch.st == 'accepted'
        ? BadgeVariant.green
        : batch.st == 'rejected'
            ? BadgeVariant.red
            : BadgeVariant.amber;

    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primarySurface,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(batch.no,
                    style: AppTextStyles.labelSmall.copyWith(color: AppColors.primary)),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text('${batch.sp} — Grade ${batch.grade}',
                    style: AppTextStyles.titleLarge),
              ),
              AppBadge(
                label: batch.st == 'accepted' ? 'Available' : batch.st == 'rejected' ? 'Rejected' : 'Pending',
                variant: statusVariant,
              ),
            ],
          ),

          const SizedBox(height: 10),

          Row(
            children: [
              _InfoChip(label: 'Received', value: AppFormatters.kg(batch.kg)),
              _InfoChip(
                  label: 'Available',
                  value: AppFormatters.kg(batch.rem),
                  highlight: batch.st == 'accepted'),
              if (batch.rej > 0)
                _InfoChip(label: 'Rejected', value: AppFormatters.kg(batch.rej), danger: true),
            ],
          ),

          const SizedBox(height: 8),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Supplier: ${supplier.name}', style: AppTextStyles.caption),
                  Text('Received: ${AppFormatters.dateStr(batch.date)}',
                      style: AppTextStyles.caption),
                  if (batch.temp > 0)
                    Text('Temp: ${batch.temp.toStringAsFixed(1)}°C', style: AppTextStyles.caption),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.warehouse_outlined, size: 12, color: AppColors.grey400),
                      const SizedBox(width: 4),
                      Text(batch.wh.split('(')[0].trim(),
                          style: AppTextStyles.caption.copyWith(color: AppColors.primary),
                          overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ],
              ),
            ],
          ),

          if (batch.st == 'accepted' && batch.rem > 0) ...[
            const Divider(height: 14),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _showTransferDialog(context),
                    icon: const Icon(Icons.swap_horiz, size: 16),
                    label: const Text('Transfer'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      textStyle: const TextStyle(fontSize: 12),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: onDispatch,
                    icon: const Icon(Icons.local_shipping_outlined, size: 16),
                    label: const Text('Dispatch'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      textStyle: const TextStyle(fontSize: 12),
                      backgroundColor: AppColors.success,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  void _showTransferDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Transfer Batch'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: warehouses
              .where((w) => w != batch.wh)
              .map((w) => ListTile(
                    title: Text(w, style: AppTextStyles.bodyMedium),
                    leading: const Icon(Icons.warehouse_outlined, color: AppColors.primary),
                    onTap: () {
                      onTransfer(w);
                      Navigator.pop(context);
                    },
                  ))
              .toList(),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ],
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final String label;
  final String value;
  final bool highlight;
  final bool danger;

  const _InfoChip({
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
            : AppColors.grey500;
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: danger
            ? AppColors.dangerLight
            : highlight
                ? AppColors.successLight
                : AppColors.grey100,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Column(
        children: [
          Text(label, style: TextStyle(fontSize: 9, color: color)),
          Text(value,
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
        ],
      ),
    );
  }
}



