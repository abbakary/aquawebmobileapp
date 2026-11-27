import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../core/theme.dart';
import '../core/formatters.dart';

// ─── Status Badge ─────────────────────────────────────────────────────────────
enum BadgeVariant { green, red, amber, blue, grey, teal }

class AppBadge extends StatelessWidget {
  final String label;
  final BadgeVariant variant;
  final double? fontSize;

  const AppBadge({
    super.key,
    required this.label,
    this.variant = BadgeVariant.grey,
    this.fontSize,
  });

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    switch (variant) {
      case BadgeVariant.green:
        bg = AppColors.successLight;
        fg = AppColors.success;
        break;
      case BadgeVariant.red:
        bg = AppColors.dangerLight;
        fg = AppColors.danger;
        break;
      case BadgeVariant.amber:
        bg = AppColors.warningLight;
        fg = const Color(0xFFB45309);
        break;
      case BadgeVariant.blue:
        bg = AppColors.primarySurface;
        fg = AppColors.primary;
        break;
      case BadgeVariant.teal:
        bg = const Color(0xFFCCFBF1);
        fg = const Color(0xFF0D9488);
        break;
      case BadgeVariant.grey:
        bg = AppColors.grey100;
        fg = AppColors.grey600;
        break;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AppRadius.full),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: fontSize ?? 11,
          fontWeight: FontWeight.w600,
          color: fg,
          height: 1.2,
        ),
      ),
    );
  }
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
class StatCard extends StatelessWidget {
  final String title;
  final String value;
  final String? subtitle;
  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final VoidCallback? onTap;

  const StatCard({
    super.key,
    required this.title,
    required this.value,
    this.subtitle,
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: AppColors.grey200),
          boxShadow: AppShadows.card,
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: iconBg,
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: Icon(icon, color: iconColor, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(title, style: AppTextStyles.bodySmall),
                  const SizedBox(height: 2),
                  Text(value,
                      style: AppTextStyles.headlineSmall,
                      overflow: TextOverflow.ellipsis),
                  if (subtitle != null)
                    Text(subtitle!,
                        style: AppTextStyles.caption,
                        overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
          ],
        ),
      ).animate().fadeIn(duration: 300.ms).slideY(begin: 0.1, end: 0),
    );
  }
}

// ─── Section Header ───────────────────────────────────────────────────────────
class SectionHeader extends StatelessWidget {
  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;
  final Widget? trailing;

  const SectionHeader({
    super.key,
    required this.title,
    this.actionLabel,
    this.onAction,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: AppTextStyles.headlineSmall),
        if (trailing != null)
          trailing!
        else if (actionLabel != null)
          TextButton(
            onPressed: onAction,
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: Text(
              actionLabel!,
              style: AppTextStyles.labelLarge.copyWith(color: AppColors.primary),
            ),
          ),
      ],
    );
  }
}

// ─── Supplier / Item List Tile ────────────────────────────────────────────────
class ItemListTile extends StatelessWidget {
  final String title;
  final String subtitle;
  final String? trailing;
  final String? trailingCaption;
  final Widget? leadingWidget;
  final Widget? trailingWidget;
  final BadgeVariant? badgeVariant;
  final String? badgeLabel;
  final VoidCallback? onTap;

  const ItemListTile({
    super.key,
    required this.title,
    required this.subtitle,
    this.trailing,
    this.trailingCaption,
    this.leadingWidget,
    this.trailingWidget,
    this.badgeVariant,
    this.badgeLabel,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        color: Colors.transparent,
        child: Row(
          children: [
            if (leadingWidget != null) ...[
              leadingWidget!,
              const SizedBox(width: 12),
            ],
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: AppTextStyles.titleMedium,
                      overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 2),
                  Text(subtitle,
                      style: AppTextStyles.bodySmall,
                      overflow: TextOverflow.ellipsis,
                      maxLines: 2),
                ],
              ),
            ),
            const SizedBox(width: 8),
            if (trailingWidget != null)
              trailingWidget!
            else
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (badgeLabel != null)
                    AppBadge(label: badgeLabel!, variant: badgeVariant ?? BadgeVariant.green)
                  else if (trailing != null)
                    Text(trailing!,
                        style: AppTextStyles.titleMedium
                            .copyWith(color: AppColors.primary)),
                  if (trailingCaption != null)
                    Text(trailingCaption!, style: AppTextStyles.caption),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

// ─── Avatar Circle ────────────────────────────────────────────────────────────
class AvatarCircle extends StatelessWidget {
  final String name;
  final double size;
  final Color? bgColor;

