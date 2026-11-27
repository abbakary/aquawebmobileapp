import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme.dart';
import '../../core/formatters.dart';
import '../../models/models.dart';
import '../../providers/app_state.dart';
import '../../widgets/app_widgets.dart';
import '../dashboard/main_shell.dart';

class QualityScreen extends ConsumerWidget {
  const QualityScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(branchDataProvider);
    final pending = data.batches.where((b) => b.st == 'pending').toList();
    final inspected = data.batches.where((b) => b.st != 'pending').toList().reversed.toList();

    return MainShell(
      selectedIndex: 4,
      child: Scaffold(
        backgroundColor: AppColors.grey50,
        appBar: AppBar(
          title: const Text('Quality Control'),
          actions: [
            if (pending.isNotEmpty)
              Container(
                margin: const EdgeInsets.only(right: 12),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.warning,
                  borderRadius: BorderRadius.circular(AppRadius.full),
                ),
                child: Text(
                  '${pending.length} Pending',
                  style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                ),
              ),
          ],
        ),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Pending inspections
            if (pending.isNotEmpty) ...[
              Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                        color: AppColors.warning, shape: BoxShape.circle),
                  ),
                  const SizedBox(width: 8),
                  Text('Awaiting Inspection (${pending.length})',
                      style: AppTextStyles.headlineSmall.copyWith(color: AppColors.warning)),
                ],
              ),
              const SizedBox(height: 10),
              ...data.batches.where((b) => b.st == 'pending').toList().asMap().entries.map((e) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _PendingBatchCard(
                      batch: e.value,
                      supplier: data.suppliers.firstWhere(
                        (s) => s.id == e.value.sup,
                        orElse: () =>
                            Supplier(no: '', name: '—', phone: '', site: '', cat: ''),
                      ),
                      onInspect: () => _showInspectSheet(context, ref, e.value),
                    ).animate().fadeIn(delay: (e.key * 80).ms),
                  )),
              const SizedBox(height: 16),
            ],

            if (pending.isEmpty)
              Container(
                padding: const EdgeInsets.all(16),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: AppColors.successLight,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.success.withAlpha(76)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle, color: AppColors.success),
                    const SizedBox(width: 10),
                    Text('All batches inspected!',
                        style: AppTextStyles.bodyMedium.copyWith(color: AppColors.success, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),

            // Inspected
            if (inspected.isNotEmpty) ...[
              Text('Inspection History', style: AppTextStyles.headlineSmall),
              const SizedBox(height: 10),
              ...inspected.take(10).toList().asMap().entries.map((e) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: _InspectedCard(
                      batch: e.value,
                      supplier: data.suppliers.firstWhere(
                        (s) => s.id == e.value.sup,
                        orElse: () =>
                            Supplier(no: '', name: '—', phone: '', site: '', cat: ''),
                      ),
                    ).animate().fadeIn(delay: (e.key * 40).ms),
                  )),
            ],
          ],
        ),
      ),
    );
  }

  void _showInspectSheet(BuildContext context, WidgetRef ref, FishBatch batch) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _InspectSheet(batch: batch),
    );
  }
}

// ─── Inspect Sheet ────────────────────────────────────────────────────────────
class _InspectSheet extends ConsumerStatefulWidget {
  final FishBatch batch;
  const _InspectSheet({required this.batch});

  @override
  ConsumerState<_InspectSheet> createState() => _InspectSheetState();
}

class _InspectSheetState extends ConsumerState<_InspectSheet> {
  int _step = 0;
  String _grade = 'A';
  double _accepted = 0;
  double _temp = 2.0;
  String? _reason;

  // Quality checklist
  final Map<String, bool> _checklist = {
    'Freshness / Appearance (eyes, gills)': false,
    'Temperature (0 – 4°C)': false,
    'No signs of spoilage': false,
    'Size / Uniformity': false,
  };

  @override
  void initState() {
    super.initState();
    _accepted = widget.batch.kg;
    _grade = widget.batch.grade;
  }

