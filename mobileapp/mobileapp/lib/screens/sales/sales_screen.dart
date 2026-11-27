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

class SalesScreen extends ConsumerStatefulWidget {
  const SalesScreen({super.key});

  @override
  ConsumerState<SalesScreen> createState() => _SalesScreenState();
}

class _SalesScreenState extends ConsumerState<SalesScreen> {
  @override
  Widget build(BuildContext context) {
    final data = ref.watch(branchDataProvider);
    final totalRevenue = data.sales.fold(0.0, (s, x) => s + x.total);
    final totalCollected = data.sales.fold(0.0, (s, x) => s + x.paid);
    final outstanding = totalRevenue - totalCollected;

    return MainShell(
      selectedIndex: 3,
      child: Scaffold(
        backgroundColor: AppColors.grey50,
        appBar: AppBar(
          title: const Text('Industry Sales'),
          actions: [
            IconButton(
              icon: const Icon(Icons.add_circle_outline),
              onPressed: () => _showSaleWizard(context),
            ),
          ],
        ),
        body: Column(
          children: [
            // Summary
            Container(
              padding: const EdgeInsets.all(16),
              color: Colors.white,
              child: Row(
                children: [
                  Expanded(
                    child: _SaleStat(
                      label: 'Total Revenue',
                      value: AppFormatters.tzsShort(totalRevenue),
                      color: AppColors.primary,
                    ),
                  ),
                  Expanded(
                    child: _SaleStat(
                      label: 'Collected',
                      value: AppFormatters.tzsShort(totalCollected),
                      color: AppColors.success,
                    ),
                  ),
                  Expanded(
                    child: _SaleStat(
                      label: 'Outstanding',
                      value: AppFormatters.tzsShort(outstanding),
                      color: outstanding > 0 ? AppColors.danger : AppColors.success,
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),

            Expanded(
              child: data.sales.isEmpty
                  ? EmptyState(
                      icon: Icons.storefront_outlined,
                      title: 'No Sales Yet',
                      subtitle: 'Record your first industry sale',
                      actionLabel: 'New Sale',
                      onAction: () => _showSaleWizard(context),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: data.sales.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (_, i) {
                        final sale = data.sales.reversed.toList()[i];
                        final cus = data.customers.firstWhere(
                          (c) => c.id == sale.cus,
                          orElse: () => Customer(code: '', name: 'Unknown', phone: '', location: ''),
                        );
                        return _SaleCard(
                          sale: sale,
                          customer: cus,
                          onPay: (amt) =>
                              ref.read(branchDataProvider.notifier).receivePayment(sale.id, amt),
                        ).animate().fadeIn(delay: (i * 40).ms);
                      },
                    ),
            ),
          ],
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => _showSaleWizard(context),
          backgroundColor: AppColors.primary,
          icon: const Icon(Icons.add, color: Colors.white),
          label: const Text('New Sale', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
        ),
      ),
    );
  }

  void _showSaleWizard(BuildContext context) {
    final data = ref.read(branchDataProvider);
    final stockMap = computeStock(data);

    if (stockMap.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No stock available. Purchase and accept fish first.'),
          backgroundColor: AppColors.warning,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _SaleSheet(stockMap: stockMap),
    );
  }
}

class _SaleSheet extends ConsumerStatefulWidget {
  final Map<String, double> stockMap;
  const _SaleSheet({required this.stockMap});

  @override
  ConsumerState<_SaleSheet> createState() => _SaleSheetState();
}

class _SaleSheetState extends ConsumerState<_SaleSheet> {
  String? _cusId;
  String _sp = '';
  String _grade = 'A';
  double _kg = 0;
  double _price = 0;
  double _paid = 0;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    final data = ref.read(branchDataProvider);
    if (data.customers.isNotEmpty) _cusId = data.customers.first.id;
    if (widget.stockMap.isNotEmpty) {
      final first = widget.stockMap.entries.first;
      _sp = first.key.split('|')[0];
      _grade = first.key.split('|')[1];
      _kg = first.value;
      _price = (FishSpecies.defaultPrices[_sp] ?? 7000).toDouble() * 1.35;
    }
  }

  @override
  Widget build(BuildContext context) {
    final data = ref.watch(branchDataProvider);
    final selectedKey = '$_sp|$_grade';
    final available = widget.stockMap[selectedKey] ?? 0;
    final total = _kg * _price;

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
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              BottomSheetHeader(title: 'New Sale', subtitle: 'Industry sales to processing factory'),
              const SizedBox(height: 16),

              // Customer
              FieldWrapper(
                label: 'Customer / Factory',
                child: DropdownButtonFormField<String>(
                  value: _cusId,
                  onChanged: (v) => setState(() => _cusId = v),
                  items: data.customers
                      .map((c) => DropdownMenuItem(
                            value: c.id,
                            child: Text('${c.name} (${c.code})',
                                style: AppTextStyles.bodyMedium, overflow: TextOverflow.ellipsis),
                          ))
                      .toList(),
                  decoration: const InputDecoration(),
                ),
              ),
              const SizedBox(height: 12),

              // Stock selector
              FieldWrapper(
                label: 'Select Stock',
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: widget.stockMap.entries.map((e) {
                    final sp = e.key.split('|')[0];
                    final g = e.key.split('|')[1];
                    final selected = e.key == selectedKey;
                    return GestureDetector(
                      onTap: () => setState(() {
                        _sp = sp;
                        _grade = g;
                        _kg = e.value;
                        _price = (FishSpecies.defaultPrices[sp] ?? 7000).toDouble() * 1.35;
                      }),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: selected ? AppColors.primarySurface : AppColors.grey50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: selected ? AppColors.primary : AppColors.grey200,
                            width: selected ? 1.5 : 1,
                          ),
                        ),
                        child: Column(
                          children: [
                            FishSpeciesIcon(species: sp, size: 28),
                            const SizedBox(height: 4),
                            Text('${sp.split(' ')[0]} $g',
                                style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: selected ? AppColors.primary : AppColors.grey700)),
                            Text(AppFormatters.kgShort(e.value), style: AppTextStyles.caption),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),

              const SizedBox(height: 12),

              Row(
                children: [
                  Expanded(
                    child: FieldWrapper(
                      label: 'Quantity (kg)',
                      hint: 'Available: ${AppFormatters.kgShort(available)}',
                      child: TextFormField(
                        initialValue: _kg.toStringAsFixed(0),
                        keyboardType: TextInputType.number,
                        onChanged: (v) => setState(() {
                          final val = double.tryParse(v) ?? 0;
                          _kg = val.clamp(0, available);
                        }),
                        decoration: const InputDecoration(suffixText: 'kg'),
                        style: AppTextStyles.headlineSmall,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: FieldWrapper(
                      label: 'Price / kg (TZS)',
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

              const SizedBox(height: 12),

              // Total display
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
                        Text('Invoice Total', style: AppTextStyles.bodySmall.copyWith(color: AppColors.primary)),
                        Text(AppFormatters.tzs(total),
                            style: AppTextStyles.moneyLarge.copyWith(color: AppColors.primary)),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('$_sp · Grade $_grade',
                            style: AppTextStyles.bodySmall.copyWith(color: AppColors.primary)),
                        Text(AppFormatters.kg(_kg), style: AppTextStyles.bodyMedium),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              FieldWrapper(
                label: 'Payment Received Now (TZS)',
                child: TextFormField(
                  initialValue: '0',
                  keyboardType: TextInputType.number,
                  onChanged: (v) => setState(() {
                    final val = double.tryParse(v) ?? 0;
                    _paid = val.clamp(0, total);
                  }),
                  decoration: InputDecoration(
                    hintText: '0 = Invoice on Credit',
                    suffixText: _paid > 0
                        ? 'Outstanding: ${AppFormatters.tzsShort(total - _paid)}'
                        : 'Full credit',
                  ),
                ),
              ),

              const SizedBox(height: 20),

              PrimaryButton(
                label: 'Record Sale & Issue Invoice',
                icon: Icons.receipt_long_outlined,
                isLoading: _loading,
                onPressed: _cusId != null && _kg > 0 && _price > 0
                    ? () async {
                        setState(() => _loading = true);
                        final sale = await ref.read(branchDataProvider.notifier).sell(
                          cusId: _cusId!,
                          sp: _sp,
                          grade: _grade,
                          kg: _kg,
                          price: _price,
                          paid: _paid,
                        );
                        setState(() => _loading = false);
                        if (!mounted) return;
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(sale != null
                                ? 'Sale recorded: ${sale.no}'
                                : 'Insufficient stock!'),
                            backgroundColor: sale != null ? AppColors.success : AppColors.danger,
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
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

class _SaleCard extends StatelessWidget {
  final Sale sale;
  final Customer customer;
  final ValueChanged<double> onPay;

  const _SaleCard({required this.sale, required this.customer, required this.onPay});

  @override
  Widget build(BuildContext context) {
    final dispatchColor = sale.dis.st == 'Delivered'
        ? AppColors.success
        : sale.dis.st == 'In transit'
            ? AppColors.primary
            : AppColors.grey400;

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
                  Text(sale.no,
                      style: AppTextStyles.titleMedium.copyWith(color: AppColors.primary)),
                  Text('${sale.sp} · Grade ${sale.grade}',
                      style: AppTextStyles.headlineSmall),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(AppFormatters.tzs(sale.total), style: AppTextStyles.moneyMedium),
                  AppBadge(
                    label: sale.dis.st,
                    variant: sale.dis.st == 'Delivered'
                        ? BadgeVariant.green
                        : sale.dis.st == 'In transit'
                            ? BadgeVariant.blue
                            : BadgeVariant.grey,
                  ),
                ],
              ),
            ],
          ),

          const Divider(height: 14),

          Row(
            children: [
              const Icon(Icons.business, size: 14, color: AppColors.grey400),
              const SizedBox(width: 6),
              Expanded(
                child: Text('${customer.name} · ${sale.date}',
                    style: AppTextStyles.bodySmall),
              ),
              Text(AppFormatters.kg(sale.kg), style: AppTextStyles.bodySmall),
            ],
          ),

          const SizedBox(height: 8),

          // Payment progress
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Collected: ${AppFormatters.tzsShort(sale.paid)}',
                      style: AppTextStyles.bodySmall.copyWith(color: AppColors.success)),
                  if (sale.outstanding > 0)
                    Text('Outstanding: ${AppFormatters.tzsShort(sale.outstanding)}',
                        style: AppTextStyles.bodySmall.copyWith(color: AppColors.danger)),
                ],
              ),
              const SizedBox(height: 4),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: sale.total > 0 ? (sale.paid / sale.total).clamp(0, 1) : 0,
                  minHeight: 6,
                  backgroundColor: AppColors.grey100,
                  valueColor: AlwaysStoppedAnimation<Color>(
                      sale.outstanding <= 0 ? AppColors.success : AppColors.primary),
                ),
              ),
            ],
          ),

          if (sale.dis.veh.isNotEmpty) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.local_shipping_outlined, size: 13, color: dispatchColor),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(sale.dis.veh,
                      style: AppTextStyles.caption.copyWith(color: dispatchColor),
                      overflow: TextOverflow.ellipsis),
                ),
              ],
            ),
          ],

          if (sale.outstanding > 0) ...[
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => _showPaymentSheet(context),
                icon: const Icon(Icons.payments_outlined, size: 16),
                label: const Text('Record Payment'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  textStyle: const TextStyle(fontSize: 12),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _showPaymentSheet(BuildContext context) {
    final ctrl = TextEditingController(text: sale.outstanding.toStringAsFixed(0));
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: Container(
          decoration: const BoxDecoration(
              color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              BottomSheetHeader(title: 'Record Payment', subtitle: '${sale.no} — Outstanding: ${AppFormatters.tzs(sale.outstanding)}'),
              const SizedBox(height: 14),
              TextFormField(
                controller: ctrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Amount Received (TZS)'),
                style: AppTextStyles.moneyLarge,
              ),
              const SizedBox(height: 16),
              PrimaryButton(
                label: 'Confirm Payment',
                icon: Icons.check_circle_outline,
                onPressed: () {
                  final amt = double.tryParse(ctrl.text) ?? 0;
                  if (amt > 0) onPay(amt);
                  Navigator.pop(context);
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

class _SaleStat extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _SaleStat({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value,
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: color)),
        const SizedBox(height: 2),
        Text(label, style: AppTextStyles.caption, textAlign: TextAlign.center),
      ],
    );
  }
}