  const AvatarCircle({
    super.key,
    required this.name,
    this.size = 42,
    this.bgColor,
  });

  String get _initials {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }

  Color get _bg {
    if (bgColor != null) return bgColor!;
    final colors = [
      const Color(0xFF1E40AF),
      const Color(0xFF065F46),
      const Color(0xFF7C3AED),
      const Color(0xFFB45309),
      const Color(0xFF0E7490),
    ];
    return colors[name.hashCode.abs() % colors.length];
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: _bg,
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          _initials,
          style: TextStyle(
            color: Colors.white,
            fontSize: size * 0.35,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}

// ─── Progress Step Bar ────────────────────────────────────────────────────────
class StepProgressBar extends StatelessWidget {
  final List<String> steps;
  final int currentStep;

  const StepProgressBar({
    super.key,
    required this.steps,
    required this.currentStep,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(steps.length, (i) {
        final isCompleted = i < currentStep;
        final isCurrent = i == currentStep;
        return Expanded(
          child: Row(
            children: [
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: isCompleted
                          ? AppColors.success
                          : isCurrent
                              ? AppColors.primary
                              : AppColors.grey200,
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: isCompleted
                          ? const Icon(Icons.check, color: Colors.white, size: 14)
                          : Text(
                              '${i + 1}',
                              style: TextStyle(
                                color: isCurrent ? Colors.white : AppColors.grey500,
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    steps[i],
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: isCurrent ? FontWeight.w600 : FontWeight.w400,
                      color: isCurrent
                          ? AppColors.primary
                          : isCompleted
                              ? AppColors.success
                              : AppColors.grey400,
                    ),
                    textAlign: TextAlign.center,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
              if (i < steps.length - 1)
                Expanded(
                  child: Container(
                    height: 2,
                    margin: const EdgeInsets.only(bottom: 20),
                    color: isCompleted ? AppColors.success : AppColors.grey200,
                  ),
                ),
            ],
          ),
        );
      }),
    );
  }
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
class InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final bool highlight;
  final Color? valueColor;

  const InfoRow({
    super.key,
    required this.label,
    required this.value,
    this.highlight = false,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppTextStyles.bodyMedium),
          Text(
            value,
            style: AppTextStyles.bodyMedium.copyWith(
              fontWeight: highlight ? FontWeight.w700 : FontWeight.w600,
              color: valueColor ?? AppColors.grey800,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Empty State ──────────────────────────────────────────────────────────────
class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;

  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: AppColors.primarySurface,
                borderRadius: BorderRadius.circular(AppRadius.xl),
              ),
              child: Icon(icon, color: AppColors.primary, size: 36),
            ),
            const SizedBox(height: 16),
            Text(title,
                style: AppTextStyles.headlineSmall,
                textAlign: TextAlign.center),
            const SizedBox(height: 6),
            Text(subtitle,
                style: AppTextStyles.bodyMedium,
                textAlign: TextAlign.center),
            if (actionLabel != null) ...[
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: onAction,
                child: Text(actionLabel!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ─── Search Bar ───────────────────────────────────────────────────────────────
class AppSearchBar extends StatelessWidget {
  final String hint;
  final ValueChanged<String> onChanged;
  final TextEditingController? controller;

  const AppSearchBar({
    super.key,
    this.hint = 'Search...',
    required this.onChanged,
    this.controller,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 44,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.grey200),
      ),
      child: TextField(
        controller: controller,
        onChanged: onChanged,
        style: AppTextStyles.bodyLarge,
        decoration: InputDecoration(
          border: InputBorder.none,
          contentPadding: EdgeInsets.zero,
          hintText: hint,
          hintStyle: AppTextStyles.bodyMedium,
          prefixIcon: const Icon(Icons.search, color: AppColors.grey400, size: 20),
          suffixIcon: controller?.text.isNotEmpty == true
              ? GestureDetector(
                  onTap: () {
                    controller?.clear();
                    onChanged('');
                  },
                  child: const Icon(Icons.close, color: AppColors.grey400, size: 18),
                )
              : null,
        ),
      ),
    );
  }
}

// ─── Card Container ───────────────────────────────────────────────────────────
class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;
  final VoidCallback? onTap;
  final Color? backgroundColor;
  final double? borderRadius;

  const AppCard({
    super.key,
    required this.child,
    this.padding,
    this.onTap,
    this.backgroundColor,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: backgroundColor ?? AppColors.surface,
          borderRadius: BorderRadius.circular(borderRadius ?? AppRadius.lg),
          border: Border.all(color: AppColors.grey200),
          boxShadow: AppShadows.card,
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(borderRadius ?? AppRadius.lg),
          child: Padding(
            padding: padding ?? AppSpacing.cardPadding,
            child: child,
          ),
        ),
      ),
    );
  }
}

// ─── Gradient Header Card ─────────────────────────────────────────────────────
class GradientHeaderCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final List<Widget> stats;
  final Widget? trailing;

  const GradientHeaderCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.stats,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        boxShadow: AppShadows.elevated,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                          fontWeight: FontWeight.w500)),
                  const SizedBox(height: 2),
                  Text(subtitle,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w700)),
                ],
              ),
              if (trailing != null) trailing!,
            ],
          ),
          const SizedBox(height: 16),
          Row(children: stats),
        ],
      ),
    );
  }
}

