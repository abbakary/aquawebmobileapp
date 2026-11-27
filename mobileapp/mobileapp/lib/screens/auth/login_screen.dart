import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme.dart';
import '../../providers/app_state.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _userCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _obscurePass = true;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _userCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });

    final errorMsg = await ref
        .read(sessionProvider.notifier)
        .loginWithError(_userCtrl.text.trim(), _passCtrl.text.trim());

    if (!mounted) return;
    setState(() => _loading = false);

    if (errorMsg == null) {
      context.go('/home');
    } else {
      setState(() => _error = errorMsg);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.oceanGradient),
        child: SafeArea(
          child: Column(
            children: [
              // ── Header ────────────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                child: Column(
                  children: [
                    // Logo
                    Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                              color: Colors.black.withAlpha(38),
                              blurRadius: 20,
                              offset: const Offset(0, 8))
                        ],
                      ),
                      child: const Center(
                          child: Text('🐟', style: TextStyle(fontSize: 36))),
                    )
                        .animate()
                        .scale(begin: const Offset(0.7, 0.7), duration: 500.ms, curve: Curves.elasticOut),

                    const SizedBox(height: 14),

                    const Text('AquaCatch',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 26,
                            fontWeight: FontWeight.w800))
                        .animate()
                        .fadeIn(delay: 200.ms),

                    const Text('FishTrade ERP',
                        style: TextStyle(color: Colors.white60, fontSize: 13))
                        .animate()
                        .fadeIn(delay: 300.ms),

                    const SizedBox(height: 6),

                    const Text('Welcome Back',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w600))
                        .animate()
                        .fadeIn(delay: 350.ms),

                    Text('Sign in to manage your fish business',
                        style: TextStyle(
                            color: Colors.white.withAlpha(166), fontSize: 12))
                        .animate()
                        .fadeIn(delay: 400.ms),
                  ],
                ),
              ),

              // ── Form Card ─────────────────────────────────────────────────
              Expanded(
                child: Container(
                  width: double.infinity,
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                  ),
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 4),

                          // Error banner
                          if (_error != null) ...[
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppColors.dangerLight,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: AppColors.danger.withAlpha(77)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.error_outline,
                                      color: AppColors.danger, size: 16),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(_error!,
                                        style: AppTextStyles.bodySmall
                                            .copyWith(color: AppColors.danger)),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),
                          ],

                          // Username field
                          TextFormField(
                            controller: _userCtrl,
                            decoration: const InputDecoration(
                              labelText: 'Username',
                              prefixIcon: Icon(Icons.person_outline,
                                  color: AppColors.grey400),
                            ),
                            keyboardType: TextInputType.text,
                            autocorrect: false,
                            enableSuggestions: false,
                            textInputAction: TextInputAction.next,
                            validator: (v) =>
                                v == null || v.trim().isEmpty ? 'Enter username' : null,
                          ),
                          const SizedBox(height: 14),

                          // Password field
                          TextFormField(
                            controller: _passCtrl,
                            obscureText: _obscurePass,
                            decoration: InputDecoration(
                              labelText: 'Password',
                              prefixIcon: const Icon(Icons.lock_outline,
                                  color: AppColors.grey400),
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscurePass
                                      ? Icons.visibility_outlined
                                      : Icons.visibility_off_outlined,
                                  color: AppColors.grey400,
                                ),
                                onPressed: () =>
                                    setState(() => _obscurePass = !_obscurePass),
                              ),
                            ),
                            keyboardType: TextInputType.visiblePassword,
                            textInputAction: TextInputAction.done,
                            onFieldSubmitted: (_) => _login(),
                            validator: (v) =>
                                v == null || v.trim().isEmpty ? 'Enter password' : null,
                          ),
                          const SizedBox(height: 8),

                          // Remember me
                          Row(
                            children: [
                              Icon(Icons.check_box_outlined,
                                  color: AppColors.primary, size: 18),
                              const SizedBox(width: 6),
                              Text('Remember me',
                                  style: AppTextStyles.bodyMedium),
                              const Spacer(),
                              TextButton(
                                onPressed: () {},
                                style: TextButton.styleFrom(
                                  padding: EdgeInsets.zero,
                                  minimumSize: Size.zero,
                                ),
                                child: Text('Forgot password?',
                                    style: AppTextStyles.bodyMedium.copyWith(
                                        color: AppColors.primary)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),

                          // Sign In Button
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: _loading ? null : _login,
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(14)),
                              ),
                              child: _loading
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(
                                          strokeWidth: 2, color: Colors.white),
                                    )
                                  : const Text('Sign In',
                                      style: TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w700)),
                            ),
                          ),

                          const SizedBox(height: 24),

                          // Or continue with
                          const _LabelDivider(label: 'Or continue with'),
                          const SizedBox(height: 16),

                          Row(
                            children: [
                              Expanded(
                                child: _SocialBtn(
                                  icon: Icons.g_mobiledata,
                                  label: 'Google',
                                  onTap: () {},
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _SocialBtn(
                                  icon: Icons.window,
                                  label: 'Microsoft',
                                  onTap: () {},
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 20),

                          Center(
                            child: TextButton(
                              onPressed: () {},
                              child: Text(
                                'Create an Account',
                                style: AppTextStyles.bodyMedium
                                    .copyWith(color: AppColors.primary,
                                    fontWeight: FontWeight.w600),
                              ),
                            ),
                          ),

                          const SizedBox(height: 16),

                          // Helpful hint
                          Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: AppColors.primarySurface,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                  color: AppColors.primary.withAlpha(51)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Icon(Icons.info_outline,
                                        color: AppColors.primary, size: 16),
                                    const SizedBox(width: 6),
                                    Text('Sign In Help',
                                        style: AppTextStyles.labelLarge
                                            .copyWith(color: AppColors.primary)),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Use the same username and password you created when registering on the web portal.',
                                  style: AppTextStyles.bodySmall.copyWith(
                                    color: AppColors.grey600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1, end: 0),
                    ),
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

class _LabelDivider extends StatelessWidget {
  final String label;
  const _LabelDivider({required this.label});

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

class _SocialBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _SocialBtn({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: 20, color: AppColors.grey700),
      label: Text(label, style: AppTextStyles.bodyMedium),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 12),
        side: const BorderSide(color: AppColors.grey200),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }
}


