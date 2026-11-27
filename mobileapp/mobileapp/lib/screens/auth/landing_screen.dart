import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme.dart';

class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key});

  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen> {
  int _page = 0;
  final _controller = PageController();

  final _pages = const [
    _OnboardPage(
      icon: Icons.set_meal_rounded,
      title: 'Fish Procurement\n& Weighing',
      body: 'Record every catch at the landing site with digital scale integration and auto-grading.',
      color: Color(0xFF063B8B),
    ),
    _OnboardPage(
      icon: Icons.warehouse_rounded,
      title: 'Inventory &\nCold Chain',
      body: 'Track stock across cold rooms from 0°C to −18°C. FIFO dispatch with batch traceability.',
      color: Color(0xFF0E7490),
    ),
    _OnboardPage(
      icon: Icons.local_gas_station_rounded,
      title: 'Fuel Credit &\nSettlements',
      body: 'Issue fuel to fishermen on credit and auto-deduct debts from their fish purchase payouts.',
      color: Color(0xFF065F46),
    ),
    _OnboardPage(
      icon: Icons.bar_chart_rounded,
      title: 'Real-time\nReports & P&L',
      body: 'Full profit & loss, cost breakdown, and species-level analytics — all offline-capable.',
      color: Color(0xFF6D28D9),
    ),
  ];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color = _pages[_page].color;
    final size = MediaQuery.of(context).size;

    return Scaffold(
      body: AnimatedContainer(
        duration: const Duration(milliseconds: 400),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [color, color.withAlpha(217), Colors.white],
            stops: const [0, 0.42, 1],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // ── Top bar ──────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                child: Row(
                  children: [
                    Container(
                      width: 40, height: 40,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(11),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withAlpha(26),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: const Center(
                          child: Text('🐟', style: TextStyle(fontSize: 20))),
                    ),
                    const SizedBox(width: 10),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('AquaCatch',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.w800)),
                        Text('FishTrade ERP',
                            style: TextStyle(
                                color: Colors.white.withAlpha(179),
                                fontSize: 11)),
                      ],
                    ),
                    const Spacer(),
                    TextButton(
                      onPressed: () => context.go('/login'),
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      ),
                      child: const Text('Sign In',
                          style: TextStyle(
                              fontWeight: FontWeight.w600, fontSize: 13)),
                    ),
                  ],
                ),
              ),

              // ── PageView — takes remaining space ─────────────────────
              Expanded(
                child: PageView.builder(
                  controller: _controller,
                  onPageChanged: (i) => setState(() => _page = i),
                  itemCount: _pages.length,
                  itemBuilder: (_, i) => _pages[i],
                ),
              ),

              // ── Bottom: dots + buttons ────────────────────────────────
              Padding(
                padding: EdgeInsets.fromLTRB(
                  20,
                  8,
                  20,
                  // extra bottom padding on short screens
                  size.height < 600 ? 8 : 20,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Page indicator dots
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(_pages.length, (i) {
                        final isActive = i == _page;
                        return AnimatedContainer(
                          duration: const Duration(milliseconds: 250),
                          width: isActive ? 22 : 7,
                          height: 7,
                          margin: const EdgeInsets.symmetric(horizontal: 3),
                          decoration: BoxDecoration(
                            color: isActive ? color : AppColors.grey300,
                            borderRadius: BorderRadius.circular(4),
                          ),
                        );
                      }),
                    ),

                    const SizedBox(height: 16),

                    // Get Started button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => context.go('/login'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: color,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 15),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14)),
                          elevation: 0,
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text('Get Started',
                                style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700)),
                            SizedBox(width: 8),
                            Icon(Icons.arrow_forward_rounded, size: 18),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 8),

                    // Sign in link
                    GestureDetector(
                      onTap: () => context.go('/login'),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        child: Text(
                          'Sign in to existing account',
                          style: TextStyle(
                            fontSize: 13,
                            color: color,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Onboard Page ─────────────────────────────────────────────────────────────
class _OnboardPage extends StatelessWidget {
  final IconData icon;
  final String title;
  final String body;
  final Color color;

  const _OnboardPage({
    required this.icon,
    required this.title,
    required this.body,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    // Scale icon container based on available height
    final iconSize = size.height < 600 ? 90.0 : 110.0;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 28),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Icon circle
          Container(
            width: iconSize,
            height: iconSize,
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(51),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Colors.white,
                size: iconSize * 0.48),
          )
              .animate(key: ValueKey(title))
              .scale(
                  begin: const Offset(0.65, 0.65),
                  duration: 500.ms,
                  curve: Curves.elasticOut),

          SizedBox(height: size.height < 600 ? 18 : 28),

          Text(
            title,
            style: TextStyle(
              color: Colors.white,
              fontSize: size.height < 600 ? 22 : 26,
              fontWeight: FontWeight.w800,
              height: 1.2,
            ),
            textAlign: TextAlign.center,
          )
              .animate(key: ValueKey('t$title'))
              .fadeIn(delay: 150.ms, duration: 400.ms)
              .slideY(begin: 0.2, end: 0),

          SizedBox(height: size.height < 600 ? 10 : 14),

          Text(
            body,
            style: TextStyle(
              color: Colors.white.withAlpha(191),
              fontSize: size.height < 600 ? 13 : 14,
              height: 1.55,
            ),
            textAlign: TextAlign.center,
          )
              .animate(key: ValueKey('b$title'))
              .fadeIn(delay: 250.ms, duration: 400.ms),

          SizedBox(height: size.height < 600 ? 16 : 24),

          // Wave decoration
          SizedBox(
            height: 44,
            child: CustomPaint(
              painter: _WavePainter(color),
              size: const Size(double.infinity, 44),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Wave Painter ─────────────────────────────────────────────────────────────
class _WavePainter extends CustomPainter {
  final Color color;
  _WavePainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint1 = Paint()
      ..color = color.withAlpha(38)
      ..style = PaintingStyle.fill;

    final path1 = Path()
      ..moveTo(0, size.height * 0.55)
      ..quadraticBezierTo(size.width * 0.25, size.height * 0.25,
          size.width * 0.5, size.height * 0.55)
      ..quadraticBezierTo(size.width * 0.75, size.height * 0.85,
          size.width, size.height * 0.55)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();
    canvas.drawPath(path1, paint1);

    final paint2 = Paint()
      ..color = color.withAlpha(64)
      ..style = PaintingStyle.fill;

    final path2 = Path()
      ..moveTo(0, size.height * 0.75)
      ..quadraticBezierTo(size.width * 0.3, size.height * 0.45,
          size.width * 0.6, size.height * 0.75)
      ..quadraticBezierTo(
          size.width * 0.8, size.height, size.width, size.height * 0.72)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();
    canvas.drawPath(path2, paint2);
  }

  @override
  bool shouldRepaint(covariant _WavePainter old) => old.color != color;
}
