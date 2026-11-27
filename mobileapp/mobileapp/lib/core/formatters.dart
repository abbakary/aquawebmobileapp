import 'package:intl/intl.dart';

class AppFormatters {
  static final _currencyFormatter = NumberFormat('#,###', 'en_US');
  static final _kgFormatter = NumberFormat('#,###.#', 'en_US');
  static final _dateFormatter = DateFormat('dd MMM yyyy');
  static final _dateTimeFormatter = DateFormat('dd MMM yyyy, HH:mm');
  static final _shortDateFormatter = DateFormat('dd MMM');

  /// Format as TZS currency: TZS 2,800,000
  static String tzs(double amount) {
    return 'TZS ${_currencyFormatter.format(amount)}';
  }

  /// Format as TZS short: TZS 2.8M or TZS 18.5M
  static String tzsShort(double amount) {
    if (amount >= 1000000) {
      return 'TZS ${(amount / 1000000).toStringAsFixed(1)}M';
    } else if (amount >= 1000) {
      return 'TZS ${(amount / 1000).toStringAsFixed(0)}K';
    }
    return 'TZS ${_currencyFormatter.format(amount)}';
  }

  /// Format as kg weight: 1,250 kg
  static String kg(double weight) {
    return '${_kgFormatter.format(weight)} kg';
  }

  /// Format as short kg: 1.2K kg or 350 kg
  static String kgShort(double weight) {
    if (weight >= 1000) {
      return '${(weight / 1000).toStringAsFixed(1)}K kg';
    }
    return '${weight.toStringAsFixed(0)} kg';
  }

  /// Format number with commas
  static String num(double n) => _currencyFormatter.format(n);

  /// Format date: 04 Nov 2026
  static String date(DateTime dt) => _dateFormatter.format(dt);

  /// Format date string: 04 Nov 2026
  static String dateStr(String? s) {
    if (s == null || s.isEmpty) return '—';
    try {
      return _dateFormatter.format(DateTime.parse(s));
    } catch (_) {
      return s;
    }
  }

  /// Format datetime: 04 Nov 2026, 08:32
  static String dateTime(DateTime dt) => _dateTimeFormatter.format(dt);

  /// Format short date: 04 Nov
  static String shortDate(DateTime dt) => _shortDateFormatter.format(dt);

  /// Format percentage: 12.5%
  static String pct(double v) => '${v.toStringAsFixed(1)}%';

  /// Format litres
  static String litres(double v) => '${_kgFormatter.format(v)} L';
}

extension StringX on String {
  DateTime toDate() {
    try {
      return DateTime.parse(this);
    } catch (_) {
      return DateTime.now();
    }
  }
}

extension DateX on DateTime {
  String toDateString() {
    return '${year.toString().padLeft(4, '0')}-'
        '${month.toString().padLeft(2, '0')}-'
        '${day.toString().padLeft(2, '0')}';
  }

  String toLocalDateTimeString() {
    return '${toDateString()}T${hour.toString().padLeft(2, '0')}:${minute.toString().padLeft(2, '0')}';
  }

  int get daysAgo => DateTime.now().difference(this).inDays;

  bool isWithinDays(int days) =>
      difference(DateTime.now()).inDays <= days && isAfter(DateTime.now());
}


