import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme.dart';
import '../../core/formatters.dart';
import '../../models/models.dart';
import '../../providers/app_state.dart';
import '../../widgets/app_widgets.dart';
import '../dashboard/main_shell.dart';

class MaintenanceScreen extends ConsumerStatefulWidget {
  const MaintenanceScreen({super.key});

  @override
  ConsumerState<MaintenanceScreen> createState() => _MaintenanceScreenState();
}

class _MaintenanceScreenState extends ConsumerState<MaintenanceScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final data = ref.watch(branchDataProvider);
    final openOrders = data.maintenanceOrders.where((w) => w.status != 'Completed').length;
    final lowStockParts = data.spareParts.where((p) => p.isLowStock).length;

    return MainShell(
      selectedIndex: 4,
      child: Scaffold(
        backgroundColor: AppColors.grey50,
        appBar: AppBar(
          title: const Text('Fleet & Maintenance'),
          actions: [
            if (openOrders > 0)
              _AppBarBadge(label: '$openOrders Open', color: AppColors.warning),
            if (lowStockParts > 0)
              _AppBarBadge(label: '$lowStockParts Low Stock', color: AppColors.danger),
            const SizedBox(width: 4),
          ],
          bottom: TabBar(
            controller: _tabs,
            isScrollable: true,
            tabs: const [
              Tab(text: 'Work Orders'),
              Tab(text: 'Boat Registry'),
              Tab(text: 'Spare Parts'),
              Tab(text: 'Engine Hours'),
            ],
          ),
        ),
        body: TabBarView(
          controller: _tabs,
          children: [
            _WorkOrdersTab(
              data: data,
              onAdd: () => _showWorkOrderSheet(context),
              onUpdateStatus: (woId, status) =>
                  ref.read(branchDataProvider.notifier).updateWorkOrderStatus(woId, status),
            ),
            _BoatRegistryTab(
              data: data,
              onAdd: () => _showAddBoatSheet(context),
              onStatusChange: (boatId, status) =>
                  ref.read(branchDataProvider.notifier).updateBoatStatus(boatId, status),
            ),
            _SparePartsTab(
              data: data,
              onAdd: () => _showAddPartSheet(context),
            ),
            _EngineHoursTab(data: data),
          ],
        ),
        floatingActionButton: AnimatedBuilder(
          animation: _tabs,
          builder: (_, __) {
            if (_tabs.index == 0) {
              return FloatingActionButton.extended(
                onPressed: () => _showWorkOrderSheet(context),
                backgroundColor: const Color(0xFF7C3AED),
                icon: const Icon(Icons.add, color: Colors.white),
                label: const Text('New Work Order',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
              );
            }
            if (_tabs.index == 1) {
              return FloatingActionButton.extended(
                onPressed: () => _showAddBoatSheet(context),
                backgroundColor: AppColors.primary,
                icon: const Icon(Icons.directions_boat, color: Colors.white),
                label: const Text('Add Boat',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
              );
            }
            if (_tabs.index == 2) {
              return FloatingActionButton.extended(
                onPressed: () => _showAddPartSheet(context),
                backgroundColor: AppColors.success,
                icon: const Icon(Icons.add, color: Colors.white),
                label: const Text('Add Part',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
              );
            }
            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }

  // ── Work Order Sheet ────────────────────────────────────────────────────────
  void _showWorkOrderSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _WorkOrderSheet(),
    );
  }

  // ── Add Boat Sheet ─────────────────────────────────────────────────────────
  void _showAddBoatSheet(BuildContext context) {
    final nameCtrl = TextEditingController();
    final regCtrl = TextEditingController();
    final captainCtrl = TextEditingController();
    final engineCtrl = TextEditingController();
    String ownerType = 'Fisherman-owned';
    String? ownerId;
    String boatType = 'Planked Wooden Mashua (10m)';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        final data = ref.read(branchDataProvider);
        if (data.suppliers.isNotEmpty) ownerId = data.suppliers.first.id;

        return StatefulBuilder(
          builder: (ctx, setModalState) => Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
            child: Container(
              decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
              padding: const EdgeInsets.all(20),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const BottomSheetHeader(
                        title: 'Register New Boat',
                        subtitle: 'Add a fishing vessel to the fleet'),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: FieldWrapper(
                            label: 'Vessel Name',
                            child: TextField(
                                controller: nameCtrl,
                                decoration: const InputDecoration(hintText: 'MV Furaha')),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: FieldWrapper(
                            label: 'Reg No.',
                            child: TextField(
                                controller: regCtrl,
                                decoration: const InputDecoration(hintText: 'TZN-304')),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    FieldWrapper(
                      label: 'Captain',
                      child: TextField(
                          controller: captainCtrl,
                          decoration: const InputDecoration(hintText: 'Mzee Juma')),
                    ),
                    const SizedBox(height: 12),
                    FieldWrapper(
                      label: 'Engine',
                      child: TextField(
                          controller: engineCtrl,
                          decoration: const InputDecoration(
                              hintText: 'Yamaha Outboard 40HP 2-Stroke')),
                    ),
                    const SizedBox(height: 12),
                    FieldWrapper(
                      label: 'Owner Type',
                      child: DropdownButtonFormField<String>(
                        value: ownerType,
                        onChanged: (v) => setModalState(() => ownerType = v!),
                        items: ['Fisherman-owned', 'BMU-owned', 'Company-owned']
                            .map((t) => DropdownMenuItem(
                                value: t, child: Text(t, style: AppTextStyles.bodyMedium)))
                            .toList(),
                        decoration: const InputDecoration(),
                      ),
                    ),
                    if (ownerType == 'Fisherman-owned' || ownerType == 'BMU-owned') ...[
                      const SizedBox(height: 12),
                      FieldWrapper(
                        label: 'Owner / Supplier',
                        child: DropdownButtonFormField<String>(
                          value: ownerId,
                          onChanged: (v) => setModalState(() => ownerId = v),
                          items: data.suppliers
                              .map((s) => DropdownMenuItem(
                                  value: s.id,
                                  child: Text(s.name,
                                      style: AppTextStyles.bodyMedium,
                                      overflow: TextOverflow.ellipsis)))
                              .toList(),
                          decoration: const InputDecoration(),
                        ),
                      ),
                    ],
                    const SizedBox(height: 12),
                    FieldWrapper(
                      label: 'Boat Type',
                      child: DropdownButtonFormField<String>(
                        value: boatType,
                        onChanged: (v) => setModalState(() => boatType = v!),
                        items: [
                          'Planked Wooden Mashua (10m)',
                          'Fiberglass Fishing Canoe (8m)',
                          'Heavy Wooden Transport Dhow (12m)',
                          'Aluminum Boat (6m)',
                          'Planked Canoe (9m)',
                        ]
                            .map((t) => DropdownMenuItem(
                                value: t,
                                child: Text(t,
                                    style: AppTextStyles.bodyMedium,
                                    overflow: TextOverflow.ellipsis)))
                            .toList(),
                        decoration: const InputDecoration(),
                      ),
                    ),
                    const SizedBox(height: 20),
                    PrimaryButton(
                      label: 'Register Boat',
                      icon: Icons.directions_boat,
                      onPressed: () async {
                        if (nameCtrl.text.trim().isEmpty) return;
                        await ref.read(branchDataProvider.notifier).addBoat(Boat(
                          regNo: regCtrl.text.trim(),
                          name: nameCtrl.text.trim(),
                          ownerType: ownerType,
                          ownerId: ownerId ?? 'company',
                          captain: captainCtrl.text.trim(),
                          engine: engineCtrl.text.trim(),
                          boatType: boatType,
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
      },
    );
  }

  // ── Add Spare Part Sheet ───────────────────────────────────────────────────
  void _showAddPartSheet(BuildContext context) {
    final nameCtrl = TextEditingController();
    final partNoCtrl = TextEditingController();
    final stockCtrl = TextEditingController(text: '10');
    final minCtrl = TextEditingController(text: '5');
    final costCtrl = TextEditingController();
    final sellCtrl = TextEditingController();
    String category = 'Ignition';
    String unit = 'pcs';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: Container(
          decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
          padding: const EdgeInsets.all(20),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const BottomSheetHeader(
                    title: 'Add Spare Part',
                    subtitle: 'Register marine spare part to inventory'),
                const SizedBox(height: 16),
                FieldWrapper(
                    label: 'Part Name',
                    child: TextField(
                        controller: nameCtrl,
                        decoration:
                            const InputDecoration(hintText: 'NGK Marine Spark Plug B7HS-10'))),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: FieldWrapper(
                          label: 'Part Number',
                          child: TextField(
                              controller: partNoCtrl,
                              decoration: const InputDecoration(hintText: 'NGK-B7HS'))),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: StatefulBuilder(
                        builder: (ctx2, setS) => FieldWrapper(
                          label: 'Category',
                          child: DropdownButtonFormField<String>(
                            value: category,
                            onChanged: (v) => setS(() => category = v!),
                            items: ['Ignition', 'Lubricants', 'Propulsion', 'Electrical',
                              'Rigging', 'Hull & Body', 'Cooling', 'Other']
                                .map((c) => DropdownMenuItem(
                                    value: c, child: Text(c, style: AppTextStyles.bodyMedium)))
                                .toList(),
                            decoration: const InputDecoration(),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: FieldWrapper(
                          label: 'Initial Stock',
                          child: TextField(
                              controller: stockCtrl,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(hintText: '10'))),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: FieldWrapper(
                          label: 'Min Stock',
                          child: TextField(
                              controller: minCtrl,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(hintText: '5'))),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: StatefulBuilder(
                        builder: (ctx2, setS) => FieldWrapper(
                          label: 'Unit',
                          child: DropdownButtonFormField<String>(
                            value: unit,
                            onChanged: (v) => setS(() => unit = v!),
                            items: ['pcs', 'Litres', 'tubes', 'rolls', 'sets', 'kg']
                                .map((u) => DropdownMenuItem(
                                    value: u, child: Text(u, style: AppTextStyles.bodyMedium)))
                                .toList(),
                            decoration: const InputDecoration(),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: FieldWrapper(
                          label: 'Unit Cost (TZS)',
                          child: TextField(
                              controller: costCtrl,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(hintText: '8500'))),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: FieldWrapper(
                          label: 'Sell Price (TZS)',
                          child: TextField(
                              controller: sellCtrl,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(hintText: '12000'))),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                PrimaryButton(
                  label: 'Add to Inventory',
                  icon: Icons.add_box_outlined,
                  onPressed: () async {
                    if (nameCtrl.text.trim().isEmpty) return;
                    await ref.read(branchDataProvider.notifier).addSparePart(SparePart(
                      name: nameCtrl.text.trim(),
                      partNo: partNoCtrl.text.trim(),
                      category: category,
                      stock: int.tryParse(stockCtrl.text) ?? 0,
                      minStock: int.tryParse(minCtrl.text) ?? 5,
                      unitCost: double.tryParse(costCtrl.text) ?? 0,
                      sellPrice: double.tryParse(sellCtrl.text) ?? 0,
                      unit: unit,
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

// ─── Work Orders Tab ──────────────────────────────────────────────────────────
class _WorkOrdersTab extends StatefulWidget {
  final BranchData data;
  final VoidCallback onAdd;
  final void Function(String woId, String status) onUpdateStatus;

  const _WorkOrdersTab({
    required this.data,
    required this.onAdd,
    required this.onUpdateStatus,
  });

  @override
  State<_WorkOrdersTab> createState() => _WorkOrdersTabState();
}

class _WorkOrdersTabState extends State<_WorkOrdersTab> {
  String _filter = 'All';

  @override
  Widget build(BuildContext context) {
    final orders = widget.data.maintenanceOrders.where((w) {
      if (_filter == 'Open') return w.status != 'Completed';
      if (_filter == 'Completed') return w.status == 'Completed';
      if (_filter == 'In Progress') return w.status == 'In Progress';
      return true;
    }).toList();

    final totalCost = widget.data.maintenanceOrders
        .fold(0.0, (s, w) => s + w.totalCost);
    final recoverable = widget.data.maintenanceOrders
        .fold(0.0, (s, w) => s + w.recoverable);

    return Column(
      children: [
        // Summary banner
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: Row(
            children: [
              _WoStat(
                label: 'Total Cost',
                value: AppFormatters.tzsShort(totalCost),
                color: AppColors.primary,
              ),
              _WoStat(
                label: 'Recoverable',
                value: AppFormatters.tzsShort(recoverable),
                color: AppColors.warning,
              ),
              _WoStat(
                label: 'Open Orders',
                value: '${widget.data.maintenanceOrders.where((w) => w.status != 'Completed').length}',
                color: widget.data.maintenanceOrders.any((w) => w.status != 'Completed')
                    ? AppColors.danger
                    : AppColors.success,
              ),
            ],
          ),
        ),

        // Filter chips
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: ['All', 'Open', 'In Progress', 'Completed']
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

        // List
        Expanded(
          child: orders.isEmpty
              ? EmptyState(
                  icon: Icons.build_outlined,
                  title: 'No Work Orders',
                  subtitle: 'Create a maintenance work order for a boat',
                  actionLabel: 'New Work Order',
                  onAction: widget.onAdd,
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: orders.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (_, i) {
                    final wo = orders[i];
                    final boat = widget.data.boats.firstWhere(
                      (b) => b.id == wo.boatId,
                      orElse: () => Boat(
                          regNo: '—', name: '—', ownerType: '', ownerId: '',
                          captain: '', engine: '', boatType: ''),
                    );
                    return _WorkOrderCard(
                      wo: wo,
                      boat: boat,
                      data: widget.data,
                      onStatusChange: (s) => widget.onUpdateStatus(wo.id, s),
                    ).animate().fadeIn(delay: (i * 50).ms);
                  },
                ),
        ),
      ],
    );
  }
}

// ─── Work Order Card ──────────────────────────────────────────────────────────
class _WorkOrderCard extends StatelessWidget {
  final MaintenanceOrder wo;
  final Boat boat;
  final BranchData data;
  final ValueChanged<String> onStatusChange;

  const _WorkOrderCard({
    required this.wo,
    required this.boat,
    required this.data,
    required this.onStatusChange,
  });

  Color get _statusColor {
    switch (wo.status) {
      case 'Completed': return AppColors.success;
      case 'In Progress': return AppColors.warning;
      default: return AppColors.grey400;
    }
  }

  BadgeVariant get _statusVariant {
    switch (wo.status) {
      case 'Completed': return BadgeVariant.green;
      case 'In Progress': return BadgeVariant.amber;
      default: return BadgeVariant.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: _statusColor.withAlpha(31),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(Icons.build_rounded, color: _statusColor, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(wo.no,
                        style: AppTextStyles.titleMedium.copyWith(
                            color: const Color(0xFF7C3AED))),
                    Text(wo.title,
                        style: AppTextStyles.headlineSmall,
                        overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
              AppBadge(label: wo.status, variant: _statusVariant),
            ],
          ),

          const Divider(height: 16),

          // Boat info
          Row(
            children: [
              const Icon(Icons.directions_boat_outlined,
                  size: 14, color: AppColors.grey400),
              const SizedBox(width: 6),
              Text('${boat.name} (${boat.regNo})',
                  style: AppTextStyles.bodyMedium),
              const Spacer(),
              Text(AppFormatters.dateStr(wo.date), style: AppTextStyles.caption),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(Icons.engineering_outlined,
                  size: 14, color: AppColors.grey400),
              const SizedBox(width: 6),
              Expanded(
                  child: Text(wo.mechanic,
                      style: AppTextStyles.bodySmall,
                      overflow: TextOverflow.ellipsis)),
            ],
          ),

          if (wo.fault.isNotEmpty) ...[
            const SizedBox(height: 6),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.grey50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.grey200),
              ),
              child: Text(wo.fault, style: AppTextStyles.bodySmall),
            ),
          ],

          const Divider(height: 16),

          // Cost breakdown
          Row(
            children: [
              Expanded(child: _CostPill(label: 'Parts', value: wo.partsCost)),
              Expanded(child: _CostPill(label: 'Labour', value: wo.laborCost)),
              Expanded(child: _CostPill(label: 'Other', value: wo.otherCost)),
              Expanded(
                child: _CostPill(
                    label: 'Total', value: wo.totalCost, highlight: true),
              ),
            ],
          ),

          if (wo.parts.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text('Parts Used:', style: AppTextStyles.labelLarge),
            const SizedBox(height: 4),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: wo.parts.map((p) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primarySurface,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '${p.name} × ${p.qty}',
                  style: AppTextStyles.caption
                      .copyWith(color: AppColors.primary, fontWeight: FontWeight.w600),
                ),
              )).toList(),
            ),
          ],

          if (wo.recoverable > 0) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.warningLight,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.warning.withAlpha(77)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.account_balance_wallet_outlined,
                      color: AppColors.warning, size: 15),
                  const SizedBox(width: 6),
                  Text(
                    'Recoverable from fisherman: ${AppFormatters.tzs(wo.recoverable - wo.recovered)}',
                    style: AppTextStyles.bodySmall
                        .copyWith(color: const Color(0xFF92400E)),
                  ),
                ],
              ),
            ),
          ],

          if (wo.arrangement.isNotEmpty) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                AppBadge(
                  label: wo.arrangement,
                  variant: wo.arrangement == 'Company-paid'
                      ? BadgeVariant.blue
                      : BadgeVariant.amber,
                ),
              ],
            ),
          ],

          const Divider(height: 16),

          // Status action buttons
          if (wo.status != 'Completed')
            Row(
              children: [
                if (wo.status == 'Reported')
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => onStatusChange('In Progress'),
                      icon: const Icon(Icons.play_arrow_rounded, size: 16),
                      label: const Text('Start Work'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.warning,
                        side: const BorderSide(color: AppColors.warning),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                if (wo.status == 'In Progress') ...[
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => onStatusChange('Completed'),
                      icon: const Icon(Icons.check_circle_outline, size: 16),
                      label: const Text('Mark Complete'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.success,
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ],
              ],
            )
          else
            Row(
              children: [
                const Icon(Icons.check_circle, color: AppColors.success, size: 16),
                const SizedBox(width: 6),
                Text('Completed on ${AppFormatters.dateStr(wo.date)}',
                    style: AppTextStyles.bodySmall
                        .copyWith(color: AppColors.success)),
              ],
            ),
        ],
      ),
    );
  }
}

// ─── Work Order Sheet (wizard) ────────────────────────────────────────────────
class _WorkOrderSheet extends ConsumerStatefulWidget {
  const _WorkOrderSheet();

  @override
  ConsumerState<_WorkOrderSheet> createState() => _WorkOrderSheetState();
}

class _WorkOrderSheetState extends ConsumerState<_WorkOrderSheet> {
  int _step = 0;
  String? _boatId;
  final _titleCtrl = TextEditingController();
  final _faultCtrl = TextEditingController();
  final _mechanicCtrl = TextEditingController(text: 'Fundi Rashidi (Mwanza Marine Workshop)');
  final _laborCtrl = TextEditingController(text: '80000');
  final _otherCtrl = TextEditingController(text: '0');
  final _notesCtrl = TextEditingController();
  String _arrangement = 'Company-paid';
  String _status = 'Reported';
  List<_PartEntry> _selectedParts = [];

  @override
  void dispose() {
    _titleCtrl.dispose();
    _faultCtrl.dispose();
    _mechanicCtrl.dispose();
    _laborCtrl.dispose();
    _otherCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  double get _partsCost =>
      _selectedParts.fold(0.0, (s, p) => s + p.cost * p.qty);
  double get _laborCost => double.tryParse(_laborCtrl.text) ?? 0;
  double get _otherCostVal => double.tryParse(_otherCtrl.text) ?? 0;
  double get _totalCost => _partsCost + _laborCost + _otherCostVal;

  @override
  Widget build(BuildContext context) {
    final data = ref.watch(branchDataProvider);
    if (_boatId == null && data.boats.isNotEmpty) _boatId = data.boats.first.id;

    final boat = _boatId != null
        ? data.boats.firstWhere((b) => b.id == _boatId,
            orElse: () => data.boats.first)
        : null;

    final ownerSup = boat?.ownerId != null && boat!.ownerId != 'company'
        ? data.suppliers.firstWhere((s) => s.id == boat.ownerId,
            orElse: () => Supplier(no: '', name: '—', phone: '', site: '', cat: ''))
        : null;

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
              const BottomSheetHeader(
                  title: 'New Work Order',
                  subtitle: 'Fleet maintenance & repair management'),
              const SizedBox(height: 16),

              StepProgressBar(
                steps: const ['Vessel', 'Details', 'Parts & Cost'],
                currentStep: _step,
              ),
              const SizedBox(height: 20),

              // ── Step 0: Vessel selection ─────────────────────────────
              if (_step == 0) ...[
                FieldWrapper(
                  label: 'Select Vessel',
                  child: DropdownButtonFormField<String>(
                    value: _boatId,
                    onChanged: (v) => setState(() => _boatId = v),
                    items: data.boats.map((b) {
                      final statusColor = b.status == 'Operational'
                          ? AppColors.success
                          : AppColors.warning;
                      return DropdownMenuItem(
                        value: b.id,
                        child: Row(
                          children: [
                            Icon(Icons.directions_boat, color: statusColor, size: 16),
                            const SizedBox(width: 8),
                            Text('${b.name} (${b.regNo})',
                                style: AppTextStyles.bodyMedium,
                                overflow: TextOverflow.ellipsis),
                          ],
                        ),
                      );
                    }).toList(),
                    decoration: const InputDecoration(),
                  ),
                ),

                if (boat != null) ...[
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.primarySurface,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: AppColors.primary.withAlpha(26),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.directions_boat_rounded,
                                  color: AppColors.primary, size: 26),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(boat.name, style: AppTextStyles.headlineSmall.copyWith(color: AppColors.primary)),
                                  Text('${boat.regNo} · ${boat.boatType}', style: AppTextStyles.bodySmall),
                                  Text('Captain: ${boat.captain}', style: AppTextStyles.caption),
                                ],
                              ),
                            ),
                            AppBadge(
                              label: boat.status,
                              variant: boat.status == 'Operational'
                                  ? BadgeVariant.green
                                  : BadgeVariant.amber,
                            ),
                          ],
                        ),
                        if (ownerSup != null) ...[
                          const Divider(height: 14),
                          Row(
                            children: [
                              const Icon(Icons.person_outline, size: 14, color: AppColors.grey400),
                              const SizedBox(width: 6),
                              Text('Owner: ${ownerSup.name} (${ownerSup.no})',
                                  style: AppTextStyles.bodySmall),
                            ],
                          ),
                        ],
                        const Divider(height: 14),
                        Row(
                          children: [
                            const Icon(Icons.settings_outlined, size: 14, color: AppColors.grey400),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(boat.engine, style: AppTextStyles.bodySmall),
                            ),
                            Text(
                              '${boat.engineHours.toStringAsFixed(0)} hrs',
                              style: AppTextStyles.bodySmall.copyWith(
                                  color: boat.engineHours > 500 ? AppColors.warning : AppColors.grey500),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 20),
                Row(
                  children: [
                    OutlinedButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Cancel')),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _boatId != null ? () => setState(() => _step = 1) : null,
                        icon: const Icon(Icons.arrow_forward, size: 18),
                        label: const Text('Next: Fault Details'),
                      ),
                    ),
                  ],
                ),
              ],

              // ── Step 1: Title, fault, mechanic, arrangement ──────────
              if (_step == 1) ...[
                FieldWrapper(
                  label: 'Work Order Title',
                  child: TextField(
                    controller: _titleCtrl,
                    decoration: const InputDecoration(
                        hintText: 'e.g. Engine service & propeller replacement'),
                  ),
                ),
                const SizedBox(height: 12),

                FieldWrapper(
                  label: 'Fault Description',
                  child: TextField(
                    controller: _faultCtrl,
                    maxLines: 3,
                    decoration: const InputDecoration(
                        hintText: 'Describe the fault or scheduled maintenance…'),
                  ),
                ),
                const SizedBox(height: 12),

                FieldWrapper(
                  label: 'Mechanic / Workshop',
                  child: TextField(
                    controller: _mechanicCtrl,
                    decoration: const InputDecoration(
                        hintText: 'Fundi Rashidi (Mwanza Marine Workshop)'),
                  ),
                ),
                const SizedBox(height: 12),

                FieldWrapper(
                  label: 'Work Arrangement',
                  child: DropdownButtonFormField<String>(
                    value: _arrangement,
                    onChanged: (v) => setState(() => _arrangement = v!),
                    items: [
                      'Company-paid',
                      'Company-assisted (Deduct from fish)',
                      'Fisherman-paid (Credit)',
                    ].map((a) => DropdownMenuItem(
                        value: a, child: Text(a, style: AppTextStyles.bodyMedium, overflow: TextOverflow.ellipsis))).toList(),
                    decoration: const InputDecoration(),
                  ),
                ),
                const SizedBox(height: 12),

                FieldWrapper(
                  label: 'Initial Status',
                  child: DropdownButtonFormField<String>(
                    value: _status,
                    onChanged: (v) => setState(() => _status = v!),
                    items: ['Reported', 'In Progress', 'Completed']
                        .map((s) => DropdownMenuItem(
                            value: s, child: Text(s, style: AppTextStyles.bodyMedium)))
                        .toList(),
                    decoration: const InputDecoration(),
                  ),
                ),
                const SizedBox(height: 12),

                FieldWrapper(
                  label: 'Notes (optional)',
                  child: TextField(
                    controller: _notesCtrl,
                    maxLines: 2,
                    decoration: const InputDecoration(hintText: 'Any additional notes…'),
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
                        onPressed: _titleCtrl.text.isNotEmpty
                            ? () => setState(() => _step = 2)
                            : null,
                        icon: const Icon(Icons.arrow_forward, size: 18),
                        label: const Text('Next: Parts & Cost'),
                      ),
                    ),
                  ],
                ),
              ],

              // ── Step 2: Parts & Cost ─────────────────────────────────
              if (_step == 2) ...[
                Text('Spare Parts Used', style: AppTextStyles.headlineSmall),
                const SizedBox(height: 10),

                // Part selector
                if (data.spareParts.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.grey50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.grey200),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Select from inventory:', style: AppTextStyles.labelLarge),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 6,
                          children: data.spareParts.map((p) {
                            final alreadyAdded =
                                _selectedParts.any((e) => e.partId == p.id);
                            return GestureDetector(
                              onTap: () {
                                if (!alreadyAdded) {
                                  setState(() => _selectedParts.add(_PartEntry(
                                    partId: p.id,
                                    name: p.name,
                                    qty: 1,
                                    cost: p.sellPrice,
                                    unit: p.unit,
                                  )));
                                }
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: alreadyAdded
                                      ? AppColors.primarySurface
                                      : Colors.white,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: alreadyAdded
                                        ? AppColors.primary
                                        : AppColors.grey200,
                                  ),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      p.name.length > 22
                                          ? '${p.name.substring(0, 22)}…'
                                          : p.name,
                                      style: AppTextStyles.bodySmall.copyWith(
                                        color: alreadyAdded
                                            ? AppColors.primary
                                            : AppColors.grey700,
                                        fontWeight: alreadyAdded
                                            ? FontWeight.w600
                                            : FontWeight.w400,
                                      ),
                                    ),
                                    Text(
                                      'Stock: ${p.stock} ${p.unit} · TZS ${AppFormatters.num(p.sellPrice)}',
                                      style: AppTextStyles.caption,
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ],
                    ),
                  )
                else
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.warningLight,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text(
                      'No spare parts in inventory. Add parts in the Spare Parts tab.',
                      style: TextStyle(color: AppColors.grey700, fontSize: 12),
                    ),
                  ),

                // Selected parts list
                if (_selectedParts.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text('Selected Parts:', style: AppTextStyles.labelLarge),
                  const SizedBox(height: 6),
                  ..._selectedParts.asMap().entries.map((e) {
                    final entry = e.value;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 6),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppColors.primarySurface,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.primary.withAlpha(77)),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(entry.name,
                                style: AppTextStyles.bodyMedium
                                    .copyWith(color: AppColors.primary)),
                          ),
                          // Qty stepper
                          GestureDetector(
                            onTap: () => setState(() {
                              if (entry.qty > 1) _selectedParts[e.key].qty--;
                            }),
                            child: Container(
                              width: 26,
                              height: 26,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: AppColors.grey200),
                              ),
                              child: const Icon(Icons.remove, size: 14),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 10),
                            child: Text('${entry.qty}',
                                style: AppTextStyles.titleMedium),
                          ),
                          GestureDetector(
                            onTap: () =>
                                setState(() => _selectedParts[e.key].qty++),
                            child: Container(
                              width: 26,
                              height: 26,
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Icon(Icons.add, size: 14, color: Colors.white),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Text(
                            AppFormatters.tzs(entry.cost * entry.qty),
                            style: AppTextStyles.bodyMedium
                                .copyWith(color: AppColors.primary),
                          ),
                          const SizedBox(width: 6),
                          GestureDetector(
                            onTap: () => setState(
                                () => _selectedParts.removeAt(e.key)),
                            child: const Icon(Icons.close,
                                size: 16, color: AppColors.danger),
                          ),
                        ],
                      ),
                    );
                  }),
                ],

                const SizedBox(height: 14),

                // Labour & other costs
                Row(
                  children: [
                    Expanded(
                      child: FieldWrapper(
                        label: 'Labour Cost (TZS)',
                        child: TextFormField(
                          controller: _laborCtrl,
                          keyboardType: TextInputType.number,
                          onChanged: (_) => setState(() {}),
                          decoration: const InputDecoration(hintText: '80000'),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: FieldWrapper(
                        label: 'Other Cost (TZS)',
                        child: TextFormField(
                          controller: _otherCtrl,
                          keyboardType: TextInputType.number,
                          onChanged: (_) => setState(() {}),
                          decoration: const InputDecoration(hintText: '0'),
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 14),

                // Total
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF4C1D95), Color(0xFF7C3AED)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Total Work Order Cost',
                              style: TextStyle(color: Colors.white60, fontSize: 11)),
                          Text(
                            AppFormatters.tzs(_totalCost),
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 22,
                                fontWeight: FontWeight.w800),
                          ),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            'Parts: ${AppFormatters.tzsShort(_partsCost)}',
                            style: const TextStyle(color: Colors.white70, fontSize: 11),
                          ),
                          Text(
                            'Labour: ${AppFormatters.tzsShort(_laborCost)}',
                            style: const TextStyle(color: Colors.white70, fontSize: 11),
                          ),
                        ],
                      ),
                    ],
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
                        onPressed: _boatId != null
                            ? () async {
                                final data = ref.read(branchDataProvider);
                                final boat = data.boats.firstWhere(
                                    (b) => b.id == _boatId);
                                final supId = boat.ownerId != 'company'
                                    ? boat.ownerId
                                    : 'company';

                                await ref
                                    .read(branchDataProvider.notifier)
                                    .addWorkOrder(
                                      boatId: _boatId!,
                                      supId: supId,
                                      title: _titleCtrl.text.trim(),
                                      fault: _faultCtrl.text.trim(),
                                      mechanic: _mechanicCtrl.text.trim(),
                                      arrangement: _arrangement,
                                      parts: _selectedParts
                                          .map((p) => PartUsed(
                                                partId: p.partId,
                                                name: p.name,
                                                qty: p.qty,
                                                cost: p.cost * p.qty,
                                              ))
                                          .toList(),
                                      partsCost: _partsCost,
                                      laborCost: _laborCost,
                                      otherCost: _otherCostVal,
                                      notes: _notesCtrl.text.trim(),
                                      status: _status,
                                    );

                                if (context.mounted) {
                                  Navigator.pop(context);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Work order created successfully!'),
                                      backgroundColor: AppColors.success,
                                      behavior: SnackBarBehavior.floating,
                                    ),
                                  );
                                }
                              }
                            : null,
                        icon: const Icon(Icons.save_outlined, size: 18),
                        label: const Text('Create Work Order'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF7C3AED),
                        ),
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

