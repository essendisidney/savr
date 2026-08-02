import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Thin live shell — set via --dart-define or leave empty for demo data.
const supabaseUrl = String.fromEnvironment(
  'SUPABASE_URL',
  defaultValue: 'https://thmxbhpuomggphgdzllk.supabase.co',
);
const supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY', defaultValue: '');

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  if (supabaseAnonKey.isNotEmpty) {
    // ignore: deprecated_member_use
    await Supabase.initialize(url: supabaseUrl, anonKey: supabaseAnonKey);
  }
  runApp(const SavrApp());
}

bool get hasSupabase => supabaseAnonKey.isNotEmpty;

SupabaseClient? get sb => hasSupabase ? Supabase.instance.client : null;

class SavrApp extends StatelessWidget {
  const SavrApp({super.key});

  @override
  Widget build(BuildContext context) {
    const ink = Color(0xFF0B1F1A);
    const forest = Color(0xFF145C45);
    const sand = Color(0xFFF3EDE3);

    return MaterialApp(
      title: 'Savr',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: forest,
          brightness: Brightness.light,
          surface: sand,
        ),
        scaffoldBackgroundColor: sand,
        textTheme: GoogleFonts.dmSansTextTheme().apply(bodyColor: ink, displayColor: ink),
        appBarTheme: AppBarTheme(
          backgroundColor: sand.withValues(alpha: 0.9),
          foregroundColor: ink,
          elevation: 0,
          titleTextStyle: GoogleFonts.fraunces(fontSize: 28, color: ink),
        ),
        useMaterial3: true,
      ),
      home: const HomeShell(),
    );
  }
}

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int index = 0;

  @override
  Widget build(BuildContext context) {
    final pages = [
      const _HomeTab(),
      const _BasketTab(),
      const _FuelTab(),
      const _WalletTab(),
    ];
    return Scaffold(
      body: SafeArea(child: pages[index]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (i) => setState(() => index = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.shopping_basket_outlined), label: 'Basket'),
          NavigationDestination(icon: Icon(Icons.local_gas_station_outlined), label: 'Fuel'),
          NavigationDestination(icon: Icon(Icons.account_balance_wallet_outlined), label: 'Wallet'),
        ],
      ),
    );
  }
}

class _HomeTab extends StatelessWidget {
  const _HomeTab();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Savr', style: GoogleFonts.fraunces(fontSize: 56, height: 1)),
          const SizedBox(height: 16),
          Text(
            'Before you spend, Savr it.',
            style: GoogleFonts.fraunces(fontSize: 28, height: 1.2),
          ),
          const SizedBox(height: 12),
          Text(
            hasSupabase
                ? 'Connected — basket, fuel, and wallet pull Nairobi data.'
                : 'Compare baskets, fuel, and wallet savings before you spend.',
            style: TextStyle(color: Colors.black.withValues(alpha: 0.65)),
          ),
          const SizedBox(height: 24),
          const Text(
            'Map & rides live on the web app: https://savr-teal.vercel.app/map',
            style: TextStyle(fontSize: 13),
          ),
        ],
      ),
    );
  }
}

class _BasketTab extends StatefulWidget {
  const _BasketTab();

  @override
  State<_BasketTab> createState() => _BasketTabState();
}

