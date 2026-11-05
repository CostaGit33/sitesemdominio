import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

const apiBaseUrl = 'https://api.semdominio.online';

void main() {
  runApp(const FutPontosApp());
}

class FutPontosApp extends StatelessWidget {
  const FutPontosApp({super.key});

  @override
  Widget build(BuildContext context) {
    const seed = Color(0xFFE53935);
    return MaterialApp(
      title: 'FutPontos',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF090B10),
        colorScheme: ColorScheme.fromSeed(
          seedColor: seed,
          brightness: Brightness.dark,
          surface: const Color(0xFF11151D),
        ),
        useMaterial3: true,
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xFF171C26),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide.none,
          ),
        ),
      ),
      home: const LoginPage(),
    );
  }
}

class FutPontosApi {
  Future<dynamic> get(String path) async {
    final response = await http
        .get(
          Uri.parse('$apiBaseUrl$path'),
          headers: const {'Accept': 'application/json'},
        )
        .timeout(const Duration(seconds: 12));

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('A API respondeu com status ${response.statusCode}.');
    }
    return jsonDecode(utf8.decode(response.bodyBytes));
  }

  Future<List<Map<String, dynamic>>> list(String path) async {
    final data = await get(path);
    if (data is! List) {
      throw const FormatException('Formato inesperado recebido da API.');
    }
    return data
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
  }
}

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  void _showAuthStatus() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'O login seguro depende de uma rota de autenticação na API. '
          'Nenhuma senha foi enviada ou armazenada.',
        ),
        duration: Duration(seconds: 4),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    width: 76,
                    height: 76,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: const Color(0x22E53935),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: const Color(0x55E53935)),
                    ),
                    child: const Icon(Icons.sports_soccer,
                        size: 42, color: Color(0xFFFF5252)),
                  ),
                  const SizedBox(height: 30),
                  Text('FUTPONTOS',
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                            color: const Color(0xFFFF6262),
                            letterSpacing: 3,
                            fontWeight: FontWeight.w800,
                          )),
                  const SizedBox(height: 8),
                  Text('Seu futebol. Seus números.',
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                          )),
                  const SizedBox(height: 10),
                  Text(
                    'Entre na sua conta para acompanhar sua jornada.',
                    style: TextStyle(color: Colors.white.withValues(alpha: .65)),
                  ),
                  const SizedBox(height: 30),
                  TextField(
                    controller: _email,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    autofillHints: const [AutofillHints.username, AutofillHints.email],
                    decoration: const InputDecoration(
                      labelText: 'E-mail ou usuário',
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _password,
                    obscureText: _obscure,
                    autofillHints: const [AutofillHints.password],
                    decoration: InputDecoration(
                      labelText: 'Senha',
                      prefixIcon: const Icon(Icons.lock_outline),
                      suffixIcon: IconButton(
                        onPressed: () => setState(() => _obscure = !_obscure),
                        icon: Icon(_obscure
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  FilledButton(
                    onPressed: _showAuthStatus,
                    style: FilledButton.styleFrom(
                      minimumSize: const Size.fromHeight(54),
                      backgroundColor: const Color(0xFFE53935),
                    ),
                    child: const Text('Entrar'),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton(
                    onPressed: () => Navigator.of(context).pushReplacement(
                      MaterialPageRoute(
                          builder: (_) => const MainShell(readOnly: true)),
                    ),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(52),
                    ),
                    child: const Text('Explorar versão pública'),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Acesso com conta será ativado quando a API oferecer autenticação segura. '
                    'Por enquanto, a exploração pública é somente leitura.',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.white54,
                          height: 1.5,
                        ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class MainShell extends StatefulWidget {
  const MainShell({super.key, this.readOnly = true});

  final bool readOnly;

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  static const _pages = [
    ('Início', Icons.home_outlined),
    ('Classificação', Icons.leaderboard_outlined),
    ('Jogadores', Icons.groups_outlined),
    ('Desempenho', Icons.insights_outlined),
    ('Mais', Icons.grid_view_rounded),
  ];

  @override
  Widget build(BuildContext context) {
    final page = switch (_index) {
      0 => const HomePage(),
      1 => const DataPage(
          title: 'Classificação',
          subtitle: 'Pontuação oficial da competência atual',
          endpoint: '/jogadores',
          ranking: true,
        ),
      2 => const DataPage(
          title: 'Jogadores',
          subtitle: 'Perfis disponíveis no FutPontos',
          endpoint: '/jogadores',
        ),
      3 => const DataPage(
          title: 'Desempenho',
          subtitle: 'Indicadores e avaliação técnica',
          endpoint: '/desempenho',
          kind: DataPageKind.performance,
        ),
      _ => const MorePage(),
    };

    return Scaffold(
      appBar: AppBar(
        title: const Text('FutPontos',
            style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: .4)),
        actions: [
          if (widget.readOnly)
            const Padding(
              padding: EdgeInsets.only(right: 14),
              child: Center(
                child: Chip(
                  avatar: Icon(Icons.visibility_outlined, size: 15),
                  label: Text('Público'),
                  visualDensity: VisualDensity.compact,
                ),
              ),
            ),
        ],
      ),
      body: SafeArea(child: page),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: [
          for (final item in _pages)
            NavigationDestination(
              icon: Icon(item.$2),
              label: item.$1,
            ),
        ],
      ),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  late Future<_DashboardData> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<_DashboardData> _load() async {
    final api = FutPontosApi();
    final values = await Future.wait<dynamic>([
      api.list('/jogadores'),
      api.list('/goleiros').catchError((_) => <Map<String, dynamic>>[]),
      api.get('/competencias/atual').catchError((_) => <String, dynamic>{}),
    ]);
    return _DashboardData(
      players: values[0] as List<Map<String, dynamic>>,
      goalkeepers: values[1] as List<Map<String, dynamic>>,
      competition: values[2] is Map
          ? Map<String, dynamic>.from(values[2] as Map)
          : <String, dynamic>{},
    );
  }

  Future<void> _refresh() async {
    final next = _load();
    setState(() => _future = next);
    await next;
  }

  int _sum(List<Map<String, dynamic>> players, String key) =>
      players.fold<int>(0, (total, player) =>
          total + (int.tryParse(player[key].toString()) ?? 0));

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _refresh,
      child: FutureBuilder<_DashboardData>(
        future: _future,
        builder: (context, snapshot) {
          final data = snapshot.data;
          final players = data?.players ?? const <Map<String, dynamic>>[];
          // A API já retorna o ranking oficial com os critérios de desempate.
          final ranked = [...players];
          final summary = data?.competition['resumo'] is Map
              ? Map<String, dynamic>.from(data!.competition['resumo'] as Map)
              : <String, dynamic>{};
          final loading = snapshot.connectionState == ConnectionState.waiting;

          return ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(18, 12, 18, 28),
            children: [
              Container(
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(24),
                  gradient: const LinearGradient(
                    colors: [Color(0xFF742326), Color(0xFF21151C)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Expanded(
                          child: Text('CENTRAL DO JOGADOR',
                              style: TextStyle(
                                  color: Color(0xFFFFB5B5),
                                  letterSpacing: 2,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11)),
                        ),
                        IconButton(
                          tooltip: 'Atualizar painel',
                          onPressed: loading ? null : _refresh,
                          icon: const Icon(Icons.refresh, color: Colors.white),
                        ),
                      ],
                    ),
                    Text('Seu futebol.\nSeus números.',
                        style: Theme.of(context).textTheme.headlineMedium
                            ?.copyWith(fontWeight: FontWeight.w900, height: 1.08)),
                    const SizedBox(height: 10),
                    const Text(
                      'Acompanhe a competição, compare desempenhos e veja os destaques.',
                      style: TextStyle(color: Colors.white70, height: 1.4),
                    ),
                    if (data != null) ...[
                      const SizedBox(height: 14),
                      Wrap(
                        spacing: 8,
                        children: [
                          _DashboardTag(
                            icon: Icons.calendar_month_outlined,
                            label: (data.competition['chave'] ?? 'Competência atual').toString(),
                          ),
                          _DashboardTag(
                            icon: Icons.groups_outlined,
                            label: '${summary['jogadores'] ?? players.length} jogadores',
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 22),
              Row(
                children: [
                  Expanded(
                    child: Text('Visão geral',
                        style: Theme.of(context).textTheme.titleLarge
                            ?.copyWith(fontWeight: FontWeight.bold)),
                  ),
                  if (loading)
                    const SizedBox(
                      width: 17,
                      height: 17,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              if (snapshot.hasError && data == null)
                _ErrorPanel(
                  message: 'Não foi possível carregar os indicadores da API.',
                  onRetry: _refresh,
                )
              else if (data == null)
                const Padding(
                  padding: EdgeInsets.all(30),
                  child: Center(child: CircularProgressIndicator()),
                )
              else ...[
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 1.8,
                  children: [
                    _DashboardStat(icon: Icons.groups, label: 'Jogadores',
                        value: (summary['jogadores'] ?? players.length).toString()),
                    _DashboardStat(icon: Icons.stars, label: 'Pontos somados',
                        value: (summary['pontos'] ?? _sum(players, 'pontos')).toString()),
                    _DashboardStat(icon: Icons.sports_soccer, label: 'Gols',
                        value: _sum(players, 'gols').toString()),
                    _DashboardStat(icon: Icons.emoji_events_outlined, label: 'Vitórias',
                        value: _sum(players, 'vitorias').toString()),
                    _DashboardStat(icon: Icons.shield_outlined, label: 'Defesas',
                        value: _sum(players, 'defesa').toString()),
                    _DashboardStat(icon: Icons.warning_amber, label: 'Infrações',
                        value: _sum(players, 'infracoes').toString()),
                  ],
                ),
                const SizedBox(height: 22),
                Row(
                  children: [
                    Expanded(
                      child: Text('Destaques da classificação',
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w800)),
                    ),
                    TextButton(
                      onPressed: () => Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => const Scaffold(
                            appBar: _PageAppBar(title: 'Classificação'),
                            body: DataPage(
                              title: 'Classificação',
                              subtitle: 'Pontuação oficial da competência atual',
                              endpoint: '/jogadores',
                              ranking: true,
                            ),
                          ),
                        ),
                      ),
                      child: const Text('Ver todos'),
                    ),
                  ],
                ),
                if (ranked.isEmpty)
                  const _EmptyPanel(message: 'Ainda não há jogadores nesta competência.')
                else ...[
                  _DashboardLeader(player: ranked.first),
                  const SizedBox(height: 8),
                  for (var i = 1; i < ranked.length && i < 3; i++)
                    _DashboardRankTile(player: ranked[i], position: i + 1),
                ],
                const SizedBox(height: 18),
                const _HomeLink(
                  icon: Icons.groups_outlined,
                  title: 'Jogadores',
                  description: 'Perfis e números individuais',
                  index: 2,
                ),
                const _HomeLink(
                  icon: Icons.insights_outlined,
                  title: 'Desempenho técnico',
                  description: 'Avaliações e indicadores individuais',
                  index: 3,
                ),
                _FeatureNotice(
                  icon: Icons.sports_handball_outlined,
                  title: 'Goleiros',
                  description: '${data.goalkeepers.length} registros disponíveis',
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => const DataPage(
                        title: 'Goleiros',
                        subtitle: 'Classificação e estatísticas',
                        endpoint: '/goleiros',
                        ranking: true,
                        kind: DataPageKind.goalkeepers,
                      ),
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 10),
              const _ApiStatusCard(),
              const SizedBox(height: 6),
              const Text(
                'Os totais são calculados com os registros retornados pela API e representam a competência atual.',
                style: TextStyle(color: Colors.white38, fontSize: 11, height: 1.4),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _DashboardData {
  const _DashboardData({
    required this.players,
    required this.goalkeepers,
    required this.competition,
  });

  final List<Map<String, dynamic>> players;
  final List<Map<String, dynamic>> goalkeepers;
  final Map<String, dynamic> competition;
}

class _DashboardTag extends StatelessWidget {
  const _DashboardTag({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) => DecoratedBox(
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: .2),
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: Colors.white24),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 14, color: Colors.white70),
              const SizedBox(width: 6),
              Text(label, style: const TextStyle(fontSize: 11, color: Colors.white)),
            ],
          ),
        ),
      );
}

class _DashboardStat extends StatelessWidget {
  const _DashboardStat({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(13),
        decoration: BoxDecoration(
          color: const Color(0xFF141A24),
          borderRadius: BorderRadius.circular(17),
          border: Border.all(color: Colors.white.withValues(alpha: .06)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Icon(icon, color: const Color(0xFFFF7777), size: 19),
            Text(value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w900)),
            Text(label, style: const TextStyle(color: Colors.white60, fontSize: 11)),
          ],
        ),
      );
}

class _DashboardLeader extends StatelessWidget {
  const _DashboardLeader({required this.player});

  final Map<String, dynamic> player;

  @override
  Widget build(BuildContext context) {
    final photo = player['foto']?.toString();
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(15),
        child: Row(
          children: [
            CircleAvatar(
              radius: 27,
              backgroundColor: const Color(0x33E53935),
              backgroundImage: photo == null || photo.isEmpty ? null : NetworkImage(photo),
              child: photo == null || photo.isEmpty
                  ? const Icon(Icons.person, color: Color(0xFFFF7777), size: 28)
                  : null,
            ),
            const SizedBox(width: 13),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('1º LUGAR',
                      style: TextStyle(
                          color: Color(0xFFFF7777),
                          fontSize: 10,
                          letterSpacing: 1.4,
                          fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(player['nome']?.toString() ?? 'Jogador',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                  Text(
                    '${player['vitorias'] ?? 0} vitórias • ${player['gols'] ?? 0} gols',
                    style: const TextStyle(color: Colors.white60, fontSize: 11),
                  ),
                ],
              ),
            ),
            Column(
              children: [
                Text((player['pontos'] ?? 0).toString(),
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900)),
                const Text('PONTOS',
                    style: TextStyle(fontSize: 9, color: Colors.white54)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _DashboardRankTile extends StatelessWidget {
  const _DashboardRankTile({required this.player, required this.position});

  final Map<String, dynamic> player;
  final int position;

  @override
  Widget build(BuildContext context) => Card(
        margin: const EdgeInsets.only(bottom: 7),
        child: ListTile(
          dense: true,
          leading: CircleAvatar(
            radius: 16,
            backgroundColor: const Color(0x22E53935),
            child: Text(position.toString(),
                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
          ),
          title: Text(player['nome']?.toString() ?? 'Jogador',
              style: const TextStyle(fontWeight: FontWeight.w700)),
          subtitle: Text(
              '${player['vitorias'] ?? 0} vitórias • ${player['gols'] ?? 0} gols',
              style: const TextStyle(fontSize: 11, color: Colors.white54)),
          trailing: Text('${player['pontos'] ?? 0} pts',
              style: const TextStyle(fontWeight: FontWeight.w900)),
        ),
      );
}

class _PageAppBar extends StatelessWidget implements PreferredSizeWidget {
  const _PageAppBar({required this.title});

  final String title;

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) => AppBar(title: Text(title));
}

class _HomeLink extends StatelessWidget {
  const _HomeLink({
    required this.icon,
    required this.title,
    required this.description,
    required this.index,
  });

  final IconData icon;
  final String title;
  final String description;
  final int index;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: CircleAvatar(
          backgroundColor: const Color(0x22E53935),
          child: Icon(icon, color: const Color(0xFFFF6262)),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: Text(description),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: () {
          final page = switch (index) {
            1 => const DataPage(
                title: 'Classificação',
                subtitle: 'Pontuação oficial da competência atual',
                endpoint: '/jogadores',
                ranking: true,
              ),
            2 => const DataPage(
                title: 'Jogadores',
                subtitle: 'Perfis disponíveis no FutPontos',
                endpoint: '/jogadores',
              ),
            3 => const DataPage(
                title: 'Desempenho',
                subtitle: 'Indicadores e avaliação técnica',
                endpoint: '/desempenho',
                kind: DataPageKind.performance,
              ),
            _ => const HomePage(),
          };
          Navigator.of(context).push(
            MaterialPageRoute<void>(builder: (_) => Scaffold(
              appBar: AppBar(title: Text(title)),
              body: page,
            )),
          );
        },
      ),
    );
  }
}

class _ApiStatusCard extends StatelessWidget {
  const _ApiStatusCard();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<dynamic>(
      future: FutPontosApi().get('/health'),
      builder: (context, snapshot) {
        final online = snapshot.hasData;
        return Card(
          child: ListTile(
            leading: Icon(
              online ? Icons.cloud_done_outlined : Icons.cloud_outlined,
              color: online ? Colors.greenAccent : Colors.orangeAccent,
            ),
            title: const Text('Conexão com o FutPontos'),
            subtitle: Text(snapshot.hasError
                ? 'Não foi possível consultar a API.'
                : online
                    ? 'API e resposta recebida.'
                    : 'Verificando disponibilidade…'),
          ),
        );
      },
    );
  }
}

enum DataPageKind { players, performance, competitions, goalkeepers }

class DataPage extends StatefulWidget {
  const DataPage({
    super.key,
    required this.title,
    required this.subtitle,
    required this.endpoint,
    this.ranking = false,
    this.kind = DataPageKind.players,
  });

  final String title;
  final String subtitle;
  final String endpoint;
  final bool ranking;
  final DataPageKind kind;

  @override
  State<DataPage> createState() => _DataPageState();
}

class _DataPageState extends State<DataPage> {
  late Future<List<Map<String, dynamic>>> _future;
  final TextEditingController _searchController = TextEditingController();
  String _search = '';

  @override
  void initState() {
    super.initState();
    _future = FutPontosApi().list(widget.endpoint);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    final next = FutPontosApi().list(widget.endpoint);
    setState(() => _future = next);
    await next;
  }

  String _value(Map<String, dynamic> item, String key) {
    final value = item[key];
    return value == null || value.toString().isEmpty ? '—' : value.toString();
  }

  Widget _itemCard(Map<String, dynamic> item, int index) {
    if (widget.kind == DataPageKind.competitions) {
      final status = _value(item, 'status');
      return Card(
        margin: const EdgeInsets.only(bottom: 10),
        child: ListTile(
          leading: const CircleAvatar(child: Icon(Icons.calendar_month_outlined)),
          title: Text(_value(item, 'nome'),
              style: const TextStyle(fontWeight: FontWeight.w700)),
          subtitle: Text(
            '${_value(item, 'chave')} • ${status == 'aberta' ? 'Em andamento' : status == 'fechada' ? 'Encerrada' : status} • '
            '${_value(item, 'jogadores')} jogadores',
          ),
          trailing: status == 'aberta'
              ? const Icon(Icons.radio_button_checked, color: Colors.greenAccent)
              : const Icon(Icons.history),
          onTap: item['id'] == null
              ? null
              : () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => DataPage(
                        title: 'Jogadores da competência',
                        subtitle: 'Classificação histórica • ${_value(item, 'chave')}',
                        endpoint: '/competencias/${_value(item, 'id')}/jogadores',
                        ranking: true,
                      ),
                    ),
                  ),
        ),
      );
    }

    if (widget.kind == DataPageKind.performance) {
      final evaluation = item['avaliacao'] is Map
          ? Map<String, dynamic>.from(item['avaliacao'] as Map)
          : <String, dynamic>{};
      String metric(String key) {
        final value = evaluation[key];
        return value == null ? '—' : value.toString();
      }

      return Card(
        margin: const EdgeInsets.only(bottom: 10),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(_value(item, 'nome'),
                        style: const TextStyle(fontWeight: FontWeight.w700)),
                  ),
                  Text('${_value(item, 'pontos')} pts',
                      style: const TextStyle(
                          fontWeight: FontWeight.w900, fontSize: 17)),
                ],
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _MetricChip(label: 'Ataque', value: metric('ataque')),
                  _MetricChip(label: 'Defesa', value: metric('defesa')),
                  _MetricChip(label: 'Velocidade', value: metric('velocidade')),
                  _MetricChip(label: 'Habilidade', value: metric('habilidade')),
                  _MetricChip(label: 'Passe', value: metric('passe')),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Vitórias ${_value(item, 'vitorias')} • Gols ${_value(item, 'gols')} • '
                'Defesas ${_value(item, 'defesaClassificacao')}',
                style: const TextStyle(color: Colors.white60, fontSize: 12),
              ),
            ],
          ),
        ),
      );
    }

    const defenseKey = 'defesa';
    return Card(
      margin: const EdgeInsets.only(bottom: 9),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: const Color(0x22E53935),
          child: Text(
            widget.ranking ? '${index + 1}' : 'FP',
            style: const TextStyle(
                color: Color(0xFFFF7777), fontWeight: FontWeight.bold),
          ),
        ),
        title: Text(_value(item, 'nome'),
            style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: Text(
          'Vitórias ${_value(item, 'vitorias')} • Gols ${_value(item, 'gols')} • '
          'Defesas ${_value(item, defenseKey)}',
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(_value(item, 'pontos'),
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
            const Text('PTS',
                style: TextStyle(fontSize: 9, color: Colors.white54)),
          ],
        ),
        onTap: widget.kind == DataPageKind.players || widget.ranking
            ? () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => PlayerProfilePage(
                      player: item,
                      position: index + 1,
                    ),
                  ),
                )
            : null,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _refresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(18, 12, 18, 24),
        children: [
          Text(widget.title,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                  )),
          const SizedBox(height: 5),
          Text(widget.subtitle,
              style: const TextStyle(color: Colors.white60)),
          const SizedBox(height: 18),
          FutureBuilder<List<Map<String, dynamic>>>(
            future: _future,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Padding(
                  padding: EdgeInsets.all(40),
                  child: Center(child: CircularProgressIndicator()),
                );
              }
              if (snapshot.hasError) {
                return _ErrorPanel(
                  message: 'Não foi possível carregar os dados.',
                  onRetry: _refresh,
                );
              }
              final items = snapshot.data ?? [];
              if (items.isEmpty) {
                return const _EmptyPanel(message: 'Nenhum registro disponível.');
              }
              final filtered = items.where((item) {
                final name = (item['nome'] ?? '').toString().toLowerCase();
                return name.contains(_search.trim().toLowerCase());
              }).toList();
              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _DataSummary(items: items, kind: widget.kind),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _searchController,
                    onChanged: (value) => setState(() => _search = value),
                    decoration: InputDecoration(
                      hintText: 'Buscar jogador pelo nome',
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: _search.isEmpty
                          ? null
                          : IconButton(
                              tooltip: 'Limpar busca',
                              onPressed: () {
                                _searchController.clear();
                                setState(() => _search = '');
                              },
                              icon: const Icon(Icons.close),
                            ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (filtered.isEmpty)
                    const _EmptyPanel(message: 'Nenhum resultado para essa busca.')
                  else
                    for (var i = 0; i < filtered.length; i++)
                      _itemCard(filtered[i], i),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}


class _DataSummary extends StatelessWidget {
  const _DataSummary({required this.items, required this.kind});

  final List<Map<String, dynamic>> items;
  final DataPageKind kind;

  int _sum(String key) => items.fold<int>(
        0,
        (total, item) => total + (int.tryParse((item[key] ?? 0).toString()) ?? 0),
      );

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        _MetricChip(label: 'Registros', value: items.length.toString()),
        if (kind != DataPageKind.competitions) ...[
          _MetricChip(label: 'Pontos', value: _sum('pontos').toString()),
          _MetricChip(label: 'Gols', value: _sum('gols').toString()),
          _MetricChip(label: 'Vitórias', value: _sum('vitorias').toString()),
          _MetricChip(
            label: 'Defesas',
            value: _sum(kind == DataPageKind.performance
                ? 'defesaClassificacao'
                : 'defesa').toString(),
          ),
        ],
      ],
    );
  }
}

class PlayerProfilePage extends StatelessWidget {
  const PlayerProfilePage({
    super.key,
    required this.player,
    required this.position,
  });

  final Map<String, dynamic> player;
  final int position;

  int _number(String key) =>
      int.tryParse((player[key] ?? 0).toString()) ?? 0;

  @override
  Widget build(BuildContext context) {
    final photo = player['foto']?.toString();
    final wins = _number('vitorias');
    final draws = _number('empate');
    final goals = _number('gols');
    final defense = _number('defesa');
    final fouls = _number('infracoes');
    final points = _number('pontos');
    final calculated = wins * 3 + goals * 2 + draws + defense - fouls * 2;

    return Scaffold(
      appBar: AppBar(title: const Text('Perfil do jogador')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Center(
            child: Column(
              children: [
                CircleAvatar(
                  radius: 43,
                  backgroundColor: const Color(0x33E53935),
                  backgroundImage:
                      photo == null || photo.isEmpty ? null : NetworkImage(photo),
                  child: photo == null || photo.isEmpty
                      ? const Icon(Icons.person, size: 44, color: Color(0xFFFF7777))
                      : null,
                ),
                const SizedBox(height: 12),
                Text(
                  (player['nome'] ?? 'Jogador').toString(),
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineSmall
                      ?.copyWith(fontWeight: FontWeight.w900),
                ),
                Text('Posição no ranking: $positionº',
                    style: const TextStyle(color: Colors.white60)),
                if (player['competencia'] != null)
                  Text('Competência ${player['competencia']}',
                      style: const TextStyle(color: Colors.white54, fontSize: 12)),
              ],
            ),
          ),
          const SizedBox(height: 22),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              gradient: const LinearGradient(
                colors: [Color(0xFF742326), Color(0xFF21151C)],
              ),
            ),
            child: Column(
              children: [
                const Text('PONTUAÇÃO ATUAL',
                    style: TextStyle(color: Colors.white70, letterSpacing: 1.5)),
                Text(points.toString(),
                    style: const TextStyle(fontSize: 42, fontWeight: FontWeight.w900)),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Text('Estatísticas da competência',
              style: Theme.of(context).textTheme.titleLarge
                  ?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 1.9,
            children: [
              _DashboardStat(icon: Icons.emoji_events, label: 'Vitórias', value: wins.toString()),
              _DashboardStat(icon: Icons.sports_soccer, label: 'Gols', value: goals.toString()),
              _DashboardStat(icon: Icons.shield, label: 'Defesas', value: defense.toString()),
              _DashboardStat(icon: Icons.handshake_outlined, label: 'Empates', value: draws.toString()),
              _DashboardStat(icon: Icons.warning_amber, label: 'Infrações', value: fouls.toString()),
            ],
          ),
          const SizedBox(height: 18),
          Text('Composição da pontuação',
              style: Theme.of(context).textTheme.titleLarge
                  ?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Card(
            child: Column(
              children: [
                _PointLine(label: 'Vitórias', detail: '$wins × 3', value: '+${wins * 3}'),
                _PointLine(label: 'Gols', detail: '$goals × 2', value: '+${goals * 2}'),
                _PointLine(label: 'Empates', detail: '$draws × 1', value: '+$draws'),
                _PointLine(label: 'Defesas', detail: '$defense × 1', value: '+$defense'),
                _PointLine(label: 'Infrações', detail: '$fouls × -2', value: '-${fouls * 2}'),
                const Divider(height: 1),
                _PointLine(
                  label: 'Total calculado',
                  detail: 'Conferência da regra atual',
                  value: calculated.toString(),
                  strong: true,
                ),
              ],
            ),
          ),
          if (calculated != points)
            const Padding(
              padding: EdgeInsets.only(top: 8),
              child: Text(
                'A composição calculada difere do total recebido da API. O total oficial exibido permanece o valor da API.',
                style: TextStyle(color: Colors.orangeAccent, fontSize: 12),
              ),
            ),
        ],
      ),
    );
  }
}

class _PointLine extends StatelessWidget {
  const _PointLine({
    required this.label,
    required this.detail,
    required this.value,
    this.strong = false,
  });

  final String label;
  final String detail;
  final String value;
  final bool strong;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: TextStyle(fontWeight: strong ? FontWeight.w900 : FontWeight.w600)),
                  Text(detail, style: const TextStyle(color: Colors.white54, fontSize: 11)),
                ],
              ),
            ),
            Text(value,
                style: TextStyle(
                    fontWeight: FontWeight.w900,
                    color: strong ? const Color(0xFFFF7777) : Colors.white)),
          ],
        ),
      );
}