class _PartEntry {
  final String partId;
  final String name;
  int qty;
  final double cost;
  final String unit;

  _PartEntry({
    required this.partId,
    required this.name,
    required this.qty,
    required this.cost,
    required this.unit,
  });
}

// ─── Boat Registry Tab ────────────────────────────────────────────────────────
class _BoatRegistryTab extends StatelessWidget {
  final BranchData data;
  final VoidCallback onAdd;
  final void Function(String boatId, String status) onStatusChange;

  const _BoatRegistryTab({
    required this.data,
    required this.onAdd,
    required this.onStatusChange,
  });

  @override
  Widget build(BuildContext context) {
    final operational = data.boats.where((b) => b.status == 'Operational').length;
    final underMaint = data.boats.where((b) => b.status == 'Under Maintenance').length;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Fleet overview
        Row(
          children: [
            Expanded(
              child: _FleetStatCard(
                icon: Icons.directions_boat_rounded,
                label: 'Total Fleet',
                value: '${data.boats.length}',
                color: AppColors.primary,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _FleetStatCard(
                icon: Icons.check_circle_rounded,
                label: 'Operational',
                value: '$operational',
                color: AppColors.success,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _FleetStatCard(
                icon: Icons.build_rounded,
                label: 'In Repair',
                value: '$underMaint',
                color: underMaint > 0 ? AppColors.warning : AppColors.grey400,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        if (data.boats.isEmpty)
          EmptyState(
            icon: Icons.directions_boat_outlined,
            title: 'No Boats Registered',
            subtitle: 'Add fishing vessels to track maintenance',
            actionLabel: 'Add Boat',
            onAction: onAdd,
          )
        else
          ...data.boats.asMap().entries.map((e) {
            final boat = e.value;
            final openWOs = data.maintenanceOrders
                .where((w) => w.boatId == boat.id && w.status != 'Completed')
                .length;
            final ownerSup = boat.ownerId != 'company'
                ? data.suppliers.firstWhere(
                    (s) => s.id == boat.ownerId,
                    orElse: () =>
                        Supplier(no: '', name: 'Company', phone: '', site: '', cat: ''),
                  )
                : null;

            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: AppCard(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: boat.status == 'Operational'
                                ? AppColors.successLight
                                : AppColors.warningLight,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(
                            Icons.directions_boat_rounded,
                            color: boat.status == 'Operational'
                                ? AppColors.success
                                : AppColors.warning,
                            size: 26,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(boat.name, style: AppTextStyles.headlineSmall),
                              Text('${boat.regNo} · ${boat.boatType}',
                                  style: AppTextStyles.bodySmall),
                              Text('Captain: ${boat.captain}',
                                  style: AppTextStyles.caption),
                            ],
                          ),
                        ),
                        AppBadge(
                          label: boat.status,
                          variant: boat.status == 'Operational'
                              ? BadgeVariant.green
                              : BadgeVariant.amber,
                        ),
                      ],
                    ),

                    const Divider(height: 14),

                    Row(
                      children: [
                        const Icon(Icons.settings, size: 14, color: AppColors.grey400),
                        const SizedBox(width: 6),
                        Expanded(
                            child: Text(boat.engine, style: AppTextStyles.bodySmall)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.speed, size: 14, color: AppColors.grey400),
                        const SizedBox(width: 6),
                        Text(
                          '${boat.engineHours.toStringAsFixed(0)} engine hrs',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: boat.engineHours > 500
                                ? AppColors.warning
                                : AppColors.grey500,
                          ),
                        ),
                        const Spacer(),
                        Text('Last service: ${AppFormatters.dateStr(boat.lastService)}',
                            style: AppTextStyles.caption),
                      ],
                    ),

                    if (ownerSup != null) ...[
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.person_outline,
                              size: 14, color: AppColors.grey400),
                          const SizedBox(width: 6),
                          Text('${ownerSup.name} · ${boat.ownerType}',
                              style: AppTextStyles.bodySmall),
                        ],
                      ),
                    ],

                    if (boat.crewMembers.isNotEmpty) ...[
                      const Divider(height: 12),
                      Text('Crew (${boat.crewMembers.length})',
                          style: AppTextStyles.labelLarge),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 6,
                        runSpacing: 4,
                        children: boat.crewMembers
                            .map((c) => Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppColors.grey100,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text('${c.name} · ${c.role}',
                                      style: AppTextStyles.caption),
                                ))
                            .toList(),
                      ),
                    ],

