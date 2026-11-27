import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme.dart';
import '../../core/formatters.dart';
import '../../models/models.dart';
import '../../providers/app_state.dart';
import '../../widgets/app_widgets.dart';
import '../dashboard/main_shell.dart';

class TransportScreen extends ConsumerStatefulWidget {
  const TransportScreen({super.key});

  @override
  ConsumerState<TransportScreen> createState() => _TransportScreenState();
}

class _TransportScreenState extends ConsumerState<TransportScreen>
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
    final trips = data.trips;
    final totalTrCost = trips.fold(0.0, (s, t) => s + t.cost);
    final totalKg = data.batches.fold(0.0, (s, b) => s + b.kg);
    final costPerKg = totalKg > 0 ? totalTrCost / totalKg : 0.0;
    final delivered = data.sales.where((s) => s.dis.st == 'Delivered').length;
    final inTransit = data.sales.where((s) => s.dis.st != 'Delivered' && s.dis.st != 'Pending Dispatch').length;

    return MainShell(
      selectedIndex: 4,
      child: Scaffold(
        backgroundColor: AppColors.grey50,
        appBar: AppBar(
          title: const Text('Transport & Delivery'),
          bottom: TabBar(
            controller: _tabs,
            tabs: const [
              Tab(text: 'Dispatches'),
              Tab(text: 'Trip Cost Journal'),
            ],
          ),
        ),
        body: Column(
          children: [
            // ── KPI summary strip ───────────────────────────────────────
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              child: Row(
                children: [
                  _KpiChip(
                    icon: Icons.local_shipping_rounded,
                    label: 'Transport Cost',
                    value: AppFormatters.tzsShort(totalTrCost),
                    color: AppColors.primary,
                  ),
                  _KpiChip(
                    icon: Icons.scale_rounded,
                    label: 'Cost / kg',
                    value: AppFormatters.tzsShort(costPerKg),
                    color: const Color(0xFF7C3AED),
                  ),
                  _KpiChip(
                    icon: Icons.check_circle_rounded,
                    label: 'Delivered',
                    value: '$delivered',
                    color: AppColors.success,
                  ),
                  _KpiChip(
                    icon: Icons.sync_rounded,
                    label: 'In Transit',
                    value: '$inTransit',
                    color: AppColors.warning,
                  ),
                ],
              ),
            ),
            const Divider(height: 1),

            // ── Cold chain fleet info banner ────────────────────────────
            _ColdFleetBanner(),

            Expanded(
              child: TabBarView(
                controller: _tabs,
                children: [
                  // Tab 0 – Dispatches
                  _DispatchesTab(
                    data: data,
                    onUpdateDispatch: (saleId, veh, drv, status, temp) =>
                        ref.read(branchDataProvider.notifier).dispatchSale(
                          saleId: saleId,
                          veh: veh,
                          drv: drv,
                          status: status,
                          temp: temp,
                        ),
                  ),
                  // Tab 1 – Trip Cost Journal
                  _TripJournalTab(data: data),
                ],
              ),
            ),
          ],
        ),
        floatingActionButton: AnimatedBuilder(
          animation: _tabs,
          builder: (_, __) => _tabs.index == 1
              ? FloatingActionButton.extended(
                  onPressed: () => _showLogTripSheet(context),
                  backgroundColor: AppColors.primary,
                  icon: const Icon(Icons.add_road_rounded, color: Colors.white),
                  label: const Text('Log Trip Cost',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                )
              : const SizedBox.shrink(),
        ),
      ),
    );
  }

  void _showLogTripSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _LogTripSheet(),
    );
  }
}