class _MetricChip extends StatelessWidget {
  const _MetricChip({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: const Color(0xFF202632),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text('$label: $value',
          style: const TextStyle(fontSize: 12, color: Colors.white70)),
    );
  }
}

class MorePage extends StatelessWidget {
  const MorePage({super.key});

  void _open(BuildContext context, Widget page) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => page));
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(18),
      children: [
        const Text('Mais áreas',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
        const SizedBox(height: 12),
        _FeatureNotice(
          icon: Icons.sports_handball_outlined,
          title: 'Goleiros',
          description: 'Indicadores e classificação dos goleiros.',
          onTap: () => _open(context, const DataPage(
            title: 'Goleiros',
            subtitle: 'Classificação e estatísticas',
            endpoint: '/goleiros',
            ranking: true,
            kind: DataPageKind.goalkeepers,
          )),
        ),
        _FeatureNotice(
          icon: Icons.groups_2_outlined,
          title: 'Montagem de times',
          description: 'Consulte a montagem atual sem alterar seleções.',
          onTap: () => _open(context, const TeamsPage()),
        ),
        _FeatureNotice(
          icon: Icons.calendar_month_outlined,
          title: 'Competições',
          description: 'Histórico de competências e situação atual.',
          onTap: () => _open(context, const DataPage(
            title: 'Competições',
            subtitle: 'Histórico de competências',
            endpoint: '/competencias',
            kind: DataPageKind.competitions,
          )),
        ),
        const _FeatureNotice(
          icon: Icons.person_outline,
          title: 'Conta e preferências',
          description:
              'A autenticação e o perfil exigem contrato de identidade no backend.',
        ),
      ],
    );
  }
}