                    if (openWOs > 0) ...[
                      const Divider(height: 12),
                      Row(
                        children: [
                          const Icon(Icons.warning_amber,
                              color: AppColors.warning, size: 14),
                          const SizedBox(width: 6),
                          Text(
                            '$openWOs open work order${openWOs > 1 ? 's' : ''}',
                            style: AppTextStyles.bodySmall
                                .copyWith(color: AppColors.warning),
                          ),
                        ],
                      ),
                    ],

                    const Divider(height: 12),

                    // Status toggle
                    Row(
                      children: [
                        if (boat.status != 'Operational')
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: () =>
                                  onStatusChange(boat.id, 'Operational'),
                              icon: const Icon(Icons.check_circle_outline, size: 16),
                              label: const Text('Mark Operational'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.success,
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                textStyle: const TextStyle(fontSize: 12),
                              ),
                            ),
                          )
                        else
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () =>
                                  onStatusChange(boat.id, 'Under Maintenance'),
                              icon: const Icon(Icons.build_outlined, size: 16),
                              label: const Text('Send to Maintenance'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppColors.warning,
                                side: const BorderSide(color: AppColors.warning),
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                textStyle: const TextStyle(fontSize: 12),
                              ),
                            ),
                          ),
                      ],
                    ),
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

// ─── Spare Parts Tab ──────────────────────────────────────────────────────────
class _SparePartsTab extends StatefulWidget {
  final BranchData data;
  final VoidCallback onAdd;