// ─── Cold Fleet Banner ────────────────────────────────────────────────────────
class _ColdFleetBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF1E3A5F)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              width: 48, height: 48,
              decoration: BoxDecoration(
                color: Colors.white.withAlpha(26),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.ac_unit_rounded, color: Color(0xFF38BDF8), size: 26),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('KYC Cold Chain Fleet',
                      style: TextStyle(color: Colors.white, fontSize: 13,
                          fontWeight: FontWeight.w700)),
                  const Text('T 342 EDK · T 819 DXZ · 1–3 Ton Insulated',
                      style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: AppColors.success.withAlpha(26),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.success.withAlpha(77)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.thermostat, color: AppColors.success, size: 12),
                  SizedBox(width: 4),
                  Text('0–2.5°C', style: TextStyle(color: AppColors.success,
                      fontSize: 11, fontWeight: FontWeight.w700)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Dispatches Tab ───────────────────────────────────────────────────────────
class _DispatchesTab extends StatelessWidget {
  final BranchData data;
  final Future<void> Function(String saleId, String veh, String drv,
      String status, String temp) onUpdateDispatch;

  const _DispatchesTab({required this.data, required this.onUpdateDispatch});

  @override
  Widget build(BuildContext context) {
    final sales = data.sales.reversed.toList();

    if (sales.isEmpty) {
      return const EmptyState(
        icon: Icons.local_shipping_outlined,
        title: 'No Dispatches',
        subtitle: 'Sales dispatches will appear here once you record a sale',
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
      itemCount: sales.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (_, i) {
        final sale = sales[i];
        final cusMatches = data.customers.where((c) => c.id == sale.cus).toList();
        final cusName = cusMatches.isNotEmpty ? cusMatches.first.name : '—';
        return _DispatchCard(
          sale: sale,
          cusName: cusName,
          onUpdate: () => _showDispatchSheet(context, sale, cusName),
        ).animate().fadeIn(delay: (i * 40).ms);
      },
    );
  }

  void _showDispatchSheet(BuildContext context, Sale sale, String cusName) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _UpdateDispatchSheet(
        sale: sale,
        cusName: cusName,
        onSave: onUpdateDispatch,
      ),
    );
  }
}

// ─── Dispatch Card ────────────────────────────────────────────────────────────
class _DispatchCard extends StatelessWidget {
  final Sale sale;
  final String cusName;
  final VoidCallback onUpdate;

  const _DispatchCard({
    required this.sale,
    required this.cusName,
    required this.onUpdate,
  });

