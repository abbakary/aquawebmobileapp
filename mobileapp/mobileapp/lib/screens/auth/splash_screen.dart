import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme.dart';
import '../../providers/app_state.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _navigate();
  }

  Future<void> _navigate() async {
    await Future.delayed(const Duration(milliseconds: 2200));
    if (!mounted) return;
    final session = ref.read(sessionProvider);
    if (session != null) {
      context.go('/home');
    } else {
      context.go('/landing');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.oceanGradient),
        child: SafeArea(
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withAlpha(51),
                        blurRadius: 30,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: const Center(
                    child: _LogoMark(size: 64),
                  ),
                )
                    .animate()
                    .scale(begin: const Offset(0.6, 0.6), duration: 600.ms, curve: Curves.elasticOut)
                    .fadeIn(duration: 400.ms),

                const SizedBox(height: 24),

                Text(
                  'AquaCatch',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.5,
                  ),
                ).animate().fadeIn(delay: 300.ms, duration: 500.ms).slideY(begin: 0.3, end: 0),

                const SizedBox(height: 6),

                Text(
                  'FishTrade ERP',
                  style: TextStyle(
                    color: Colors.white.withAlpha(191),
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    letterSpacing: 1.5,
                  ),
                ).animate().fadeIn(delay: 450.ms, duration: 500.ms),

                const SizedBox(height: 8),

                Text(
                  'Fish Procurement · Inventory · Sales',
                  style: TextStyle(
                    color: Colors.white.withAlpha(140),
                    fontSize: 12,
                    letterSpacing: 0.3,
                  ),
                ).animate().fadeIn(delay: 600.ms, duration: 500.ms),

                const SizedBox(height: 60),

                SizedBox(
                  width: 28,
                  height: 28,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    color: Colors.white.withAlpha(153),
                  ),
                ).animate().fadeIn(delay: 800.ms),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _LogoMark extends StatelessWidget {
  final double size;
  const _LogoMark({this.size = 48});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(painter: _FishLogoPainter()),
    );
  }
}

class _FishLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.primary
      ..style = PaintingStyle.fill;

    final wavePaint = Paint()
      ..color = AppColors.accent
      ..style = PaintingStyle.fill;

    // Fish body
    final bodyPath = Path();
    bodyPath.moveTo(size.width * 0.65, size.height * 0.5);
    bodyPath.quadraticBezierTo(
        size.width * 0.5, size.height * 0.2, size.width * 0.1, size.height * 0.5);
    bodyPath.quadraticBezierTo(
        size.width * 0.5, size.height * 0.8, size.width * 0.65, size.height * 0.5);
    canvas.drawPath(bodyPath, paint);

    // Tail
    final tailPath = Path();
    tailPath.moveTo(size.width * 0.65, size.height * 0.5);
    tailPath.lineTo(size.width * 0.95, size.height * 0.25);
    tailPath.lineTo(size.width * 0.85, size.height * 0.5);
    tailPath.lineTo(size.width * 0.95, size.height * 0.75);
    tailPath.close();
    canvas.drawPath(tailPath, paint);

    // Eye
    final eyePaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
    canvas.drawCircle(
        Offset(size.width * 0.28, size.height * 0.44), size.width * 0.05, eyePaint);

    // Wave underneath
    final wavePath = Path();
    wavePath.moveTo(0, size.height * 0.75);
    wavePath.quadraticBezierTo(size.width * 0.25, size.height * 0.68,
        size.width * 0.5, size.height * 0.75);
    wavePath.quadraticBezierTo(
        size.width * 0.75, size.height * 0.82, size.width, size.height * 0.75);
    wavePath.lineTo(size.width, size.height);
    wavePath.lineTo(0, size.height);
    wavePath.close();
    canvas.drawPath(wavePath, wavePaint..color = AppColors.accent.withAlpha(77));
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}