class TeamsPage extends StatefulWidget {
  const TeamsPage({super.key});

  @override
  State<TeamsPage> createState() => _TeamsPageState();
}

class _TeamsPageState extends State<TeamsPage> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() async {
    final data = await FutPontosApi().get('/montar-times');
    if (data is! Map) {
      throw const FormatException('Formato inesperado na montagem dos times.');
    }
    return Map<String, dynamic>.from(data);
  }

  Future<void> _refresh() async {
    final next = _load();
    setState(() => _future = next);
    await next;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Montagem de times')),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<Map<String, dynamic>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return ListView(
                children: const [
                  Padding(
                    padding: EdgeInsets.all(48),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                ],
              );
            }
            if (snapshot.hasError) {
              return ListView(
                children: [
                  _ErrorPanel(
                    message: 'Não foi possível carregar a montagem.',
                    onRetry: _refresh,
                  ),
                ],
              );
            }
            final selections = (snapshot.data?['selecoes'] as List<dynamic>?) ?? [];
            if (selections.isEmpty) {
              return ListView(
                children: const [
                  _EmptyPanel(message: 'Ainda não há jogadores selecionados.'),
                ],
              );
            }
            final rows = selections.whereType<Map>().toList();
            final activeTeams = rows.map((item) => item['time_num']).toSet().length;
            final totalPoints = rows.fold<int>(
              0,
              (total, item) =>
                  total + (int.tryParse((item['pontos'] ?? 0).toString()) ?? 0),
            );
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text('Partida: ${snapshot.data?['partida'] ?? 'atual'}'),
                const SizedBox(height: 12),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(13),
                    child: Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _MetricChip(label: 'Selecionados', value: rows.length.toString()),
                        _MetricChip(label: 'Times ativos', value: activeTeams.toString()),
                        _MetricChip(label: 'Pontos distribuídos', value: totalPoints.toString()),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                for (var team = 1; team <= 5; team++)
                  Builder(builder: (context) {
                    final members = rows.where(
                      (item) => item['time_num'] == team,
                    ).toList();
                    if (members.isEmpty) return const SizedBox.shrink();
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text('Time $team',
                                      style: const TextStyle(
                                          fontWeight: FontWeight.bold, fontSize: 17)),
                                ),
                                Text(
                                  members.length.toString() + ' jogadores • ' +
                                      members.fold<int>(
                                        0,
                                        (sum, member) => sum +
                                            (int.tryParse((member['pontos'] ?? 0).toString()) ?? 0),
                                      ).toString() + ' pts',
                                  style: const TextStyle(
                                      color: Colors.white60, fontSize: 11),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            for (final member in members)
                              ListTile(
                                dense: true,
                                contentPadding: EdgeInsets.zero,
                                title: Text(member['nome']?.toString() ?? 'Jogador'),
                                trailing: Text(
                                  '${member['pontos'] ?? 0} pts',
                                  style: const TextStyle(
                                      fontWeight: FontWeight.bold),
                                ),
                              ),
                          ],
                        ),
                      ),
                    );
                  }),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _FeatureNotice extends StatelessWidget {
  const _FeatureNotice({
    required this.icon,
    required this.title,
    required this.description,
    this.onTap,
  });

  final IconData icon;
  final String title;
  final String description;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        onTap: onTap,
        leading: Icon(icon, color: const Color(0xFFFF7777)),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(description),
        trailing: onTap == null ? null : const Icon(Icons.chevron_right),
      ),
    );
  }
}

class _ErrorPanel extends StatelessWidget {
  const _ErrorPanel({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const Icon(Icons.cloud_off_outlined,
                size: 34, color: Colors.orangeAccent),
            const SizedBox(height: 10),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Tentar novamente'),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyPanel extends StatelessWidget {
  const _EmptyPanel({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Center(child: Text(message)),
      ),
    );
  }
}