// ─── Stat Chip ────────────────────────────────────────────────────────────────
class StatChip extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const StatChip({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        margin: const EdgeInsets.only(right: 8),
        decoration: BoxDecoration(
          color: Colors.white.withAlpha(38),
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: Colors.white.withAlpha(51)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: Colors.white70, size: 16),
            const SizedBox(height: 4),
            Text(value,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w700)),
            Text(label,
                style: const TextStyle(color: Colors.white60, fontSize: 10)),
          ],
        ),
      ),
    );
  }
}

// ─── Fish Species Icon ────────────────────────────────────────────────────────
class FishSpeciesIcon extends StatelessWidget {
  final String species;
  final double size;

  const FishSpeciesIcon({super.key, required this.species, this.size = 36});

  String get emoji {
    if (species.contains('Nile Perch')) return '🐟';
    if (species.contains('Tilapia')) return '🐠';
    if (species.contains('Sardines') || species.contains('Dagaa')) return '🐡';
    if (species.contains('Catfish')) return '🦈';
    return '🐟';
  }

  Color get bgColor {
    if (species.contains('Nile Perch')) return const Color(0xFFDBEAFE);
    if (species.contains('Tilapia')) return const Color(0xFFD1FAE5);
    if (species.contains('Sardines') || species.contains('Dagaa')) return const Color(0xFFFEF3C7);
    if (species.contains('Catfish')) return const Color(0xFFEDE9FE);
    return const Color(0xFFDBEAFE);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(size / 4),
      ),
      child: Center(
        child: Text(emoji, style: TextStyle(fontSize: size * 0.5)),
      ),
    );
  }
}

// ─── Divider with Label ───────────────────────────────────────────────────────
class LabelDivider extends StatelessWidget {
  final String label;

  const LabelDivider({super.key, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: Divider()),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text(label, style: AppTextStyles.caption),
        ),
        const Expanded(child: Divider()),
      ],
    );
  }
}

// ─── Form Field Wrapper ───────────────────────────────────────────────────────
class FieldWrapper extends StatelessWidget {
  final String label;
  final String? hint;
  final Widget child;

