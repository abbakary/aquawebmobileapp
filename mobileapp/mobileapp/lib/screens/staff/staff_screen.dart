import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme.dart';
import '../../core/formatters.dart';
import '../../models/models.dart';
import '../../providers/app_state.dart';
import '../../services/storage_service.dart';
import '../../widgets/app_widgets.dart';
import '../dashboard/main_shell.dart';

class StaffScreen extends ConsumerStatefulWidget {
  const StaffScreen({super.key});

  @override
  ConsumerState<StaffScreen> createState() => _StaffScreenState();
}

class _StaffScreenState extends ConsumerState<StaffScreen>
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
    // Load demo staff
    final staffList = StorageService.loadStaff();

    final totalSalary = staffList
        .where((u) => u.active)
        .fold(0.0, (s, u) => s + u.salary);

    return MainShell(
      selectedIndex: 4,
      child: Scaffold(
        backgroundColor: AppColors.grey50,
        appBar: AppBar(
          title: const Text('Staff & Payroll'),
          bottom: TabBar(
            controller: _tabs,
            tabs: const [
              Tab(text: 'Employees'),
              Tab(text: 'Payroll'),
              Tab(text: 'Roles'),
            ],
          ),
        ),
        body: TabBarView(
          controller: _tabs,
          children: [
            // ── Employees ──────────────────────────────────────────────
            _EmployeesTab(staffList: staffList, totalSalary: totalSalary),
            // ── Payroll history ────────────────────────────────────────
            _PayrollTab(staffList: staffList),
            // ── Roles & permissions ────────────────────────────────────
            const _RolesTab(),
          ],
        ),
        floatingActionButton: AnimatedBuilder(
          animation: _tabs,
          builder: (_, __) {
            if (_tabs.index == 1) {
              return FloatingActionButton.extended(
                onPressed: () => _showPayStaffSheet(context, staffList),
                backgroundColor: AppColors.success,
                icon: const Icon(Icons.payments_rounded, color: Colors.white),
                label: const Text('Pay Staff',
                    style: TextStyle(
                        color: Colors.white, fontWeight: FontWeight.w600)),
              );
            }
            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }

  void _showPayStaffSheet(BuildContext context, List<StaffMember> staff) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _PayStaffSheet(staffList: staff),
    );
  }
}

// ─── Employees Tab ────────────────────────────────────────────────────────────
class _EmployeesTab extends StatelessWidget {
  final List<StaffMember> staffList;
  final double totalSalary;

  const _EmployeesTab({required this.staffList, required this.totalSalary});

  @override
  Widget build(BuildContext context) {
    final active   = staffList.where((u) => u.active).length;
    final inactive = staffList.where((u) => !u.active).length;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      children: [
        // Summary banner
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: AppColors.primaryGradient,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              Expanded(
                child: _StaffStat(
                    label: 'Total Staff', value: '${staffList.length}'),
              ),
              Expanded(
                child: _StaffStat(label: 'Active', value: '$active'),
              ),
              Expanded(
                child: _StaffStat(label: 'Inactive', value: '$inactive'),
              ),
              Expanded(
                child: _StaffStat(
                    label: 'Monthly Payroll',
                    value: AppFormatters.tzsShort(totalSalary)),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        ...staffList.asMap().entries.map((e) {
          final staff = e.value;
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _StaffCard(staff: staff)
                .animate()
                .fadeIn(delay: (e.key * 50).ms),
          );
        }),
      ],
    );
  }
}

class _StaffStat extends StatelessWidget {
  final String label, value;
  const _StaffStat({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value,
            style: const TextStyle(
                color: Colors.white, fontSize: 15,
                fontWeight: FontWeight.w800),
            overflow: TextOverflow.ellipsis),
        Text(label,
            style: const TextStyle(color: Colors.white60, fontSize: 10),
            textAlign: TextAlign.center),
      ],
    );
  }
}

class _StaffCard extends StatelessWidget {
  final StaffMember staff;
  const _StaffCard({required this.staff});

