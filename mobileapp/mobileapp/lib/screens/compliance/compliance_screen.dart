import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme.dart';
import '../../core/formatters.dart';
import '../../models/models.dart';
import '../../providers/app_state.dart';
import '../../widgets/app_widgets.dart';
import '../dashboard/main_shell.dart';

class ComplianceScreen extends ConsumerStatefulWidget {
  const ComplianceScreen({super.key});

  @override
  ConsumerState<ComplianceScreen> createState() => _ComplianceScreenState();
}

class _ComplianceScreenState extends ConsumerState<ComplianceScreen>
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
    final permits = data.comp;

    final valid       = permits.where((p) => p.computedStatus == 'Valid').length;
    final expiring    = permits.where((p) => p.computedStatus == 'Expiring Soon').length;
    final expired     = permits.where((p) => p.computedStatus == 'Expired').length;

    return MainShell(
      selectedIndex: 4,
      child: Scaffold(
        backgroundColor: AppColors.grey50,
        appBar: AppBar(
          title: const Text('Compliance & Audit'),
          bottom: TabBar(
            controller: _tabs,
            tabs: const [
              Tab(text: 'Permits & Documents'),
              Tab(text: 'Audit Trail'),
            ],
          ),
        ),
        body: Column(
          children: [
            // Status summary strip
            Container(
              color: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Row(
                children: [
                  _StatusChip(
                    label: 'Valid',
                    count: valid,
                    color: AppColors.success,
                    icon: Icons.verified_rounded,
                  ),
                  const SizedBox(width: 10),
                  _StatusChip(
                    label: 'Expiring Soon',
                    count: expiring,
                    color: AppColors.warning,
                    icon: Icons.warning_amber_rounded,
                  ),
                  const SizedBox(width: 10),
                  _StatusChip(
                    label: 'Expired',
                    count: expired,
                    color: AppColors.danger,
                    icon: Icons.cancel_rounded,
                  ),
                ],
              ),
            ),
            const Divider(height: 1),

            Expanded(
              child: TabBarView(
                controller: _tabs,
                children: [
                  // ── Permits tab ───────────────────────────────────────
                  _PermitsTab(
                    permits: permits,
                    onAdd: () => _showAddPermitSheet(context),
                  ),
                  // ── Audit trail tab ───────────────────────────────────
                  _AuditTab(entries: data.audit),
                ],
              ),
            ),
          ],
        ),
        floatingActionButton: AnimatedBuilder(
          animation: _tabs,
          builder: (_, __) => _tabs.index == 0
              ? FloatingActionButton.extended(
                  onPressed: () => _showAddPermitSheet(context),
                  backgroundColor: AppColors.primary,
                  icon: const Icon(Icons.add, color: Colors.white),
                  label: const Text('Add Permit',
                      style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600)),
                )
              : const SizedBox.shrink(),
        ),
      ),
    );
  }

  void _showAddPermitSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _AddPermitSheet(),
    );
  }
}

// ─── Status Chip ──────────────────────────────────────────────────────────────
class _StatusChip extends StatelessWidget {
  final String label;
  final int count;
  final Color color;
  final IconData icon;

  const _StatusChip({
    required this.label,
    required this.count,
    required this.color,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: color.withAlpha(15),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withAlpha(51)),
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 16),
            const SizedBox(width: 6),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(count.toString(),
                      style: TextStyle(
                          color: color,
                          fontSize: 16,
                          fontWeight: FontWeight.w800)),
                  Text(label,
                      style: TextStyle(
                          color: color.withAlpha(179),
                          fontSize: 9,
                          fontWeight: FontWeight.w500),
                      overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Permits Tab ─────────────────────────────────────────────────────────────
class _PermitsTab extends StatelessWidget {
  final List<CompliancePermit> permits;
  final VoidCallback onAdd;

  const _PermitsTab({required this.permits, required this.onAdd});

  @override
  Widget build(BuildContext context) {
    if (permits.isEmpty) {
      return EmptyState(
        icon: Icons.description_outlined,
        title: 'No Permits Registered',
        subtitle: 'Add FiRCIS permits, licences and certificates',
        actionLabel: 'Add Permit',
        onAction: onAdd,
      );
    }

    // Sort: expired first, then expiring, then valid
    final sorted = [...permits]..sort((a, b) {
        final order = {'Expired': 0, 'Expiring Soon': 1, 'Valid': 2};
        return (order[a.computedStatus] ?? 2)
            .compareTo(order[b.computedStatus] ?? 2);
      });

    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
      itemCount: sorted.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (_, i) =>
          _PermitCard(permit: sorted[i]).animate().fadeIn(delay: (i * 50).ms),
    );
  }
}

class _PermitCard extends StatelessWidget {
  final CompliancePermit permit;
  const _PermitCard({required this.permit});