class _BasketTabState extends State<_BasketTab> {
  List<(String, String, String)> rows = const [
    ('Carrefour', 'KES 3,960', 'Recommended · demo'),
    ('Quickmart', 'KES 4,050', 'Demo'),
    ('Naivas', 'KES 4,280', 'Demo'),
  ];
  bool loading = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final client = sb;
    if (client == null) return;
    setState(() => loading = true);
    try {
      final merchants = await client
          .from('merchants')
          .select('id, name')
          .eq('category', 'grocery')
          .order('name');
      final prices = await client.from('merchant_prices').select('merchant_id, price_cents');
      final byMerchant = <String, int>{};
      for (final p in prices as List) {
        final id = p['merchant_id'] as String;
        byMerchant[id] = (byMerchant[id] ?? 0) + (p['price_cents'] as int? ?? 0);
      }
      final next = <(String, String, String)>[];
      for (final m in merchants as List) {
        final id = m['id'] as String;
        final name = m['name'] as String;
        final cents = byMerchant[id] ?? 0;
        final kes = (cents / 100).round();
        next.add((
          name,
          cents > 0 ? 'KES ${kes.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}' : 'No prices',
          cents > 0 ? '${byMerchant.length} stores ranked' : 'Add prices on web',
        ));
      }
      next.sort((a, b) => a.$2.compareTo(b.$2));
      if (next.isNotEmpty && mounted) setState(() => rows = next.take(8).toList());
    } catch (_) {
      // keep demo
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text('Basket compare', style: GoogleFonts.fraunces(fontSize: 32)),
        const SizedBox(height: 8),
        Text(loading ? 'Loading catalog…' : 'Live merchant totals (sum of listed SKUs)'),
        const SizedBox(height: 20),
        ...rows.map(
          (r) => Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            color: rows.indexOf(r) == 0 ? const Color(0xFFD8F3E7) : Colors.white.withValues(alpha: 0.5),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(r.$1, style: GoogleFonts.fraunces(fontSize: 22)),
                Text(r.$2, style: const TextStyle(fontWeight: FontWeight.w600)),
                Text(r.$3, style: const TextStyle(fontSize: 13)),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _FuelTab extends StatefulWidget {
  const _FuelTab();

  @override
  State<_FuelTab> createState() => _FuelTabState();
}

class _FuelTabState extends State<_FuelTab> {
  List<(String, String)> rows = const [
    ('TotalEnergies', 'KES 179/L'),
    ('Rubis', 'KES 180/L'),
    ('Shell', 'KES 183/L'),
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final client = sb;
    if (client == null) return;
    try {
      final stations = await client
          .from('fuel_stations')
          .select('name, brand, fuel_prices(price_cents_per_litre, fuel_type)')
          .eq('is_active', true);
      final next = <(String, String)>[];
      for (final s in stations as List) {
        final prices = s['fuel_prices'] as List? ?? [];
        final petrol = prices.cast<Map>().where((p) => p['fuel_type'] == 'petrol').toList();
        if (petrol.isEmpty) continue;
        final cents = petrol.first['price_cents_per_litre'] as int;
        final kes = (cents / 100).round();
        next.add(('${s['name']}', 'KES $kes/L'));
      }
      next.sort((a, b) => a.$2.compareTo(b.$2));
      if (next.isNotEmpty && mounted) setState(() => rows = next.take(12).toList());
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text('Fuel nearby', style: GoogleFonts.fraunces(fontSize: 32)),
        ...rows.map((r) => ListTile(title: Text(r.$1), trailing: Text(r.$2))),
      ],
    );
  }
}

class _WalletTab extends StatefulWidget {
  const _WalletTab();

  @override
  State<_WalletTab> createState() => _WalletTabState();
}

class _WalletTabState extends State<_WalletTab> {
  String balance = 'Sign in on web';
  final phoneCtrl = TextEditingController();
  final otpCtrl = TextEditingController();
  String? status;

  Future<void> _refreshWallet() async {
    final client = sb;
    final user = client?.auth.currentUser;
    if (client == null || user == null) return;
    try {
      final row = await client
          .from('wallet_accounts')
          .select('cashback_cents')
          .eq('profile_id', user.id)
          .maybeSingle();
      final cents = row?['cashback_cents'] as int? ?? 0;
      if (mounted) {
        setState(() => balance = 'KES ${(cents / 100).round()}');
      }
    } catch (_) {}
  }

  Future<void> _sendOtp() async {
    final client = sb;
    if (client == null) {
      setState(() => status = 'Set SUPABASE_ANON_KEY to enable auth');
      return;
    }
    // Phone OTP is handled by Savr web API — open web for full Taifa flow.
    setState(() => status = 'Use https://savr-teal.vercel.app/login for phone OTP, then paste session later.');
  }

  @override
  void initState() {
    super.initState();
    _refreshWallet();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Wallet', style: GoogleFonts.fraunces(fontSize: 32)),
          const SizedBox(height: 24),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            color: const Color(0xFFD8F3E7),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Savings cashback'),
                Text(balance, style: GoogleFonts.fraunces(fontSize: 48)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: phoneCtrl,
            decoration: const InputDecoration(labelText: 'Phone (web OTP)'),
            keyboardType: TextInputType.phone,
          ),
          const SizedBox(height: 8),
          FilledButton(onPressed: _sendOtp, child: const Text('How to sign in')),
          if (status != null) ...[
            const SizedBox(height: 8),
            Text(status!, style: const TextStyle(fontSize: 13)),
          ],
        ],
      ),
    );
  }
}
