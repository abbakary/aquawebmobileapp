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

class SuppliersScreen extends ConsumerStatefulWidget {
  const SuppliersScreen({super.key});

  @override
  ConsumerState<SuppliersScreen> createState() => _SuppliersScreenState();
}

class _SuppliersScreenState extends ConsumerState<SuppliersScreen> {
  final _searchCtrl = TextEditingController();
  String _search = '';
  String _filter = 'All'; // All | Fisherman | Group | Agent

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final data = ref.watch(branchDataProvider);

    final filtered = data.suppliers.where((s) {
      final matchSearch = _search.isEmpty ||
          s.name.toLowerCase().contains(_search.toLowerCase()) ||
          s.no.toLowerCase().contains(_search.toLowerCase()) ||
          s.site.toLowerCase().contains(_search.toLowerCase());
      final matchFilter = _filter == 'All' ||
          (_filter == 'Fisherman' && s.cat.contains('Fisherman')) ||
          (_filter == 'Group' && s.cat.contains('Group')) ||
          (_filter == 'Agent' && (s.cat.contains('Dealer') || s.cat.contains('Aquaculture')));
      return matchSearch && matchFilter;
    }).toList();

    return MainShell(
      selectedIndex: 4,
      child: Scaffold(
        backgroundColor: AppColors.grey50,
        appBar: AppBar(
          title: const Text('Suppliers'),
          leading: const BackButton(),
          actions: [
            IconButton(
              icon: const Icon(Icons.add),
              onPressed: () => _showAddSupplier(context),
            ),
          ],
        ),
        body: Column(
          children: [
            // Search + filter
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              child: Column(
                children: [
                  AppSearchBar(
                    hint: 'Search suppliers...',
                    controller: _searchCtrl,
                    onChanged: (v) => setState(() => _search = v),
                  ),
                  const SizedBox(height: 10),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: ['All', 'Fisherman', 'Group', 'Agent']
                          .map((cat) => Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: FilterChip(
                                  label: Text(cat),
                                  selected: _filter == cat,
                                  onSelected: (_) => setState(() => _filter = cat),
                                  selectedColor: AppColors.primarySurface,
                                  checkmarkColor: AppColors.primary,
                                  labelStyle: TextStyle(
                                    color: _filter == cat ? AppColors.primary : AppColors.grey600,
                                    fontWeight: _filter == cat ? FontWeight.w600 : FontWeight.w400,
                                    fontSize: 12,
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

            // List
            Expanded(
              child: filtered.isEmpty
                  ? EmptyState(
                      icon: Icons.people_outline,
                      title: 'No Suppliers Found',
                      subtitle: 'Add your first fisherman or BMU group',
                      actionLabel: 'Add Supplier',
                      onAction: () => _showAddSupplier(context),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      itemCount: filtered.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (context, i) {
                        final sup = filtered[i];
                        final fuelDebt = supplierFuelDebt(data, sup.id);
                        final fishOwed = supplierBalance(data, sup.id);

                        return _SupplierTile(
                          supplier: sup,
                          fuelDebt: fuelDebt,
                          fishOwed: fishOwed,
                          onTap: () => _showSupplierDetail(context, sup),
                        ).animate().fadeIn(delay: (i * 50).ms);
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  void _showSupplierDetail(BuildContext context, Supplier sup) {
    final data = ref.read(branchDataProvider);
    final fuelDebt = supplierFuelDebt(data, sup.id);
    final fishOwed = supplierBalance(data, sup.id);
    final totalDebt = fuelDebt;
    final netBalance = fishOwed - totalDebt;

    final batches = data.batches.where((b) => b.sup == sup.id).toList().reversed.toList();
    final fuelIssues = data.fuelIssues.where((f) => f.supId == sup.id).toList();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.85,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (_, scrollCtrl) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: CustomScrollView(
            controller: scrollCtrl,
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Handle
                      Center(
                        child: Container(
                          width: 36,
                          height: 4,
                          decoration: BoxDecoration(
                              color: AppColors.grey300,
                              borderRadius: BorderRadius.circular(2)),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Header
                      Row(
                        children: [
                          AvatarCircle(name: sup.name, size: 52),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(sup.name, style: AppTextStyles.headlineMedium),
                                Text('${sup.no} · ${sup.cat}', style: AppTextStyles.bodySmall),
                                Text(sup.site, style: AppTextStyles.caption),
                              ],
                            ),
                          ),
                          AppBadge(
                            label: sup.status,
                            variant: sup.status == 'Active' ? BadgeVariant.green : BadgeVariant.grey,
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // Account summary
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          gradient: AppColors.primaryGradient,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: _AccountStat(
                                label: 'Fish Owed',
                                value: AppFormatters.tzsShort(fishOwed),
                                color: Colors.white,
                              ),
                            ),
                            Container(width: 1, height: 40, color: Colors.white24),
                            Expanded(
                              child: _AccountStat(
                                label: 'Fuel Debt',
                                value: AppFormatters.tzsShort(fuelDebt),
                                color: fuelDebt > 0 ? const Color(0xFFFDE68A) : Colors.white,
                              ),
                            ),
                            Container(width: 1, height: 40, color: Colors.white24),
                            Expanded(
                              child: _AccountStat(
                                label: 'Net Balance',
                                value: AppFormatters.tzsShort(netBalance.abs()),
                                color: netBalance < 0 ? const Color(0xFFFCA5A5) : Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // Quick info
                      AppCard(
                        child: Column(
                          children: [
                            InfoRow(label: 'Phone', value: sup.phone),
                            const Divider(height: 16),
                            InfoRow(label: 'Boat / Vessel', value: sup.boat.isEmpty ? '—' : sup.boat),
                            const Divider(height: 16),
                            InfoRow(label: 'Reg No.', value: sup.boatReg.isEmpty ? '—' : sup.boatReg),
                            const Divider(height: 16),
                            InfoRow(label: 'Total Supplied', value: AppFormatters.kg(sup.totalSupplied.toDouble())),
                            const Divider(height: 16),
                            InfoRow(label: 'Credit Limit', value: AppFormatters.tzs(sup.creditLimit.toDouble())),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // Recent catches
                      Text('Recent Deliveries', style: AppTextStyles.headlineSmall),
                      const SizedBox(height: 8),
                      ...batches.take(4).map((b) => _BatchMiniTile(batch: b)),

                      if (fuelIssues.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        Text('Fuel Issued', style: AppTextStyles.headlineSmall),
                        const SizedBox(height: 8),
                        ...fuelIssues.take(3).map((fi) => Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppColors.warningLight,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: AppColors.warning.withAlpha(77)),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(fi.no, style: AppTextStyles.titleMedium),
                                      Text('${AppFormatters.litres(fi.litres)} ${fi.fuel} · ${AppFormatters.dateStr(fi.date)}',
                                          style: AppTextStyles.caption),
                                    ],
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(AppFormatters.tzs(fi.total),
                                          style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w700)),
                                      if (fi.balance > 0)
                                        Text('Outstanding: ${AppFormatters.tzs(fi.balance)}',
                                            style: AppTextStyles.caption.copyWith(color: AppColors.danger)),
                                    ],
                                  ),
                                ],
                              ),
                            )),
                      ],

                      const SizedBox(height: 80),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showAddSupplier(BuildContext context) {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final boatCtrl = TextEditingController();
    final boatRegCtrl = TextEditingController();
    String cat = 'Individual Fisherman';
    String site = LandingSites.all[0];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
          child: Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                BottomSheetHeader(title: 'Add Supplier', subtitle: 'Register a new fisherman or BMU group'),
                const SizedBox(height: 16),
                FieldWrapper(label: 'Full Name', child: TextField(controller: nameCtrl, decoration: const InputDecoration(hintText: 'e.g. Mzee Juma'))),
                const SizedBox(height: 12),
                FieldWrapper(label: 'Phone', child: TextField(controller: phoneCtrl, decoration: const InputDecoration(hintText: '0754 ...'), keyboardType: TextInputType.phone)),
                const SizedBox(height: 12),
                FieldWrapper(
                  label: 'Category',
                  child: DropdownButtonFormField<String>(
                    value: cat,
                    onChanged: (v) => setModalState(() => cat = v!),
                    items: SupplierCategories.all.map((c) => DropdownMenuItem(value: c, child: Text(c, style: AppTextStyles.bodyMedium))).toList(),
                    decoration: const InputDecoration(),
                  ),
                ),
                const SizedBox(height: 12),
                FieldWrapper(
                  label: 'Landing Site',
                  child: DropdownButtonFormField<String>(
                    value: site,
                    onChanged: (v) => setModalState(() => site = v!),
                    items: LandingSites.all.map((s) => DropdownMenuItem(value: s, child: Text(s, style: AppTextStyles.bodyMedium, overflow: TextOverflow.ellipsis))).toList(),
                    decoration: const InputDecoration(),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(child: FieldWrapper(label: 'Boat Name', child: TextField(controller: boatCtrl, decoration: const InputDecoration(hintText: 'MV Furaha')))),
                    const SizedBox(width: 10),
                    Expanded(child: FieldWrapper(label: 'Reg No.', child: TextField(controller: boatRegCtrl, decoration: const InputDecoration(hintText: 'TZN-304')))),
                  ],
                ),
                const SizedBox(height: 20),
                PrimaryButton(
                  label: 'Register Supplier',
                  icon: Icons.person_add,
                  onPressed: () async {
                    if (nameCtrl.text.trim().isEmpty) return;
                    final no = 'SUP-${(ref.read(branchDataProvider).suppliers.length + 1).toString().padLeft(5, '0')}';
                    await ref.read(branchDataProvider.notifier).addSupplier(Supplier(
                      no: no,
                      name: nameCtrl.text.trim(),
                      phone: phoneCtrl.text.trim(),
                      site: site,
                      cat: cat,
                      boat: boatCtrl.text.trim(),
                      boatReg: boatRegCtrl.text.trim(),
                    ));
                    if (ctx.mounted) Navigator.pop(ctx);
                  },
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SupplierTile extends StatelessWidget {
  final Supplier supplier;
  final double fuelDebt;
  final double fishOwed;
  final VoidCallback onTap;

  const _SupplierTile({
    required this.supplier,
    required this.fuelDebt,
    required this.fishOwed,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        color: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            AvatarCircle(name: supplier.name, size: 46),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(supplier.name, style: AppTextStyles.titleMedium),
                  Text('${supplier.no} · ${supplier.cat}', style: AppTextStyles.bodySmall),
                  Text(supplier.site,
                      style: AppTextStyles.caption,
                      overflow: TextOverflow.ellipsis),
                  if (supplier.boat.isNotEmpty)
                    Text('${supplier.boat} · ${supplier.boatReg}', style: AppTextStyles.caption),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                AppBadge(
                  label: supplier.status,
                  variant: supplier.status == 'Active' ? BadgeVariant.green : BadgeVariant.grey,
                ),
                const SizedBox(height: 4),
                if (fuelDebt > 0) ...[
                  Text('Fuel: ${AppFormatters.tzsShort(fuelDebt)}',
                      style: AppTextStyles.caption.copyWith(color: AppColors.warning)),
                ],
                if (fishOwed > 0) ...[
                  Text('Owed: ${AppFormatters.tzsShort(fishOwed)}',
                      style: AppTextStyles.caption.copyWith(color: AppColors.primary)),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _AccountStat extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _AccountStat({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(label, style: const TextStyle(color: Colors.white60, fontSize: 10)),
        const SizedBox(height: 4),
        Text(value, style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.w700)),
      ],
    );
  }
}

class _BatchMiniTile extends StatelessWidget {
  final FishBatch batch;
  const _BatchMiniTile({required this.batch});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.grey50,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.grey200),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              FishSpeciesIcon(species: batch.sp, size: 32),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${batch.sp} · Grade ${batch.grade}', style: AppTextStyles.titleMedium),
                  Text('${batch.no} · ${AppFormatters.dateStr(batch.date)}', style: AppTextStyles.caption),
                ],
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(AppFormatters.kgShort(batch.kg), style: AppTextStyles.titleMedium),
              AppBadge(
                label: batch.st == 'accepted' ? 'Accepted' : batch.st == 'rejected' ? 'Rejected' : 'Pending',
                variant: batch.st == 'accepted' ? BadgeVariant.green : batch.st == 'rejected' ? BadgeVariant.red : BadgeVariant.amber,
              ),
            ],
          ),
        ],
      ),
    );
  }
}