  @override
  Widget build(BuildContext context) {
    final data = ref.watch(branchDataProvider);
    final sup = data.suppliers.firstWhere(
      (s) => s.id == widget.batch.sup,
      orElse: () => Supplier(no: '', name: '—', phone: '', site: '', cat: ''),
    );

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
            left: 20,
            right: 20,
            top: 12,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              BottomSheetHeader(
                title: 'Quality Control',
                subtitle: '${widget.batch.sp} — ${AppFormatters.kg(widget.batch.kg)}',
              ),
              const SizedBox(height: 16),

              StepProgressBar(
                steps: const ['Weigh', 'Quality', 'Payment'],
                currentStep: _step + 1,
              ),
              const SizedBox(height: 20),

              // Batch info
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.primarySurface,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    FishSpeciesIcon(species: widget.batch.sp, size: 48),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('${widget.batch.sp} — Grade ${widget.batch.grade}',
                            style: AppTextStyles.headlineSmall.copyWith(color: AppColors.primary)),
                        Text(widget.batch.no, style: AppTextStyles.bodySmall),
                        Text('Supplier: ${sup.name}', style: AppTextStyles.caption),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Grade assignment
              FieldWrapper(
                label: 'Assign Grade',
                child: Row(
                  children: ['A', 'B', 'C'].map((g) {
                    final selected = _grade == g;
                    return Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _grade = g),
                        child: Container(
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: selected ? AppColors.primary : Colors.white,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: selected ? AppColors.primary : AppColors.grey200,
                              width: selected ? 1.5 : 1,
                            ),
                          ),
                          child: Center(
                            child: Text(
                              g,
                              style: TextStyle(
                                color: selected ? Colors.white : AppColors.grey600,
                                fontSize: 20,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),

              const SizedBox(height: 14),

              // Quality checklist
              Text('Quality Checklist', style: AppTextStyles.titleLarge),
              const SizedBox(height: 8),
              ..._checklist.entries.map((e) => CheckboxListTile(
                    value: e.value,
                    onChanged: (v) => setState(() => _checklist[e.key] = v!),
                    title: Text(e.key, style: AppTextStyles.bodyMedium),
                    activeColor: AppColors.success,
                    contentPadding: EdgeInsets.zero,
                    controlAffinity: ListTileControlAffinity.leading,
                  )),

              const SizedBox(height: 12),

              // Temperature
              FieldWrapper(
                label: 'Core Temperature (°C)',
                hint: '≤4°C required',
                child: Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        initialValue: _temp.toStringAsFixed(1),
                        keyboardType: TextInputType.number,
                        onChanged: (v) => setState(() => _temp = double.tryParse(v) ?? _temp),
                        decoration: InputDecoration(
                          suffixText: '°C',
                          suffixStyle: TextStyle(
                            color: _temp <= 4 ? AppColors.success : AppColors.danger,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: _temp <= 4 ? AppColors.successLight : AppColors.dangerLight,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        _temp <= 4 ? '✓ Compliant' : '✗ Too High',
                        style: TextStyle(
                          color: _temp <= 4 ? AppColors.success : AppColors.danger,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // Accepted quantity
              FieldWrapper(
                label: 'Accepted Quantity (kg)',
                hint: 'Total: ${AppFormatters.kg(widget.batch.kg)}',
                child: TextFormField(
                  initialValue: _accepted.toStringAsFixed(1),
                  keyboardType: TextInputType.number,
                  onChanged: (v) => setState(() {
                    final val = double.tryParse(v) ?? _accepted;
                    _accepted = val.clamp(0, widget.batch.kg);
                  }),
                  decoration: const InputDecoration(suffixText: 'kg'),
                  style: AppTextStyles.headlineSmall,
                ),
              ),

              if (_accepted < widget.batch.kg) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.dangerLight,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.warning_amber, color: AppColors.danger, size: 16),
                      const SizedBox(width: 6),
                      Text(
                        'Rejected: ${AppFormatters.kg(widget.batch.kg - _accepted)}',
                        style: AppTextStyles.bodySmall.copyWith(color: AppColors.danger),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 12),

              // Remarks
              FieldWrapper(
                label: 'Remarks (optional)',
                child: TextFormField(
                  onChanged: (v) => setState(() => _reason = v.isEmpty ? null : v),
                  decoration: const InputDecoration(hintText: 'Good quality, accepted.'),
                  maxLines: 2,
                ),
              ),

              const SizedBox(height: 20),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () async {
                    await ref.read(branchDataProvider.notifier).inspectBatch(
                      batchId: widget.batch.id,
                      accepted: _accepted,
                      temp: _temp,
                      reason: _reason,
                    );
                    if (context.mounted) {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            _accepted > 0
                                ? 'Batch accepted: ${AppFormatters.kg(_accepted)}'
                                : 'Batch rejected',
                          ),
                          backgroundColor: _accepted > 0 ? AppColors.success : AppColors.danger,
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                    }
                  },
                  icon: const Icon(Icons.verified, size: 18),
                  label: const Text('Save Quality Inspection'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PendingBatchCard extends StatelessWidget {
  final FishBatch batch;
  final Supplier supplier;
  final VoidCallback onInspect;

  const _PendingBatchCard({
    required this.batch,
    required this.supplier,
    required this.onInspect,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
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
                    Text('${batch.sp} — Grade ${batch.grade}',
                        style: AppTextStyles.headlineSmall),
                    Text('${batch.no} · ${supplier.name}', style: AppTextStyles.bodySmall),
                    Text(AppFormatters.dateStr(batch.date), style: AppTextStyles.caption),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(AppFormatters.kg(batch.kg),
                      style: AppTextStyles.moneyMedium),
                  const AppBadge(label: 'Pending QC', variant: BadgeVariant.amber),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: onInspect,
              icon: const Icon(Icons.verified_user_outlined, size: 16),
              label: const Text('Inspect Now'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 10),
                backgroundColor: AppColors.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _InspectedCard extends StatelessWidget {
  final FishBatch batch;
  final Supplier supplier;

  const _InspectedCard({required this.batch, required this.supplier});

  @override
  Widget build(BuildContext context) {
    final isAccepted = batch.st == 'accepted';
    return AppCard(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          FishSpeciesIcon(species: batch.sp, size: 40),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${batch.sp} · Grade ${batch.grade}',
                    style: AppTextStyles.titleMedium),
                Text('${batch.no} · ${supplier.name}', style: AppTextStyles.caption),
                if (batch.temp > 0)
                  Text('Temp: ${batch.temp.toStringAsFixed(1)}°C', style: AppTextStyles.caption),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              AppBadge(
                label: isAccepted ? 'Accepted' : 'Rejected',
                variant: isAccepted ? BadgeVariant.green : BadgeVariant.red,
              ),
              const SizedBox(height: 2),
              if (isAccepted) Text('${AppFormatters.kg(batch.rem)} rem', style: AppTextStyles.caption),
              if (batch.rej > 0) Text('${AppFormatters.kg(batch.rej)} rej', style: AppTextStyles.caption.copyWith(color: AppColors.danger)),
            ],
          ),
        ],
      ),
    );
  }
}