  @override
  Widget build(BuildContext context) {
    final roleColor = _roleColor(staff.role);
    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          AvatarCircle(name: staff.name, size: 48, bgColor: roleColor),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(staff.name, style: AppTextStyles.titleLarge,
                    overflow: TextOverflow.ellipsis),
                const SizedBox(height: 2),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: roleColor.withAlpha(20),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(staff.role,
                      style: TextStyle(
                          fontSize: 11, fontWeight: FontWeight.w600,
                          color: roleColor)),
                ),
                const SizedBox(height: 4),
                Text('@${staff.username} · ${staff.phone}',
                    style: AppTextStyles.bodySmall),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(AppFormatters.tzsShort(staff.salary),
                  style: AppTextStyles.moneyMedium),
              const Text('/month',
                  style: TextStyle(color: AppColors.grey400, fontSize: 10)),
              const SizedBox(height: 4),
              AppBadge(
                label: staff.active ? 'Active' : 'Inactive',
                variant: staff.active ? BadgeVariant.green : BadgeVariant.grey,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Color _roleColor(String role) {
    switch (role) {
      case 'Owner':             return const Color(0xFF7C3AED);
      case 'General Manager':  return AppColors.primary;
      case 'Purchasing Officer': return const Color(0xFF0E7490);
      case 'Quality Inspector': return AppColors.success;
      case 'Accountant':       return const Color(0xFF92400E);
      case 'Sales Officer':    return AppColors.warning;
      case 'Storekeeper':      return const Color(0xFF065F46);
      case 'Transport Officer': return const Color(0xFF1D4ED8);
      default:                 return AppColors.grey500;
    }
  }
}

// ─── Payroll Tab ──────────────────────────────────────────────────────────────
class _PayrollTab extends ConsumerWidget {
  final List<StaffMember> staffList;
  const _PayrollTab({required this.staffList});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(branchDataProvider);
    // Pull payroll records from expenses (they are logged there)
    final payrollExps = data.exps
        .where((e) => e.cat.contains('Payroll') || e.cat.contains('Mishahara'))
        .toList();

    final totalPaid =
        payrollExps.fold(0.0, (s, e) => s + e.amt);

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      children: [
        // Monthly payroll summary
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Monthly Payroll Summary',
                      style: AppTextStyles.headlineSmall),
                  Text(AppFormatters.tzsShort(totalPaid),
                      style: AppTextStyles.moneyMedium
                          .copyWith(color: AppColors.success)),
                ],
              ),
              const Divider(height: 16),
              ...staffList.where((u) => u.active).map((u) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Row(
                      children: [
                        AvatarCircle(name: u.name, size: 34),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(u.name.split('(').first.trim(),
                                  style: AppTextStyles.titleMedium,
                                  overflow: TextOverflow.ellipsis),
                              Text(u.role, style: AppTextStyles.caption),
                            ],
                          ),
                        ),
                        Text(AppFormatters.tzs(u.salary),
                            style: AppTextStyles.titleMedium
                                .copyWith(color: AppColors.grey700)),
                      ],
                    ),
                  )),
              const Divider(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Total Monthly Payroll',
                      style: AppTextStyles.titleLarge
                          .copyWith(fontWeight: FontWeight.w700)),
                  Text(
                    AppFormatters.tzs(staffList
                        .where((u) => u.active)
                        .fold(0.0, (s, u) => s + u.salary)),
                    style: AppTextStyles.moneyMedium
                        .copyWith(color: AppColors.primary),
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Payroll history
        if (payrollExps.isNotEmpty) ...[
          Text('Payment History', style: AppTextStyles.headlineSmall),
          const SizedBox(height: 10),
          ...payrollExps.asMap().entries.map((e) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: AppCard(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      Container(
                        width: 40, height: 40,
                        decoration: BoxDecoration(
                          color: AppColors.successLight,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.payments_rounded,
                            color: AppColors.success, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(e.value.cat, style: AppTextStyles.titleMedium,
                                overflow: TextOverflow.ellipsis),
                            Text(e.value.desc, style: AppTextStyles.caption,
                                overflow: TextOverflow.ellipsis),
                            Text(AppFormatters.dateStr(e.value.date),
                                style: AppTextStyles.caption),
                          ],
                        ),
                      ),
                      Text(AppFormatters.tzs(e.value.amt),
                          style: AppTextStyles.titleLarge
                              .copyWith(color: AppColors.success)),
                    ],
                  ),
                ).animate().fadeIn(delay: (e.key * 30).ms),
              )),
        ] else
          EmptyState(
            icon: Icons.payments_outlined,
            title: 'No Payroll Records',
            subtitle: 'Use Pay Staff to disburse monthly salaries',
          ),
      ],
    );
  }
}

// ─── Pay Staff Sheet ──────────────────────────────────────────────────────────
class _PayStaffSheet extends ConsumerStatefulWidget {
  final List<StaffMember> staffList;
  const _PayStaffSheet({required this.staffList});

  @override
  ConsumerState<_PayStaffSheet> createState() => _PayStaffSheetState();
}

