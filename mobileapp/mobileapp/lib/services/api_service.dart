// ─── FishTrade ERP — Mobile API Client ────────────────────────────────────────
// HTTP client using package:http (cross-platform: Android, iOS, Web, Desktop).
// Authenticates against the same backend API as the web app.

import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

const _kTokenKey = 'aquacatch.api_token.v1';
const _kSessionKey = 'aquacatch.session.v1';
const _kBaseUrlKey = 'aquacatch.api_base_url.v1';

/// Lightweight API error
class ApiError implements Exception {
  final int statusCode;
  final String message;
  ApiError(this.statusCode, this.message);

  @override
  String toString() => message;
}

/// Session data returned by the backend after login / register
class ApiSession {
  final String accessToken;
  final String userId;
  final String username;
  final String name;
  final String role;
  final String phone;
  final List<String> branchIds;
  final Map<String, dynamic> permissions;
  final List<dynamic> moduleKeys;
  final bool active;

  // Tenant info
  final String tenantId;
  final String companyName;
  final String tenantSlug;
  final String tenantPlan;
  final String tenantStatus;

  const ApiSession({
    required this.accessToken,
    required this.userId,
    required this.username,
    required this.name,
    required this.role,
    this.phone = '',
    this.branchIds = const [],
    this.permissions = const {},
    this.moduleKeys = const [],
    this.active = true,
    required this.tenantId,
    required this.companyName,
    this.tenantSlug = '',
    this.tenantPlan = 'Business',
    this.tenantStatus = 'active',
  });

  Map<String, dynamic> toJson() => {
        'accessToken': accessToken,
        'userId': userId,
        'username': username,
        'name': name,
        'role': role,
        'phone': phone,
        'branchIds': branchIds,
        'permissions': permissions,
        'moduleKeys': moduleKeys,
        'active': active,
        'tenantId': tenantId,
        'companyName': companyName,
        'tenantSlug': tenantSlug,
        'tenantPlan': tenantPlan,
        'tenantStatus': tenantStatus,
      };

  factory ApiSession.fromJson(Map<String, dynamic> j) => ApiSession(
        accessToken: j['accessToken'] ?? '',
        userId: j['userId'] ?? '',
        username: j['username'] ?? '',
        name: j['name'] ?? '',
        role: j['role'] ?? '',
        phone: j['phone'] ?? '',
        branchIds: List<String>.from(j['branchIds'] ?? []),
        permissions: Map<String, dynamic>.from(j['permissions'] ?? {}),
        moduleKeys: List<dynamic>.from(j['moduleKeys'] ?? []),
        active: j['active'] ?? true,
        tenantId: j['tenantId'] ?? '',
        companyName: j['companyName'] ?? '',
        tenantSlug: j['tenantSlug'] ?? '',
        tenantPlan: j['tenantPlan'] ?? 'Business',
        tenantStatus: j['tenantStatus'] ?? 'active',
      );

  /// Build from the backend's login / register response JSON
  factory ApiSession.fromApiResponse(Map<String, dynamic> resp) {
    final user = resp['user'] as Map<String, dynamic>? ?? {};
    final tenant = resp['tenant'] as Map<String, dynamic>? ?? {};
    return ApiSession(
      accessToken: resp['access_token'] ?? '',
      userId: user['id'] ?? '',
      username: user['username'] ?? '',
      name: user['name'] ?? '',
      role: user['role'] ?? '',
      phone: user['phone'] ?? '',
      branchIds: List<String>.from(user['branch_ids'] ?? []),
      permissions: Map<String, dynamic>.from(user['permissions'] ?? {}),
      moduleKeys: List<dynamic>.from(user['module_keys'] ?? []),
      active: user['active'] ?? true,
      tenantId: tenant['id'] ?? '',
      companyName: tenant['name'] ?? '',
      tenantSlug: tenant['slug'] ?? '',
      tenantPlan: tenant['plan'] ?? 'Business',
      tenantStatus: tenant['status'] ?? 'active',
    );
  }
}

/// Central API service that talks to the backend
class ApiService {
  /// Base URL of the backend.
  /// Automatically resolves to host PC IP if on web or physical device.
  static String baseUrl = 'http://192.168.100.144:8000';

  static late SharedPreferences _prefs;
  static String? _token;