  const _SparePartsTab({required this.data, required this.onAdd});

  @override
  State<_SparePartsTab> createState() => _SparePartsTabState();
}

class _SparePartsTabState extends State<_SparePartsTab> {
  String _category = 'All';
  final _searchCtrl = TextEditingController();
  String _search = '';

  @override
  Widget build(BuildContext context) {
    final categories = <String>{'All'};
    for (final p in widget.data.spareParts) {
      categories.add(p.category);
    }

    final filtered = widget.data.spareParts.where((p) {
      final matchCat = _category == 'All' || p.category == _category;
      final matchSearch = _search.isEmpty ||
          p.name.toLowerCase().contains(_search) ||
          p.partNo.toLowerCase().contains(_search);
      return matchCat && matchSearch;
    }).toList();

    final lowStock = widget.data.spareParts.where((p) => p.isLowStock).length;
    final totalValue =
        widget.data.spareParts.fold(0.0, (s, p) => s + p.stock * p.unitCost);

    return Column(
      children: [
        // Summary
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: Row(
            children: [
              _WoStat(
                  label: 'Total Parts',
                  value: '${widget.data.spareParts.length}',
                  color: AppColors.primary),
              _WoStat(
                  label: 'Low Stock',
                  value: '$lowStock',
                  color: lowStock > 0 ? AppColors.danger : AppColors.success),
              _WoStat(
                  label: 'Inventory Value',
                  value: AppFormatters.tzsShort(totalValue),
                  color: AppColors.warning),
            ],
          ),
        ),

        // Search + filter
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
          child: Column(
            children: [
              AppSearchBar(
                hint: 'Search parts…',
                controller: _searchCtrl,
                onChanged: (v) => setState(() => _search = v.toLowerCase()),
              ),
              const SizedBox(height: 8),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: categories
                      .map((c) => Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: FilterChip(
                              label: Text(c),
                              selected: _category == c,
                              onSelected: (_) => setState(() => _category = c),
                              selectedColor: AppColors.primarySurface,
                              checkmarkColor: AppColors.primary,
                              labelStyle: TextStyle(
                                color: _category == c
                                    ? AppColors.primary
                                    : AppColors.grey600,
                                fontSize: 12,
                                fontWeight: _category == c
                                    ? FontWeight.w600
                                    : FontWeight.w400,
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

        Expanded(
          child: filtered.isEmpty
              ? EmptyState(
                  icon: Icons.inventory_2_outlined,
                  title: 'No Parts Found',
                  subtitle: 'Add marine spare parts to the inventory',
                  actionLabel: 'Add Part',
                  onAction: widget.onAdd,
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(12),
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (_, i) {
                    final p = filtered[i];
                    return _SparePartCard(part: p)
                        .animate()
                        .fadeIn(delay: (i * 30).ms);
                  },
                ),
        ),
      ],
    );
  }
}

class _SparePartCard extends StatelessWidget {
  final SparePart part;
  const _SparePartCard({required this.part});

  @override
  Widget build(BuildContext context) {
    final isLow = part.isLowStock;
    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: isLow ? AppColors.dangerLight : AppColors.primarySurface,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              _categoryIcon(part.category),
              color: isLow ? AppColors.danger : AppColors.primary,
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(part.name, style: AppTextStyles.titleMedium),
                Text('${part.partNo} · ${part.category}',
                    style: AppTextStyles.caption),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: isLow ? AppColors.dangerLight : AppColors.successLight,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        '${part.stock} ${part.unit}',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: isLow ? AppColors.danger : AppColors.success,
                        ),
                      ),
                    ),
                    if (isLow) ...[
                      const SizedBox(width: 4),
                      const Icon(Icons.warning_amber, size: 12, color: AppColors.danger),
                      const Text(' Low Stock',
                          style: TextStyle(
                              fontSize: 10,
                              color: AppColors.danger,
                              fontWeight: FontWeight.w600)),
                    ],
                  ],
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(AppFormatters.tzs(part.sellPrice),
                  style: AppTextStyles.titleMedium),
              Text('Cost: ${AppFormatters.tzs(part.unitCost)}',
                  style: AppTextStyles.caption),
              Text('Min: ${part.minStock} ${part.unit}',
                  style: AppTextStyles.caption),
            ],
          ),
        ],
      ),
    );
  }

  IconData _categoryIcon(String cat) {
    switch (cat) {
      case 'Ignition': return Icons.bolt;
      case 'Lubricants': return Icons.opacity;
      case 'Propulsion': return Icons.settings_input_component;
      case 'Electrical': return Icons.electrical_services;
      case 'Rigging': return Icons.anchor;
      case 'Hull & Body': return Icons.directions_boat;
      case 'Cooling': return Icons.ac_unit;
      default: return Icons.construction;
    }
  }
}