class _PayStaffSheetState extends ConsumerState<_PayStaffSheet> {
  String? _staffId;
  String _type  = 'Mshahara';
  String _method = 'M-Pesa';
  final _amtCtrl = TextEditingController();
  final _dedCtrl = TextEditingController(text: '0');
  final _noteCtrl = TextEditingController();
  bool _saving = false;

  static const _types   = ['Mshahara', 'Posho', 'Advance', 'Bonus'];
  static const _methods = ['M-Pesa', 'Benki (CRDB / NMB)', 'Cash', 'Airtel Money'];

  @override
  void initState() {
    super.initState();
    final active = widget.staffList.where((u) => u.active).toList();
    if (active.isNotEmpty) {
      _staffId = active.first.id;
      _amtCtrl.text = active.first.salary.toStringAsFixed(0);
    }
  }

  @override
  void dispose() {
    _amtCtrl.dispose();
    _dedCtrl.dispose();
    _noteCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final active = widget.staffList.where((u) => u.active).toList();
    final gross  = double.tryParse(_amtCtrl.text) ?? 0;
    final ded    = double.tryParse(_dedCtrl.text) ?? 0;
    final net    = (gross - ded).clamp(0.0, double.infinity);

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
                title: 'Pay Staff Member',
                subtitle: 'Issue salary, allowance or advance',
              ),
              const SizedBox(height: 16),

              FieldWrapper(
                label: 'Staff Member',
                child: DropdownButtonFormField<String>(
                  value: _staffId,
                  onChanged: (v) {
                    setState(() {
                      _staffId = v;
                      final found = active.where((u) => u.id == v).toList();
                      if (found.isNotEmpty) {
                        _amtCtrl.text = found.first.salary.toStringAsFixed(0);
                      }
                    });
                  },
                  items: active.map((u) => DropdownMenuItem(
                      value: u.id,
                      child: Text(u.name.split('(').first.trim(),
                          style: AppTextStyles.bodyMedium,
                          overflow: TextOverflow.ellipsis))).toList(),
                  decoration: const InputDecoration(),
                ),
              ),
              const SizedBox(height: 12),

