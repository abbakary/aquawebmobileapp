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

class PaymentsScreen extends ConsumerStatefulWidget {
  const PaymentsScreen({super.key});

  @override
  ConsumerState<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends ConsumerState<PaymentsScreen>
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
    final totalOwed = data.suppliers.fold(0.0, (sum, s) => sum + supplierBalance(data, s.id));
    final totalPaid = data.pays.fold(0.0, (sum, p) => sum + p.amt);

    return MainShell(
      selectedIndex: 4,
      child: Scaffold(
        backgroundColor: AppColors.grey50,
        appBar: AppBar(
          title: const Text('Supplier Payments'),
          bottom: TabBar(
            controller: _tabs,
            tabs: const [Tab(text: 'Summary'), Tab(text: 'Transactions')],
          ),
        ),
        body: TabBarView(
          controller: _tabs,
          children: [
            // ── Summary Tab ───────────────────────────────────────────────
            _PaymentSummaryTab(
              data: data,
              totalOwed: totalOwed,
              totalPaid: totalPaid,
              onPay: (supId, amt, m) =>
                  ref.read(branchDataProvider.notifier).paySupplier(supId, amt, m),
            ),

            // ── Transactions Tab ──────────────────────────────────────────
            _TransactionsTab(data: data),
          ],
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => _showPaymentSheet(context, data),
          backgroundColor: AppColors.primary,
          icon: const Icon(Icons.payments_outlined, color: Colors.white),
          label: const Text('Pay Supplier', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
        ),
      ),
    );
  }

