import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  static const Color primary = Color(0xFF063B8B);
  static const Color primaryDark = Color(0xFF042A65);
  static const Color primaryLight = Color(0xFF1A5AC7);
  static const Color primarySurface = Color(0xFFEEF3FF);

  static const Color accent = Color(0xFF0EA5E9);
  static const Color accentDark = Color(0xFF0284C7);
  static const Color accentLight = Color(0xFFBAE6FD);

  static const Color success = Color(0xFF16A34A);
  static const Color successLight = Color(0xFFDCFCE7);
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningLight = Color(0xFFFEF3C7);
  static const Color danger = Color(0xFFDC2626);
  static const Color dangerLight = Color(0xFFFEE2E2);
  static const Color info = Color(0xFF0EA5E9);
  static const Color infoLight = Color(0xFFE0F2FE);

  static const Color grey50 = Color(0xFFF8FAFC);
  static const Color grey100 = Color(0xFFF1F5F9);
  static const Color grey200 = Color(0xFFE2E8F0);
  static const Color grey300 = Color(0xFFCBD5E1);
  static const Color grey400 = Color(0xFF94A3B8);
  static const Color grey500 = Color(0xFF64748B);
  static const Color grey600 = Color(0xFF475569);
  static const Color grey700 = Color(0xFF334155);
  static const Color grey800 = Color(0xFF1E293B);
  static const Color grey900 = Color(0xFF0F172A);

  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceVariant = Color(0xFFF8FAFC);
  static const Color divider = Color(0xFFE2E8F0);

  static const Color chart1 = Color(0xFF063B8B);
  static const Color chart2 = Color(0xFF10B981);
  static const Color chart3 = Color(0xFFF59E0B);
  static const Color chart4 = Color(0xFFEF4444);
  static const Color chart5 = Color(0xFF8B5CF6);
  static const Color chart6 = Color(0xFF0EA5E9);

  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF063B8B), Color(0xFF1A5AC7)],
  );

  static const LinearGradient oceanGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF042A65), Color(0xFF0B4DB5), Color(0xFF1A6ED8)],
  );
}

class AppTextStyles {
  static TextStyle get headlineLarge => GoogleFonts.inter(
        fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.grey900);

  static TextStyle get headlineMedium => GoogleFonts.inter(
        fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.grey900);

  static TextStyle get headlineSmall => GoogleFonts.inter(
        fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.grey900);

  static TextStyle get titleLarge => GoogleFonts.inter(
        fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.grey800);

  static TextStyle get titleMedium => GoogleFonts.inter(
        fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.grey700);

  static TextStyle get bodyLarge => GoogleFonts.inter(
        fontSize: 14, fontWeight: FontWeight.w400, color: AppColors.grey700, height: 1.5);

  static TextStyle get bodyMedium => GoogleFonts.inter(
        fontSize: 13, fontWeight: FontWeight.w400, color: AppColors.grey600, height: 1.5);

  static TextStyle get bodySmall => GoogleFonts.inter(
        fontSize: 12, fontWeight: FontWeight.w400, color: AppColors.grey500, height: 1.4);

  static TextStyle get labelLarge => GoogleFonts.inter(
        fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.grey600, letterSpacing: 0.5);

  static TextStyle get labelSmall => GoogleFonts.inter(
        fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.grey500, letterSpacing: 0.5);

  static TextStyle get moneyLarge => GoogleFonts.inter(
        fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.grey900, height: 1.1);

  static TextStyle get moneyMedium => GoogleFonts.inter(
        fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.grey900);

  static TextStyle get caption => GoogleFonts.inter(
        fontSize: 11, fontWeight: FontWeight.w400, color: AppColors.grey400);
}

class AppTheme {
  static ThemeData get light {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        primary: AppColors.primary,
        secondary: AppColors.accent,
        surface: AppColors.surface,
        error: AppColors.danger,
        brightness: Brightness.light,
      ),
      scaffoldBackgroundColor: AppColors.grey50,
      fontFamily: GoogleFonts.inter().fontFamily,
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        systemOverlayStyle: SystemUiOverlayStyle.light,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 17, fontWeight: FontWeight.w600, color: Colors.white),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      cardTheme: CardThemeData(
        color: AppColors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.grey200),
        ),
        margin: EdgeInsets.zero,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          side: const BorderSide(color: AppColors.primary),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.grey200),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.grey200),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.danger),
        ),
        hintStyle: GoogleFonts.inter(fontSize: 14, color: AppColors.grey400),
        labelStyle: GoogleFonts.inter(
            fontSize: 13, color: AppColors.grey500, fontWeight: FontWeight.w500),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.grey400,
        elevation: 0,
        type: BottomNavigationBarType.fixed,
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.divider, thickness: 1, space: 0),
      tabBarTheme: TabBarThemeData(
        labelColor: AppColors.primary,
        unselectedLabelColor: AppColors.grey500,
        indicatorColor: AppColors.primary,
        dividerColor: AppColors.grey200,
        labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600),
        unselectedLabelStyle:
            GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500),
      ),
    );
  }
}

class AppSpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double xxl = 24;
  static const EdgeInsets pagePadding =
      EdgeInsets.symmetric(horizontal: 16, vertical: 12);
  static const EdgeInsets cardPadding = EdgeInsets.all(16);
}

class AppShadows {
  static List<BoxShadow> get card => [
        const BoxShadow(color: AppColors.grey200, blurRadius: 8, offset: Offset(0, 2)),
      ];

  static List<BoxShadow> get elevated => [
        BoxShadow(
            color: const Color(0xFF063B8B).withAlpha(30),
            blurRadius: 20,
            offset: const Offset(0, 8)),
      ];

  static List<BoxShadow> get bottomBar => [
        BoxShadow(
            color: Colors.black.withAlpha(15),
            blurRadius: 16,
            offset: const Offset(0, -4)),
      ];
}

class AppRadius {
  static const double xs = 6;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double xxl = 24;
  static const double full = 100;
}