  /// Must be called once at app startup
  static Future<void> init(SharedPreferences prefs) async {
    _prefs = prefs;
    _token = _prefs.getString(_kTokenKey);

    // If custom URL is saved, use it
    final savedUrl = _prefs.getString(_kBaseUrlKey);
    if (savedUrl != null && savedUrl.isNotEmpty) {
      baseUrl = savedUrl;
    } else if (kIsWeb) {
      // In Flutter Web, default to the same host that served the page
      final host = Uri.base.host.isNotEmpty ? Uri.base.host : 'localhost';
      baseUrl = 'http://$host:8000';
    }
  }

  /// Change base URL at runtime (e.g. for testing on different Wi-Fi networks)
  static Future<void> setBaseUrl(String url) async {
    baseUrl = url;
    await _prefs.setString(_kBaseUrlKey, url);
  }

  // ── Token management ────────────────────────────────────────────────────────
  static String? get token => _token;

  static Future<void> _saveToken(String token) async {
    _token = token;
    await _prefs.setString(_kTokenKey, token);
  }

  static Future<void> clearToken() async {
    _token = null;
    await _prefs.remove(_kTokenKey);
    await _prefs.remove(_kSessionKey);
  }

  // ── Session persistence ─────────────────────────────────────────────────────
  static Future<void> saveSession(ApiSession session) async {
    await _prefs.setString(_kSessionKey, jsonEncode(session.toJson()));
  }

  static ApiSession? loadSession() {
    final raw = _prefs.getString(_kSessionKey);
    if (raw == null) return null;
    try {
      return ApiSession.fromJson(jsonDecode(raw));
    } catch (_) {
      return null;
    }
  }

  // ── Core HTTP using package:http ────────────────────────────────────────────
  static Future<Map<String, dynamic>> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
    Map<String, String>? queryParams,
  }) async {
    final cleanBase = baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
    final uri = Uri.parse('$cleanBase$path').replace(queryParameters: queryParams);

    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (_token != null && _token!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $_token';
    }

    try {
      late http.Response response;
      final encodedBody = body != null ? jsonEncode(body) : null;

      switch (method) {
        case 'GET':
          response = await http.get(uri, headers: headers);
          break;
        case 'POST':
          response = await http.post(uri, headers: headers, body: encodedBody);
          break;
        case 'PATCH':
          response = await http.patch(uri, headers: headers, body: encodedBody);
          break;
        case 'PUT':
          response = await http.put(uri, headers: headers, body: encodedBody);
          break;
        case 'DELETE':
          response = await http.delete(uri, headers: headers);
          break;
        default:
          response = await http.get(uri, headers: headers);
      }

      Map<String, dynamic> data = {};
      if (response.body.isNotEmpty) {
        try {
          data = jsonDecode(response.body) as Map<String, dynamic>;
        } catch (_) {}
      }

      if (response.statusCode >= 400) {
        final detail = data['detail'];
        final msg = detail is String
            ? detail
            : (detail is Map ? detail['message'] ?? 'HTTP ${response.statusCode}' : 'HTTP ${response.statusCode}');
        throw ApiError(response.statusCode, msg.toString());
      }

      return data;
    } on ApiError {
      rethrow;
    } catch (e) {
      throw ApiError(0, 'Connection error: Could not reach server at $cleanBase. $e');
    }
  }

  // ── Auth endpoints ──────────────────────────────────────────────────────────

  /// Login with username + password (same credentials as the web app)
  static Future<ApiSession> login(String username, String password) async {
    final data = await _request('POST', '/api/v1/auth/login', body: {
      'username': username.trim().toLowerCase(),
      'password': password.trim(),
    });
    final session = ApiSession.fromApiResponse(data);
    await _saveToken(session.accessToken);
    await saveSession(session);
    return session;
  }

  /// Get current user info (validates that the stored token is still valid)
  static Future<Map<String, dynamic>> me() async {
    return await _request('GET', '/api/v1/auth/me');
  }

  /// Get bootstrap data (user, tenant, branches)
  static Future<Map<String, dynamic>> bootstrap() async {
    return await _request('GET', '/api/v1/bootstrap');
  }

  /// Logout — clear local token
  static Future<void> logout() async {
    await clearToken();
  }

  /// Check if we have a stored token
  static bool get isAuthenticated => _token != null && _token!.isNotEmpty;

  /// Validate the stored token is still good
  static Future<bool> validateToken() async {
    if (!isAuthenticated) return false;
    try {
      await me();
      return true;
    } catch (_) {
      return false;
    }
  }
}