  void _showPaymentSheet(BuildContext context, BranchData data) {
    String? supId = data.suppliers.isNotEmpty ? data.suppliers.first.id : null;
    String method = PaymentMethods.all[0];
    final amtCtrl = TextEditingController();

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
                BottomSheetHeader(title: 'Pay Supplier', subtitle: 'Issue payment for fish purchases'),
                const SizedBox(height: 16),

                FieldWrapper(
                  label: 'Supplier',
                  child: DropdownButtonFormField<String>(
                    value: supId,
                    onChanged: (v) => setModalState(() => supId = v),
                    items: data.suppliers.map((s) {
                      final owed = supplierBalance(data, s.id);
                      return DropdownMenuItem(
                        value: s.id,
                        child: Text('${s.name} (Owed: ${AppFormatters.tzsShort(owed)})',
                            style: AppTextStyles.bodyMedium, overflow: TextOverflow.ellipsis),
                      );
                    }).toList(),
                    decoration: const InputDecoration(),
                  ),
                ),
                const SizedBox(height: 12),

                FieldWrapper(
                  label: 'Amount (TZS)',
                  child: TextField(
                    controller: amtCtrl,
                    keyboardType: TextInputType.number,
                    style: AppTextStyles.moneyLarge,
                    decoration: const InputDecoration(hintText: '0'),
                  ),
                ),
                const SizedBox(height: 12),

                FieldWrapper(
                  label: 'Payment Method',
                  child: DropdownButtonFormField<String>(
                    value: method,
                    onChanged: (v) => setModalState(() => method = v!),
                    items: PaymentMethods.all
                        .map((m) => DropdownMenuItem(value: m, child: Text(m, style: AppTextStyles.bodyMedium)))
                        .toList(),
                    decoration: const InputDecoration(),
                  ),
                ),
                const SizedBox(height: 20),

                PrimaryButton(
                  label: 'Save & Print Receipt',
                  icon: Icons.receipt_outlined,
                  onPressed: () async {
                    final amt = double.tryParse(amtCtrl.text) ?? 0;
                    if (supId != null && amt > 0) {
                      await ref.read(branchDataProvider.notifier).paySupplier(supId!, amt, method);
                      if (ctx.mounted) Navigator.pop(ctx);
                    }
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

class _PaymentSummaryTab extends StatelessWidget {
  final BranchData data;
  final double totalOwed;
  final double totalPaid;
  final void Function(String supId, double amt, String method) onPay;

  const _PaymentSummaryTab({
    required this.data,
    required this.totalOwed,
    required this.totalPaid,
    required this.onPay,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Summary card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: AppColors.primaryGradient,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Total Purchase Cost',
                            style: TextStyle(color: Colors.white60, fontSize: 11)),
                        Text(
                          AppFormatters.tzs(data.batches.fold(0.0, (s, b) => s + b.total)),
                          style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      const Text('Total Paid', style: TextStyle(color: Colors.white60, fontSize: 11)),
                      Text(
                        AppFormatters.tzsShort(totalPaid),
                        style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Divider(color: Colors.white24, height: 1),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('Outstanding to Fishermen: ',
                      style: TextStyle(color: Colors.white70, fontSize: 12)),
                  Text(AppFormatters.tzs(totalOwed),
                      style: const TextStyle(
                          color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700)),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        Text('Supplier Balances', style: AppTextStyles.headlineSmall),
        const SizedBox(height: 10),
        ...data.suppliers.asMap().entries.map((e) {
          final sup = e.value;
          final fishOwed = supplierBalance(data, sup.id);
          final fuelDebt = supplierFuelDebt(data, sup.id);
          final net = fishOwed - fuelDebt;

          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: AppCard(
              child: Column(
                children: [
                  Row(
                    children: [
                      AvatarCircle(name: sup.name, size: 42),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(sup.name, style: AppTextStyles.titleLarge),
                            Text('${sup.no} · ${sup.cat}', style: AppTextStyles.caption),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            AppFormatters.tzs(fishOwed),
                            style: AppTextStyles.moneyMedium.copyWith(
                              color: fishOwed > 0 ? AppColors.primary : AppColors.success,
                            ),
                          ),
                          AppBadge(
                            label: fishOwed > 0 ? 'Owes' : 'Settled',
                            variant: fishOwed > 0 ? BadgeVariant.amber : BadgeVariant.green,
                          ),
                        ],
                      ),
                    ],
                  ),

                  if (fuelDebt > 0 || net != fishOwed) ...[
                    const Divider(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: _MiniStat(
                            label: 'Fish Owed',
                            value: AppFormatters.tzsShort(fishOwed),
                            color: AppColors.primary,
                          ),
                        ),
                        Expanded(
                          child: _MiniStat(
                            label: 'Fuel Debt',
                            value: AppFormatters.tzsShort(fuelDebt),
                            color: fuelDebt > 0 ? AppColors.warning : AppColors.grey400,
                          ),
                        ),
                        Expanded(
                          child: _MiniStat(
                            label: 'Net Balance',
                            value: AppFormatters.tzsShort(net.abs()),
                            color: net < 0 ? AppColors.danger : AppColors.success,
                          ),
                        ),
                      ],
                    ),
                  ],

                  if (fishOwed > 0) ...[
                    const Divider(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: _PaymentMethodButton(
                            icon: Icons.phone_android,
                            label: 'M-Pesa',
                            onTap: () => onPay(sup.id, fishOwed, 'M-Pesa (Mobile Money)'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _PaymentMethodButton(
                            icon: Icons.money,
                            label: 'Cash',
                            onTap: () => onPay(sup.id, fishOwed, 'Cash Voucher'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _PaymentMethodButton(
                            icon: Icons.account_balance,
                            label: 'Bank',
                            onTap: () => onPay(sup.id, fishOwed, 'Bank RTGS'),
                          ),
                        ),
                      ],
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

class _TransactionsTab extends StatelessWidget {
  final BranchData data;
  const _TransactionsTab({required this.data});

  @override
  Widget build(BuildContext context) {
    final allPays = data.pays.reversed.toList();
    return allPays.isEmpty
        ? const EmptyState(
            icon: Icons.receipt_long_outlined,
            title: 'No Transactions',
            subtitle: 'Payment records will appear here',
          )
        : ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: allPays.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (_, i) {
              final p = allPays[i];
              final sup = data.suppliers.firstWhere(
                (s) => s.id == p.sup,
                orElse: () => Supplier(no: '', name: '—', phone: '', site: '', cat: ''),
              );
              return AppCard(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.successLight,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.payments_outlined,
                          color: AppColors.success, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(sup.name, style: AppTextStyles.titleMedium),
                          Text('${p.ref} · ${p.m}', style: AppTextStyles.caption),
                          Text(AppFormatters.dateStr(p.date), style: AppTextStyles.caption),
                        ],
                      ),
                    ),
                    Text(
                      AppFormatters.tzs(p.amt),
                      style: AppTextStyles.moneyMedium.copyWith(color: AppColors.success),
                    ),
                  ],
                ),
              ).animate().fadeIn(delay: (i * 30).ms);
            },
          );
  }
}

class _MiniStat extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _MiniStat({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(label, style: AppTextStyles.caption),
        Text(value,
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: color)),
      ],
    );
  }
}

class _PaymentMethodButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _PaymentMethodButton({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: 14),
      label: Text(label),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
        textStyle: const TextStyle(fontSize: 11),
        minimumSize: Size.zero,
      ),
    );
  }
}