              Row(children: [
                Expanded(
                  child: FieldWrapper(
                    label: 'Payment Type',
                    child: DropdownButtonFormField<String>(
                      value: _type,
                      onChanged: (v) => setState(() => _type = v!),
                      items: _types.map((t) => DropdownMenuItem(
                          value: t,
                          child: Text(t, style: AppTextStyles.bodyMedium)))
                          .toList(),
                      decoration: const InputDecoration(),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: FieldWrapper(
                    label: 'Method',
                    child: DropdownButtonFormField<String>(
                      value: _method,
                      onChanged: (v) => setState(() => _method = v!),
                      items: _methods.map((m) => DropdownMenuItem(
                          value: m,
                          child: Text(m, style: AppTextStyles.bodyMedium,
                              overflow: TextOverflow.ellipsis)))
                          .toList(),
                      decoration: const InputDecoration(),
                    ),
                  ),
                ),
              ]),
              const SizedBox(height: 12),

              Row(children: [
                Expanded(
                  child: FieldWrapper(
                    label: 'Gross Amount (TZS)',
                    child: TextField(
                      controller: _amtCtrl,
                      keyboardType: TextInputType.number,
                      style: AppTextStyles.headlineSmall,
                      onChanged: (_) => setState(() {}),
                      decoration: const InputDecoration(hintText: '0'),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: FieldWrapper(
                    label: 'Deduction (TZS)',
                    child: TextField(
                      controller: _dedCtrl,
                      keyboardType: TextInputType.number,
                      onChanged: (_) => setState(() {}),
                      decoration: const InputDecoration(hintText: '0'),
                    ),
                  ),
                ),
              ]),
              const SizedBox(height: 8),

              FieldWrapper(
                label: 'Note (optional)',
                child: TextField(
                  controller: _noteCtrl,
                  decoration: const InputDecoration(
                      hintText: 'Mshahara wa mwezi, makato ya advance…'),
                ),
              ),
              const SizedBox(height: 14),

              // Net payout highlight
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.successLight,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.success.withAlpha(77)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Net Payout',
                            style: TextStyle(
                                color: AppColors.success, fontSize: 11,
                                fontWeight: FontWeight.w600)),
                        Text(AppFormatters.tzs(net),
                            style: AppTextStyles.moneyLarge
                                .copyWith(color: AppColors.success)),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('Gross: ${AppFormatters.tzsShort(gross)}',
                            style: AppTextStyles.caption),
                        Text('Deduction: ${AppFormatters.tzsShort(ded)}',
                            style: AppTextStyles.caption),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              PrimaryButton(
                label: 'Confirm Payment',
                icon: Icons.check_circle_outline,
                isLoading: _saving,
                onPressed: net > 0 && _staffId != null
                    ? () async {
                        setState(() => _saving = true);
                        final staffMember = widget.staffList
                            .firstWhere((u) => u.id == _staffId);
                        // Record as expense in the data store
                        await ref
                            .read(branchDataProvider.notifier)
                            .addExpense(Expense(
                              cat: 'Mishahara & Posho (Staff Payroll)',
                              amt: net,
                              date: today(),
                              desc: '$_type - ${staffMember.name}',
                            ));
                        setState(() => _saving = false);
                        if (context.mounted) {
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                            content: Text(
                                'Paid ${AppFormatters.tzs(net)} to ${staffMember.name.split('(').first.trim()}'),
                            backgroundColor: AppColors.success,
                            behavior: SnackBarBehavior.floating,
                          ));
                        }
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

// ─── Roles Tab ────────────────────────────────────────────────────────────────
class _RolesTab extends StatelessWidget {
  const _RolesTab();

  static const _rolePermissions = {
    'Owner':               ['All modules — full access'],
    'General Manager':     ['All modules — full access'],
    'Purchasing Officer':  ['Home', 'Procurement', 'Fuel', 'Maintenance', 'Inventory', 'Transport', 'Reports'],
    'Quality Inspector':   ['Home', 'Quality Control', 'Inventory', 'Reports'],
    'Storekeeper':         ['Home', 'Inventory', 'Fuel', 'Maintenance', 'Quality', 'Reports'],
    'Accountant':          ['Home', 'BI & P&L', 'Payments', 'Fuel', 'Expenses', 'Suppliers', 'Sales', 'Transport', 'Reports'],
    'Sales Officer':       ['Home', 'Sales', 'Transport', 'Inventory', 'Reports'],
    'Transport Officer':   ['Home', 'Transport', 'Maintenance'],
    'Auditor':             ['Home', 'BI', 'Procurement', 'Fuel', 'Maintenance', 'Inventory', 'Sales', 'Suppliers', 'Quality', 'Payments', 'Transport', 'Expenses', 'Compliance', 'Audit', 'Reports'],
  };

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      children: [
        Text('Role Permissions Matrix', style: AppTextStyles.headlineSmall),
        const SizedBox(height: 4),
        Text('Each role has access to the following modules:',
            style: AppTextStyles.bodySmall),
        const SizedBox(height: 14),

        ..._rolePermissions.entries.map((e) {
          final isFull = e.value.first.contains('All modules');
          final roleColor = _colorForRole(e.key);
          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.grey200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Role header
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: roleColor.withAlpha(15),
                    borderRadius:
                        const BorderRadius.vertical(top: Radius.circular(13)),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.badge_rounded, color: roleColor, size: 18),
                      const SizedBox(width: 8),
                      Text(e.key,
                          style: TextStyle(
                              fontWeight: FontWeight.w700,
                              color: roleColor,
                              fontSize: 14)),
                      if (isFull) ...[
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: roleColor.withAlpha(20),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text('Full Access',
                              style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: roleColor)),
                        ),
                      ],
                    ],
                  ),
                ),
                // Permissions
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: e.value.map((perm) => Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: isFull
                                ? roleColor.withAlpha(15)
                                : AppColors.grey100,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                                color: isFull
                                    ? roleColor.withAlpha(38)
                                    : AppColors.grey200),
                          ),
                          child: Text(
                            perm,
                            style: TextStyle(
                              fontSize: 11,
                              color: isFull ? roleColor : AppColors.grey600,
                              fontWeight: isFull
                                  ? FontWeight.w600
                                  : FontWeight.w400,
                            ),
                          ),
                        )).toList(),
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }

  Color _colorForRole(String role) {
    switch (role) {
      case 'Owner':              return const Color(0xFF7C3AED);
      case 'General Manager':   return AppColors.primary;
      case 'Purchasing Officer': return const Color(0xFF0E7490);
      case 'Quality Inspector': return AppColors.success;
      case 'Accountant':        return const Color(0xFF92400E);
      case 'Sales Officer':     return AppColors.warning;
      case 'Storekeeper':       return const Color(0xFF065F46);
      case 'Transport Officer': return const Color(0xFF1D4ED8);
      case 'Auditor':           return AppColors.danger;
      default:                  return AppColors.grey500;
    }
  }
}