// ─── Engine Hours Tab ─────────────────────────────────────────────────────────
class _EngineHoursTab extends StatelessWidget {
  final BranchData data;
  const _EngineHoursTab({required this.data});

  @override
  Widget build(BuildContext context) {
    if (data.boats.isEmpty) {
      return const EmptyState(
        icon: Icons.speed_outlined,
        title: 'No Fleet Data',
        subtitle: 'Register boats to track engine hours',
      );
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Engine Hour Tracker', style: AppTextStyles.headlineSmall),
        const SizedBox(height: 4),
        Text('Service schedule: Every 250 hours', style: AppTextStyles.bodySmall),
        const SizedBox(height: 14),

        ...data.boats.asMap().entries.map((e) {
          final boat = e.value;
          final hoursUntilService = 250 - (boat.engineHours % 250);
          final overdue = hoursUntilService < 0;
          final serviceColor = hoursUntilService < 20
              ? AppColors.danger
              : hoursUntilService < 50
                  ? AppColors.warning
                  : AppColors.success;
          final progress = ((boat.engineHours % 250) / 250).clamp(0.0, 1.0);

          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: AppCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: serviceColor.withAlpha(26),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(Icons.speed, color: serviceColor, size: 22),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(boat.name, style: AppTextStyles.headlineSmall),
                            Text('${boat.regNo} · ${boat.engine}',
                                style: AppTextStyles.caption),
                          ],
                        ),
                      ),
                      AppBadge(
                        label: boat.status,
                        variant: boat.status == 'Operational'
                            ? BadgeVariant.green
                            : BadgeVariant.amber,
                      ),
                    ],
                  ),
                  const Divider(height: 14),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Total Engine Hours',
                              style: AppTextStyles.caption),
                          Text(
                            '${boat.engineHours.toStringAsFixed(0)} hrs',
                            style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                                color: serviceColor),
                          ),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text('Last Service', style: AppTextStyles.caption),
                          Text(
                            AppFormatters.dateStr(boat.lastService),
                            style: AppTextStyles.titleMedium,
                          ),
                        ],
                      ),
                    ],
                  ),

                  const SizedBox(height: 10),

                  // Progress bar to next service
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Progress to next service', style: AppTextStyles.caption),
                          Text(
                            overdue
                                ? 'OVERDUE'
                                : '${hoursUntilService.toStringAsFixed(0)} hrs to service',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: serviceColor,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: LinearProgressIndicator(
                          value: progress,
                          minHeight: 10,
                          backgroundColor: AppColors.grey100,
                          valueColor: AlwaysStoppedAnimation<Color>(serviceColor),
                        ),
                      ),
                    ],
                  ),

                  if (overdue || hoursUntilService < 20) ...[
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.dangerLight,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.danger.withAlpha(77)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.warning_rounded,
                              color: AppColors.danger, size: 16),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              overdue
                                  ? 'Service OVERDUE — schedule maintenance immediately'
                                  : 'Service due within ${hoursUntilService.toStringAsFixed(0)} hours',
                              style: AppTextStyles.bodySmall
                                  .copyWith(color: AppColors.danger),
                            ),
                          ),
                        ],
                      ),
                    ),
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

