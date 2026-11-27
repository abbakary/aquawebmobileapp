import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/app_state.dart';
import '../screens/auth/splash_screen.dart';
import '../screens/auth/landing_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/dashboard/home_screen.dart';
import '../screens/suppliers/suppliers_screen.dart';
import '../screens/procurement/procurement_screen.dart';
import '../screens/quality/quality_screen.dart';
import '../screens/inventory/inventory_screen.dart';
import '../screens/sales/sales_screen.dart';
import '../screens/payments/payments_screen.dart';
import '../screens/fuel/fuel_screen.dart';
import '../screens/transport/transport_screen.dart';
import '../screens/expenses/expenses_screen.dart';
import '../screens/staff/staff_screen.dart';
import '../screens/compliance/compliance_screen.dart';
import '../screens/reports/reports_screen.dart';
import '../screens/maintenance/maintenance_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final session = ref.watch(sessionProvider);

  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      final loggedIn = session != null;
      final onAuthPages = state.matchedLocation == '/login' ||
          state.matchedLocation == '/landing' ||
          state.matchedLocation == '/splash';

      if (!loggedIn && !onAuthPages) { return '/landing'; }
      if (loggedIn && (state.matchedLocation == '/login' || state.matchedLocation == '/landing')) { return '/home'; }
      return null;
    },
    routes: [
      GoRoute(path: '/splash',      builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/landing',     builder: (_, __) => const LandingScreen()),
      GoRoute(path: '/login',       builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/home',        builder: (_, __) => const HomeScreen()),
      GoRoute(path: '/suppliers',   builder: (_, __) => const SuppliersScreen()),
      GoRoute(path: '/procurement', builder: (_, __) => const ProcurementScreen()),
      GoRoute(path: '/quality',     builder: (_, __) => const QualityScreen()),
      GoRoute(path: '/inventory',   builder: (_, __) => const InventoryScreen()),
      GoRoute(path: '/sales',       builder: (_, __) => const SalesScreen()),
      GoRoute(path: '/payments',    builder: (_, __) => const PaymentsScreen()),
      GoRoute(path: '/fuel',        builder: (_, __) => const FuelScreen()),
      GoRoute(path: '/transport',   builder: (_, __) => const TransportScreen()),
      GoRoute(path: '/expenses',    builder: (_, __) => const ExpensesScreen()),
      GoRoute(path: '/staff',       builder: (_, __) => const StaffScreen()),
      GoRoute(path: '/compliance',  builder: (_, __) => const ComplianceScreen()),
      GoRoute(path: '/reports',     builder: (_, __) => const ReportsScreen()),
      GoRoute(path: '/maintenance', builder: (_, __) => const MaintenanceScreen()),
    ],
  );
});