  @override
  Widget build(BuildContext context) {
    final st = sale.dis.st;
    final isDelivered = st == 'Delivered';
    final isInTransit = st == 'In transit' || st == 'Loading at Chiller';
    final isPending = !isDelivered && !isInTransit;

    final statusColor = isDelivered
        ? AppColors.success
        : isInTransit
            ? AppColors.warning
            : AppColors.grey400;
    final statusVariant = isDelivered
        ? BadgeVariant.green
        : isInTransit
            ? BadgeVariant.amber
            : BadgeVariant.grey;

    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(
                  color: statusColor.withAlpha(20),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(Icons.local_shipping_rounded,
                    color: statusColor, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(sale.no,
                        style: AppTextStyles.titleMedium
                            .copyWith(color: AppColors.primary)),
                    Text('${sale.sp} · Grade ${sale.grade}',
                        style: AppTextStyles.headlineSmall),
                    Text(cusName, style: AppTextStyles.bodySmall),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  AppBadge(label: st, variant: statusVariant),
                  const SizedBox(height: 4),
                  Text(AppFormatters.kg(sale.kg),
                      style: AppTextStyles.titleMedium),
                ],
              ),
            ],
          ),

          const Divider(height: 14),

          // Vehicle & driver
          if (sale.dis.veh.isNotEmpty) ...[
            Row(
              children: [
                const Icon(Icons.directions_car_rounded,
                    size: 14, color: AppColors.grey400),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(sale.dis.veh,
                      style: AppTextStyles.bodySmall,
                      overflow: TextOverflow.ellipsis),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.person_outline,
                    size: 14, color: AppColors.grey400),
                const SizedBox(width: 6),
                Text(sale.dis.drv.isNotEmpty ? sale.dis.drv : '—',
                    style: AppTextStyles.bodySmall),
                if (sale.dis.temp.isNotEmpty) ...[
                  const Spacer(),
                  const Icon(Icons.thermostat, size: 13, color: AppColors.accent),
                  const SizedBox(width: 3),
                  Text(sale.dis.temp,
                      style: AppTextStyles.bodySmall
                          .copyWith(color: AppColors.accent)),
                ],
              ],
            ),
          ] else
            Text('Vehicle not yet assigned',
                style: AppTextStyles.bodySmall
                    .copyWith(color: AppColors.grey400, fontStyle: FontStyle.italic)),

          const SizedBox(height: 2),
          Text(AppFormatters.dateStr(sale.date), style: AppTextStyles.caption),

          const Divider(height: 14),

          // Action button
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: onUpdate,
              icon: const Icon(Icons.edit_road_rounded, size: 16),
              label: Text(isPending ? 'Assign Vehicle & Dispatch' : 'Update Dispatch Status'),
              style: OutlinedButton.styleFrom(
                foregroundColor: statusColor,
                side: BorderSide(color: statusColor),
                padding: const EdgeInsets.symmetric(vertical: 9),
                textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Update Dispatch Sheet ────────────────────────────────────────────────────
class _UpdateDispatchSheet extends StatefulWidget {
  final Sale sale;
  final String cusName;
  final Future<void> Function(String, String, String, String, String) onSave;

  const _UpdateDispatchSheet({
    required this.sale,
    required this.cusName,
    required this.onSave,
  });

  @override
  State<_UpdateDispatchSheet> createState() => _UpdateDispatchSheetState();
}

class _UpdateDispatchSheetState extends State<_UpdateDispatchSheet> {
  late TextEditingController _vehCtrl;
  late TextEditingController _drvCtrl;
  late TextEditingController _tempCtrl;
  late String _status;
  bool _saving = false;

  static const _statuses = [
    'Loading at Chiller',
    'In transit',
    'Delivered',
  ];
  static const _vehicles = [
    'T 342 EDK (KYC 3-Ton Refrigerated)',
    'T 819 DXZ (KYC 1-Ton Insulated)',
    'T 230 DKN (KYC 3-Ton Refrigerated)',
    'Other (enter below)',
  ];

  @override
  void initState() {
    super.initState();
    _vehCtrl = TextEditingController(
        text: widget.sale.dis.veh.isNotEmpty
            ? widget.sale.dis.veh
            : 'T 342 EDK (KYC 3-Ton Refrigerated)');
    _drvCtrl = TextEditingController(
        text: widget.sale.dis.drv.isNotEmpty
            ? widget.sale.dis.drv
            : 'Juma Ramadhani');
    _tempCtrl = TextEditingController(
        text: widget.sale.dis.temp.isNotEmpty ? widget.sale.dis.temp : '1.8°C');
    _status = widget.sale.dis.st == 'Pending Dispatch'
        ? 'In transit'
        : widget.sale.dis.st;
  }

  @override
  void dispose() {
    _vehCtrl.dispose();
    _drvCtrl.dispose();
    _tempCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
              BottomSheetHeader(
                title: 'Update Dispatch: ${widget.sale.no}',
                subtitle:
                    '${widget.cusName} · ${widget.sale.sp} ${AppFormatters.kg(widget.sale.kg)}',
              ),
              const SizedBox(height: 16),

              // Status picker
              FieldWrapper(
                label: 'Delivery Status',
                child: Column(
                  children: _statuses.map((s) {
                    final selected = _status == s;
                    Color c = s == 'Delivered'
                        ? AppColors.success
                        : s == 'In transit'
                            ? AppColors.warning
                            : AppColors.primary;
                    return GestureDetector(
                      onTap: () => setState(() => _status = s),
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 6),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 11),
                        decoration: BoxDecoration(
                          color: selected ? c.withAlpha(15) : Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                              color: selected ? c : AppColors.grey200,
                              width: selected ? 1.5 : 1),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              s == 'Delivered'
                                  ? Icons.check_circle_rounded
                                  : s == 'In transit'
                                      ? Icons.sync_rounded
                                      : Icons.inventory_2_rounded,
                              color: selected ? c : AppColors.grey400,
                              size: 18,
                            ),
                            const SizedBox(width: 10),
                            Text(s,
                                style: TextStyle(
                                    fontWeight: selected
                                        ? FontWeight.w600
                                        : FontWeight.w400,
                                    color: selected ? c : AppColors.grey700,
                                    fontSize: 14)),
                            if (selected) ...[
                              const Spacer(),
                              Icon(Icons.check, color: c, size: 16),
                            ],
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 14),

              // Vehicle quick-select chips
              FieldWrapper(
                label: 'Vehicle Registration',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      children: _vehicles.take(3).map((v) {
                        final selected = _vehCtrl.text == v;
                        return GestureDetector(
                          onTap: () => setState(() => _vehCtrl.text = v),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: selected
                                  ? AppColors.primarySurface
                                  : AppColors.grey50,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                  color: selected
                                      ? AppColors.primary
                                      : AppColors.grey200),
                            ),
                            child: Text(
                              v.split(' ').take(2).join(' '),
                              style: TextStyle(
                                  fontSize: 12,
                                  color: selected
                                      ? AppColors.primary
                                      : AppColors.grey700,
                                  fontWeight: selected
                                      ? FontWeight.w600
                                      : FontWeight.w400),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _vehCtrl,
                      decoration: const InputDecoration(
                          hintText: 'T 342 EDK (KYC 3-Ton Refrigerated)'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              FieldWrapper(
                label: 'Driver Name & Contact',
                child: TextField(
                  controller: _drvCtrl,
                  decoration: const InputDecoration(
                      hintText: 'Juma Ramadhani · 0754 XXX XXX'),
                ),
              ),
              const SizedBox(height: 12),

              FieldWrapper(
                label: 'Transit Temperature',
                child: TextField(
                  controller: _tempCtrl,
                  decoration: const InputDecoration(
                    hintText: '1.8°C',
                    prefixIcon:
                        Icon(Icons.thermostat, color: AppColors.accent),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              PrimaryButton(
                label: 'Save Dispatch Details',
                icon: Icons.save_rounded,
                isLoading: _saving,
                onPressed: () async {
                  setState(() => _saving = true);
                  await widget.onSave(
                    widget.sale.id,
                    _vehCtrl.text.trim(),
                    _drvCtrl.text.trim(),
                    _status,
                    _tempCtrl.text.trim(),
                  );
                  setState(() => _saving = false);
                  if (context.mounted) Navigator.pop(context);
                },
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Trip Journal Tab ─────────────────────────────────────────────────────────
class _TripJournalTab extends StatelessWidget {
  final BranchData data;
  const _TripJournalTab({required this.data});

  String _resolveRef(Trip trip) {
    final batch = data.batches.where((b) => b.id == trip.ref).toList();
    if (batch.isNotEmpty) return batch.first.no;
    final sale = data.sales.where((s) => s.id == trip.ref).toList();
    if (sale.isNotEmpty) return sale.first.no;
    return trip.ref.isEmpty ? '—' : trip.ref;
  }

  @override
  Widget build(BuildContext context) {
    final trips = data.trips;

    if (trips.isEmpty) {
      return const EmptyState(
        icon: Icons.route_outlined,
        title: 'No Trip Costs Logged',
        subtitle: 'Use the button below to log a transport run & freight cost',
      );
    }

    // Summary
    final totalCost = trips.fold(0.0, (s, t) => s + t.cost);

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
      children: [
        // Summary card
        Container(
          padding: const EdgeInsets.all(14),
          margin: const EdgeInsets.only(bottom: 14),
          decoration: BoxDecoration(
            gradient: AppColors.primaryGradient,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Row(
            children: [
              const Icon(Icons.receipt_long_rounded,
                  color: Colors.white70, size: 28),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Total Freight Spend',
                        style:
                            TextStyle(color: Colors.white70, fontSize: 11)),
                    Text(AppFormatters.tzs(totalCost),
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.w800)),
                    Text(
                        '${trips.length} trip${trips.length == 1 ? '' : 's'} logged',
                        style: const TextStyle(
                            color: Colors.white60, fontSize: 11)),
                  ],
                ),
              ),
            ],
          ),
        ),

        ...trips.asMap().entries.map((e) {
          final trip = e.value;
          final refLabel = _resolveRef(trip);
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _TripCard(trip: trip, refLabel: refLabel)
                .animate()
                .fadeIn(delay: (e.key * 40).ms),
          );
        }),
      ],
    );
  }
}

// ─── Trip Card ────────────────────────────────────────────────────────────────
class _TripCard extends StatelessWidget {
  final Trip trip;
  final String refLabel;
  const _TripCard({required this.trip, required this.refLabel});

  @override
  Widget build(BuildContext context) {
    final typeColor = trip.type == 'Industry Delivery'
        ? AppColors.primary
        : trip.type == 'Landing Collection'
            ? AppColors.success
            : AppColors.warning;

    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 42, height: 42,
                decoration: BoxDecoration(
                  color: typeColor.withAlpha(20),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(Icons.add_road_rounded, color: typeColor, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(trip.type,
                        style: AppTextStyles.titleMedium
                            .copyWith(color: typeColor)),
                    Text('${trip.from} → ${trip.to}',
                        style: AppTextStyles.bodyMedium,
                        overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
              Text(AppFormatters.tzs(trip.cost),
                  style: AppTextStyles.moneyMedium),
            ],
          ),
          const Divider(height: 12),
          Wrap(
            spacing: 16,
            runSpacing: 6,
            children: [
              _TripMeta(icon: Icons.directions_car_rounded,
                  label: trip.mode.isNotEmpty ? trip.mode : 'KYC Truck'),
              if (trip.veh.isNotEmpty)
                _TripMeta(icon: Icons.pin_rounded, label: trip.veh),
              if (trip.temp.isNotEmpty)
                _TripMeta(icon: Icons.thermostat, label: trip.temp),
              _TripMeta(icon: Icons.link_rounded, label: refLabel),
              _TripMeta(
                  icon: Icons.payment_rounded,
                  label: trip.method.isNotEmpty
                      ? trip.method
                      : 'CRDB / NMB Bank'),
              _TripMeta(icon: Icons.calendar_today_rounded,
                  label: AppFormatters.dateStr(trip.date)),
            ],
          ),
        ],
      ),
    );
  }
}

class _TripMeta extends StatelessWidget {
  final IconData icon;
  final String label;
  const _TripMeta({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: AppColors.grey400),
        const SizedBox(width: 4),
        Text(label, style: AppTextStyles.caption),
      ],
    );
  }
}

// ─── Log Trip Sheet ───────────────────────────────────────────────────────────
class _LogTripSheet extends ConsumerStatefulWidget {
  @override
  ConsumerState<_LogTripSheet> createState() => _LogTripSheetState();
}

class _LogTripSheetState extends ConsumerState<_LogTripSheet> {
  String _type = 'Industry Delivery';
  final _fromCtrl = TextEditingController(text: 'Main Cold Room (0°C to 2°C)');
  final _toCtrl = TextEditingController(text: 'Nyakato Processing Plant');
  final _costCtrl = TextEditingController(text: '180000');
  final _vehCtrl = TextEditingController(text: 'T 342 EDK');
  final _tempCtrl = TextEditingController(text: '1.5°C');
  String _method = 'CRDB / NMB Bank';
  bool _saving = false;

  static const _tripTypes = [
    'Industry Delivery',
    'Landing Collection',
    'Inter-Branch Transfer',
  ];
  static const _methods = [
    'CRDB / NMB Bank',
    'M-Pesa (Mobile Money)',
    'Cash Voucher',
  ];

  @override
  void dispose() {
    _fromCtrl.dispose();
    _toCtrl.dispose();
    _costCtrl.dispose();
    _vehCtrl.dispose();
    _tempCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final data = ref.watch(branchDataProvider);
    final cost = double.tryParse(_costCtrl.text) ?? 0;

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
                title: 'Log Trip Cost',
                subtitle: 'Record freight expense for landed cost accounting',
              ),
              const SizedBox(height: 16),

              // Trip type
              FieldWrapper(
                label: 'Trip Category',
                child: DropdownButtonFormField<String>(
                  value: _type,
                  onChanged: (v) => setState(() {
                    _type = v!;
                    if (_type == 'Landing Collection') {
                      _fromCtrl.text = data.suppliers.isNotEmpty
                          ? data.suppliers.first.site
                          : 'Landing Site';
                      _toCtrl.text = 'Main Cold Room (0°C to 2°C)';
                    } else if (_type == 'Industry Delivery') {
                      _fromCtrl.text = 'Main Cold Room (0°C to 2°C)';
                      _toCtrl.text = data.customers.isNotEmpty
                          ? data.customers.first.name
                          : 'Nyakato Processing Plant';
                    } else {
                      _fromCtrl.text = 'Main Branch';
                      _toCtrl.text = 'Kigoma Branch';
                    }
                  }),
                  items: _tripTypes
                      .map((t) => DropdownMenuItem(
                          value: t,
                          child: Text(t, style: AppTextStyles.bodyMedium)))
                      .toList(),
                  decoration: const InputDecoration(),
                ),
              ),
              const SizedBox(height: 12),

              Row(children: [
                Expanded(
                  child: FieldWrapper(
                    label: 'Origin',
                    child: TextField(controller: _fromCtrl,
                        decoration: const InputDecoration(hintText: 'Cold Room / Landing Site')),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: FieldWrapper(
                    label: 'Destination',
                    child: TextField(controller: _toCtrl,
                        decoration: const InputDecoration(hintText: 'Factory / Branch')),
                  ),
                ),
              ]),
              const SizedBox(height: 12),

              Row(children: [
                Expanded(
                  child: FieldWrapper(
                    label: 'Vehicle Reg.',
                    child: TextField(controller: _vehCtrl,
                        decoration: const InputDecoration(hintText: 'T 342 EDK')),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: FieldWrapper(
                    label: 'Transit Temp.',
                    child: TextField(controller: _tempCtrl,
                        decoration: const InputDecoration(
                            hintText: '1.5°C',
                            prefixIcon: Icon(Icons.thermostat, size: 18))),
                  ),
                ),
              ]),
              const SizedBox(height: 12),

              Row(children: [
                Expanded(
                  child: FieldWrapper(
                    label: 'Trip Cost (TZS)',
                    child: TextField(
                      controller: _costCtrl,
                      keyboardType: TextInputType.number,
                      style: AppTextStyles.headlineSmall,
                      decoration: const InputDecoration(hintText: '180,000'),
                      onChanged: (_) => setState(() {}),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: FieldWrapper(
                    label: 'Payment Method',
                    child: DropdownButtonFormField<String>(
                      value: _method,
                      onChanged: (v) => setState(() => _method = v!),
                      items: _methods
                          .map((m) => DropdownMenuItem(
                              value: m,
                              child: Text(m,
                                  style: AppTextStyles.bodyMedium,
                                  overflow: TextOverflow.ellipsis)))
                          .toList(),
                      decoration: const InputDecoration(),
                    ),
                  ),
                ),
              ]),
              const SizedBox(height: 16),

              if (cost > 0)
                AmountHighlightBox(
                  label: 'Trip Freight Amount',
                  amount: AppFormatters.tzs(cost),
                ),

              const SizedBox(height: 16),

              PrimaryButton(
                label: 'Record Transport Expense',
                icon: Icons.add_road_rounded,
                isLoading: _saving,
                onPressed: cost > 0
                    ? () async {
                        setState(() => _saving = true);
                        await ref.read(branchDataProvider.notifier).addTrip(
                          type: _type,
                          mode: 'KYC Refrigerated Truck',
                          from: _fromCtrl.text.trim(),
                          to: _toCtrl.text.trim(),
                          cost: cost,
                          veh: _vehCtrl.text.trim(),
                          temp: _tempCtrl.text.trim(),
                          method: _method,
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

// ─── KPI Chip ─────────────────────────────────────────────────────────────────
class _KpiChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  const _KpiChip(
      {required this.icon,
      required this.label,
      required this.value,
      required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
        child: Column(
          children: [
            Icon(icon, color: color, size: 18),
            const SizedBox(height: 4),
            Text(value,
                style: TextStyle(
                    fontSize: 13, fontWeight: FontWeight.w800, color: color),
                overflow: TextOverflow.ellipsis),
            Text(label,
                style: AppTextStyles.caption,
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }
}