// ─── Helper Widgets ───────────────────────────────────────────────────────────
class _AppBarBadge extends StatelessWidget {
  final String label;
  final Color color;
  const _AppBarBadge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(AppRadius.full),
      ),
      child: Text(label,
          style: const TextStyle(
              color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }
}

class _WoStat extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _WoStat({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(value,
              style: TextStyle(
                  fontSize: 16, fontWeight: FontWeight.w800, color: color)),
          Text(label,
              style: AppTextStyles.caption, textAlign: TextAlign.center),
        ],
      ),
    );
  }
}

class _CostPill extends StatelessWidget {
  final String label;
  final double value;
  final bool highlight;
  const _CostPill({required this.label, required this.value, this.highlight = false});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(label, style: AppTextStyles.caption),
        Text(
          AppFormatters.tzsShort(value),
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: highlight ? const Color(0xFF7C3AED) : AppColors.grey700,
          ),
        ),
      ],
    );
  }
}

class _FleetStatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  const _FleetStatCard(
      {required this.icon,
      required this.label,
      required this.value,
      required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withAlpha(51)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 4),
          Text(value,
              style: TextStyle(
                  fontSize: 18, fontWeight: FontWeight.w800, color: color)),
          Text(label,
              style: AppTextStyles.caption, textAlign: TextAlign.center),
        ],
      ),
    );
  }
}