  @override
  Widget build(BuildContext context) {
    final status = permit.computedStatus;
    final Color statusColor;
    final IconData statusIcon;
    BadgeVariant badgeVariant;

    switch (status) {
      case 'Expired':
        statusColor  = AppColors.danger;
        statusIcon   = Icons.cancel_rounded;
        badgeVariant = BadgeVariant.red;
        break;
      case 'Expiring Soon':
        statusColor  = AppColors.warning;
        statusIcon   = Icons.warning_amber_rounded;
        badgeVariant = BadgeVariant.amber;
        break;
      default:
        statusColor  = AppColors.success;
        statusIcon   = Icons.verified_rounded;
        badgeVariant = BadgeVariant.green;
    }

    // Days until expiry
    String expiryLabel = '';
    try {
      final expDate = DateTime.parse(permit.exp);
      final diff = expDate.difference(DateTime.now()).inDays;
      if (diff < 0) {
        expiryLabel = 'Expired ${(-diff)} days ago';
      } else if (diff == 0) {
        expiryLabel = 'Expires today!';
      } else {
        expiryLabel = 'Expires in $diff days';
      }
    } catch (_) {
      expiryLabel = permit.exp;
    }

    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(
                  color: statusColor.withAlpha(15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(statusIcon, color: statusColor, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(permit.type,
                        style: AppTextStyles.headlineSmall,
                        overflow: TextOverflow.ellipsis,
                        maxLines: 2),
                    const SizedBox(height: 2),
                    Text(permit.ref,
                        style: AppTextStyles.titleMedium
                            .copyWith(color: AppColors.primary)),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              AppBadge(label: status, variant: badgeVariant),
            ],
          ),

          const Divider(height: 14),

          Row(
            children: [
              const Icon(Icons.business_rounded,
                  size: 13, color: AppColors.grey400),
              const SizedBox(width: 6),
              Expanded(
                child: Text(permit.who,
                    style: AppTextStyles.bodySmall,
                    overflow: TextOverflow.ellipsis),
              ),
            ],
          ),
          const SizedBox(height: 6),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.calendar_today_rounded,
                      size: 13, color: AppColors.grey400),
                  const SizedBox(width: 6),
                  Text('Expires: ${AppFormatters.dateStr(permit.exp)}',
                      style: AppTextStyles.bodySmall),
                ],
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: statusColor.withAlpha(15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(expiryLabel,
                    style: TextStyle(
                        fontSize: 10,
                        color: statusColor,
                        fontWeight: FontWeight.w600)),
              ),
            ],
          ),

          if (status != 'Valid') ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: statusColor.withAlpha(10),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: statusColor.withAlpha(51)),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline, color: statusColor, size: 14),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      status == 'Expired'
                          ? 'This permit has expired. Renew via the FiRCIS portal immediately.'
                          : 'Permit expires soon. Initiate renewal within 30 days.',
                      style: AppTextStyles.caption
                          .copyWith(color: statusColor),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ─── Add Permit Sheet ─────────────────────────────────────────────────────────
class _AddPermitSheet extends ConsumerStatefulWidget {
  const _AddPermitSheet();

  @override
  ConsumerState<_AddPermitSheet> createState() => _AddPermitSheetState();
}