  const FieldWrapper({
    super.key,
    required this.label,
    this.hint,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label.toUpperCase(),
                style: AppTextStyles.labelSmall
                    .copyWith(color: AppColors.grey500, letterSpacing: 0.8)),
            if (hint != null) Text(hint!, style: AppTextStyles.caption),
          ],
        ),
        const SizedBox(height: 6),
        child,
      ],
    );
  }
}

// ─── Offline Banner ───────────────────────────────────────────────────────────
class OfflineBanner extends StatelessWidget {
  const OfflineBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: AppColors.warning,
      child: Row(
        children: [
          const Icon(Icons.wifi_off, color: Colors.white, size: 16),
          const SizedBox(width: 8),
          Text(
            'Offline Mode — data saved locally',
            style: AppTextStyles.bodySmall.copyWith(color: Colors.white),
          ),
        ],
      ),
    );
  }
}

// ─── Amount Highlight Box ─────────────────────────────────────────────────────
class AmountHighlightBox extends StatelessWidget {
  final String label;
  final String amount;
  final Color? bgColor;
  final Color? textColor;

  const AmountHighlightBox({
    super.key,
    required this.label,
    required this.amount,
    this.bgColor,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bgColor ?? AppColors.primarySurface,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.primary.withAlpha(51)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(label,
              style: AppTextStyles.labelLarge.copyWith(color: AppColors.primary)),
          const SizedBox(height: 4),
          Text(
            amount,
            style: AppTextStyles.moneyLarge.copyWith(
              color: textColor ?? AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Primary Button ───────────────────────────────────────────────────────────
class PrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool isLoading;
  final bool fullWidth;

  const PrimaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.isLoading = false,
    this.fullWidth = true,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: fullWidth ? double.infinity : null,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        child: isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                    strokeWidth: 2, color: Colors.white),
              )
            : Row(
                mainAxisSize: fullWidth ? MainAxisSize.max : MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (icon != null) ...[
                    Icon(icon, size: 18),
                    const SizedBox(width: 8),
                  ],
                  Text(label),
                ],
              ),
      ),
    );
  }
}

// ─── Bottom Sheet Header ──────────────────────────────────────────────────────
class BottomSheetHeader extends StatelessWidget {
  final String title;
  final String? subtitle;

  const BottomSheetHeader({super.key, required this.title, this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 36,
          height: 4,
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            color: AppColors.grey300,
            borderRadius: BorderRadius.circular(AppRadius.full),
          ),
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: AppTextStyles.headlineMedium),
                if (subtitle != null)
                  Text(subtitle!, style: AppTextStyles.bodySmall),
              ],
            ),
            IconButton(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.close),
              style: IconButton.styleFrom(
                backgroundColor: AppColors.grey100,
                minimumSize: const Size(36, 36),
                maximumSize: const Size(36, 36),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// ─── Fuel Tank Gauge ──────────────────────────────────────────────────────────
class FuelTankGauge extends StatelessWidget {
  final String name;
  final String fuelType;
  final double current;
  final double capacity;

  const FuelTankGauge({
    super.key,
    required this.name,
    required this.fuelType,
    required this.current,
    required this.capacity,
  });

  @override
  Widget build(BuildContext context) {
    final pct = capacity > 0 ? (current / capacity).clamp(0.0, 1.0) : 0.0;
    final color = pct > 0.5 ? AppColors.success : pct > 0.25 ? AppColors.warning : AppColors.danger;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.grey200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, style: AppTextStyles.titleMedium),
                  Text(fuelType, style: AppTextStyles.caption),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: color.withAlpha(26),
                  borderRadius: BorderRadius.circular(AppRadius.full),
                ),
                child: Text(
                  '${(pct * 100).round()}%',
                  style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: color),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(AppRadius.full),
            child: LinearProgressIndicator(
              value: pct,
              minHeight: 8,
              backgroundColor: AppColors.grey100,
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '${AppFormatters.litres(current)} / ${AppFormatters.litres(capacity)}',
            style: AppTextStyles.caption,
          ),
        ],
      ),
    );
  }
}


