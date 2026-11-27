import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/models.dart';
import 'seed_data.dart';
import 'api_service.dart';

const _kDataKey = 'aquacatch.branch_data.v1';
const _kSessionKey = 'aquacatch.session.v1';
const _kOnboardedKey = 'aquacatch.onboarded.v1';

/// Session model — now populated from the backend API response
class AppSession {
  final String userId;
  final String username;
  final String name;
  final String role;
  final String companyName;
  final String phone;
  final List<String> branchIds;

  const AppSession({
    required this.userId,
    required this.username,
    required this.name,
    required this.role,
    required this.companyName,
    this.phone = '',
    this.branchIds = const [],
  });

  Map<String, dynamic> toJson() => {
        'userId': userId,
        'username': username,
        'name': name,
        'role': role,
        'companyName': companyName,
        'phone': phone,
        'branchIds': branchIds,
      };

  factory AppSession.fromJson(Map<String, dynamic> j) => AppSession(
        userId: j['userId'] ?? '',
        username: j['username'] ?? '',
        name: j['name'] ?? '',
        role: j['role'] ?? 'Purchasing Officer',
        companyName: j['companyName'] ?? '',
        phone: j['phone'] ?? '',
        branchIds: List<String>.from(j['branchIds'] ?? []),
      );

  /// Build an AppSession from the backend ApiSession
  factory AppSession.fromApiSession(ApiSession api) => AppSession(
        userId: api.userId,
        username: api.username,
        name: api.name,
        role: api.role,
        companyName: api.companyName,
        phone: api.phone,
        branchIds: api.branchIds,
      );
}

/// Demo staff — kept for offline fallback / local data seeding
final _demoStaff = [
  StaffMember(
    id: 'u0',
    name: 'John Mwangi (Director)',
    phone: '0754 100 001',
    username: 'owner',
    pin: _hashPin('1234'),
    role: 'Owner',
    salary: 2500000,
    active: true,
    branch: 'all',
  ),
  StaffMember(
    id: 'u1',
    name: 'Asha Komba (Operations)',
    phone: '0754 100 002',
    username: 'manager',
    pin: _hashPin('1234'),
    role: 'General Manager',
    salary: 1800000,
    active: true,
    branch: 'all',
  ),
  StaffMember(
    id: 'u2',
    name: 'Juma Said (Landing Officer)',
    phone: '0754 100 003',
    username: 'juma',
    pin: _hashPin('1111'),
    role: 'Purchasing Officer',
    salary: 950000,
    active: true,
    branch: 'br1',
  ),
  StaffMember(
    id: 'u3',
    name: 'Neema Paul (Quality Lead)',
    phone: '0754 100 004',
    username: 'neema',
    pin: _hashPin('2222'),
    role: 'Quality Inspector',
    salary: 1100000,
    active: true,
    branch: 'br1',
  ),
];

String _hashPin(String pin) {
  // Simple hash for demo — in production use bcrypt/argon2
  var h = 5381;
  for (final c in 'ft$pin'.codeUnits) {
    h = ((h << 5) + h + c) & 0xFFFFFFFF;
  }
  return h.toString();
}

class StorageService {
  static late SharedPreferences _prefs;

  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    // Initialize the API service with the same SharedPreferences instance
    await ApiService.init(_prefs);
  }

  /// Expose prefs for ApiService initialization
  static SharedPreferences get prefs => _prefs;

  // ── Branch Data ─────────────────────────────────────────────────────────────
  static BranchData loadData() {
    final raw = _prefs.getString(_kDataKey);
    if (raw == null) {
      final data = seedBranchData();
      saveData(data);
      return data;
    }
    try {
      final json = jsonDecode(raw) as Map<String, dynamic>;
      return BranchData.fromJson(json);
    } catch (_) {
      final data = seedBranchData();
      saveData(data);
      return data;
    }
  }

  static Future<void> saveData(BranchData data) async {
    await _prefs.setString(_kDataKey, jsonEncode(data.toJson()));
  }

  // ── Session ──────────────────────────────────────────────────────────────────
  static AppSession? loadSession() {
    final raw = _prefs.getString(_kSessionKey);
    if (raw == null) return null;
    try {
      return AppSession.fromJson(jsonDecode(raw));
    } catch (_) {
      return null;
    }
  }

  static Future<void> saveSession(AppSession session) async {
    await _prefs.setString(_kSessionKey, jsonEncode(session.toJson()));
  }

  static Future<void> clearSession() async {
    await _prefs.remove(_kSessionKey);
    await ApiService.clearToken();
  }

  // ── Demo Staff ───────────────────────────────────────────────────────────────
  static List<StaffMember> loadStaff() {
    // For demo purposes return hardcoded staff
    return _demoStaff;
  }

  // ── Login (via backend API) ─────────────────────────────────────────────────
  /// Authenticates against the backend API using username + password.
  /// Returns an AppSession on success, null on failure.
  static Future<AppSession?> login(String username, String password) async {
    try {
      final apiSession = await ApiService.login(username, password);
      return AppSession.fromApiSession(apiSession);
    } catch (_) {
      return null;
    }
  }

  // ── Onboarding ───────────────────────────────────────────────────────────────
  static bool get isOnboarded => _prefs.getBool(_kOnboardedKey) ?? false;
  static Future<void> setOnboarded() => _prefs.setBool(_kOnboardedKey, true);

  // ── Reset ─────────────────────────────────────────────────────────────────────
  static Future<void> resetData() async {
    await _prefs.remove(_kDataKey);
  }
}