class _AddPermitSheetState extends ConsumerState<_AddPermitSheet> {
  String _type = 'FiRCIS Fish Movement Permit';
  final _refCtrl = TextEditingController();
  final _whoCtrl = TextEditingController(text: 'Ministry of Livestock and Fisheries');
  String _expDate = '';
  bool _saving = false;

  static const _permitTypes = [
    'FiRCIS Fish Movement Permit',
    'Commercial Fish Dealer Licence',
    'Sanitary & Cold Chain Inspection Cert',
    'Export Health Certificate (EU/EAC)',
    'Environmental Compliance Certificate',
    'Business Operating Licence',
  ];

  @override
  void dispose() {
    _refCtrl.dispose();
    _whoCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 365)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365 * 5)),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme:
              const ColorScheme.light(primary: AppColors.primary),
        ),
        child: child!,
      ),
    );
    if (picked != null) {
      setState(() {
        _expDate =
            '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
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
                title: 'Add Permit / Document',
                subtitle: 'Register a FiRCIS permit, licence or certificate',
              ),
              const SizedBox(height: 16),

              FieldWrapper(
                label: 'Permit Type',
                child: DropdownButtonFormField<String>(
                  value: _type,
                  isExpanded: true,
                  onChanged: (v) => setState(() {
                    _type = v!;
                    // Auto-fill issuing body
                    if (_type.contains('FiRCIS')) {
                      _whoCtrl.text = 'Ministry of Livestock and Fisheries';
                    } else if (_type.contains('Sanitary')) {
                      _whoCtrl.text = 'Tanzania Food & Drugs Authority (TMDA)';
                    } else if (_type.contains('Dealer')) {
                      _whoCtrl.text = 'Fisheries Department Mwanza';
                    } else if (_type.contains('Export')) {
                      _whoCtrl.text = 'Tanzania Fisheries Authority (TFA)';
                    }
                  }),
                  items: _permitTypes
                      .map((t) => DropdownMenuItem(
                          value: t,
                          child: Text(t,
                              style: AppTextStyles.bodyMedium,
                              overflow: TextOverflow.ellipsis)))
                      .toList(),
                  decoration: const InputDecoration(),
                ),
              ),
              const SizedBox(height: 12),

              FieldWrapper(
                label: 'Reference Number',
                child: TextField(
                  controller: _refCtrl,
                  decoration:
                      const InputDecoration(hintText: 'e.g. FMP-MWZ-2026-089'),
                ),
              ),
              const SizedBox(height: 12),

              FieldWrapper(
                label: 'Issuing Authority',
                child: TextField(
                  controller: _whoCtrl,
                  decoration: const InputDecoration(
                      hintText: 'Ministry / Department name'),
                ),
              ),
              const SizedBox(height: 12),

              FieldWrapper(
                label: 'Expiry Date',
                child: GestureDetector(
                  onTap: _pickDate,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border.all(color: AppColors.grey200),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.calendar_today_rounded,
                            color: AppColors.grey400, size: 18),
                        const SizedBox(width: 10),
                        Text(
                          _expDate.isEmpty
                              ? 'Select expiry date'
                              : AppFormatters.dateStr(_expDate),
                          style: AppTextStyles.bodyLarge.copyWith(
                              color: _expDate.isEmpty
                                  ? AppColors.grey400
                                  : AppColors.grey900),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              PrimaryButton(
                label: 'Register Permit',
                icon: Icons.verified_rounded,
                isLoading: _saving,
                onPressed: (_refCtrl.text.trim().isNotEmpty && _expDate.isNotEmpty)
                    ? () async {
                        setState(() => _saving = true);
                        await ref.read(branchDataProvider.notifier).addPermit(
                          CompliancePermit(
                            type: _type,
                            ref: _refCtrl.text.trim(),
                            who: _whoCtrl.text.trim(),
                            exp: _expDate,
                            status: 'Valid',
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

// ─── Audit Trail Tab ──────────────────────────────────────────────────────────
class _AuditTab extends StatefulWidget {
  final List<AuditEntry> entries;
  const _AuditTab({required this.entries});

  @override
  State<_AuditTab> createState() => _AuditTabState();
}

class _AuditTabState extends State<_AuditTab> {
  final _searchCtrl = TextEditingController();
  String _search = '';

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = widget.entries.where((e) {
      return _search.isEmpty ||
          e.m.toLowerCase().contains(_search) ||
          e.u.toLowerCase().contains(_search) ||
          e.t.toLowerCase().contains(_search);
    }).toList();

    return Column(
      children: [
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
          child: AppSearchBar(
            hint: 'Search audit trail…',
            controller: _searchCtrl,
            onChanged: (v) => setState(() => _search = v.toLowerCase()),
          ),
        ),
        const Divider(height: 1),

        Expanded(
          child: filtered.isEmpty
              ? const EmptyState(
                  icon: Icons.history_rounded,
                  title: 'No Audit Records',
                  subtitle: 'All system actions are logged here automatically',
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: filtered.length,
                  itemBuilder: (_, i) =>
                      _AuditEntryTile(entry: filtered[i], index: i)
                          .animate()
                          .fadeIn(delay: (i * 20).ms),
                ),
        ),
      ],
    );
  }
}

class _AuditEntryTile extends StatelessWidget {
  final AuditEntry entry;
  final int index;
  const _AuditEntryTile({required this.entry, required this.index});

  Color get _dotColor {
    final m = entry.m.toLowerCase();
    if (m.contains('bought') || m.contains('purchased')) return AppColors.primary;
    if (m.contains('sold') || m.contains('sale')) return AppColors.success;
    if (m.contains('fuel')) return AppColors.warning;
    if (m.contains('payment') || m.contains('paid')) return AppColors.success;
    if (m.contains('inspection') || m.contains('quality')) return const Color(0xFF0E7490);
    if (m.contains('maintenance') || m.contains('work order')) return const Color(0xFF7C3AED);
    if (m.contains('transport') || m.contains('vehicle')) return const Color(0xFF1D4ED8);
    if (m.contains('settlement')) return AppColors.warning;
    return AppColors.grey400;
  }

  IconData get _icon {
    final m = entry.m.toLowerCase();
    if (m.contains('bought') || m.contains('purchased')) return Icons.shopping_cart_rounded;
    if (m.contains('sold') || m.contains('sale')) return Icons.storefront_rounded;
    if (m.contains('fuel') || m.contains('issued')) return Icons.local_gas_station_rounded;
    if (m.contains('payment') || m.contains('paid')) return Icons.payments_rounded;
    if (m.contains('inspection') || m.contains('quality')) return Icons.verified_rounded;
    if (m.contains('maintenance') || m.contains('work order')) return Icons.build_rounded;
    if (m.contains('transport') || m.contains('vehicle')) return Icons.local_shipping_rounded;
    if (m.contains('settlement')) return Icons.handshake_rounded;
    if (m.contains('transferred')) return Icons.swap_horiz_rounded;
    if (m.contains('registered') || m.contains('added')) return Icons.person_add_rounded;
    return Icons.circle_rounded;
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Timeline column
        Column(
          children: [
            Container(
              width: 32, height: 32,
              decoration: BoxDecoration(
                color: _dotColor.withAlpha(20),
                shape: BoxShape.circle,
                border: Border.all(color: _dotColor.withAlpha(77)),
              ),
              child: Icon(_icon, color: _dotColor, size: 14),
            ),
            if (index < 50)
              Container(
                width: 2,
                height: 32,
                color: AppColors.grey200,
              ),
          ],
        ),

        const SizedBox(width: 12),

        // Content
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(entry.m,
                    style: AppTextStyles.bodyMedium,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.person_outline,
                        size: 11, color: AppColors.grey400),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(entry.u,
                          style: AppTextStyles.caption,
                          overflow: TextOverflow.ellipsis),
                    ),
                    const SizedBox(width: 8),
                    Text(entry.t, style: AppTextStyles.caption),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

