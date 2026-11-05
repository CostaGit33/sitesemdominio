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

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
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
              const Text('CENTRAL DO JOGADOR',
                  style: TextStyle(
                      color: Color(0xFFFFB5B5),
                      letterSpacing: 2,
                      fontWeight: FontWeight.bold,
                      fontSize: 11)),
              const SizedBox(height: 12),
              Text('Seu futebol.\nSeus números.',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.w900,
                        height: 1.08,
                      )),
              const SizedBox(height: 10),
              const Text(
                'Acompanhe classificação, perfis e evolução dos jogadores.',
                style: TextStyle(color: Colors.white70, height: 1.4),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Text('Acompanhe o FutPontos',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                )),
        const SizedBox(height: 12),
        const _HomeLink(
            icon: Icons.leaderboard_outlined,
            title: 'Classificação',
            description: 'Posições e pontuação da competição',
            index: 1),
        const _HomeLink(
            icon: Icons.groups_outlined,
            title: 'Jogadores',
            description: 'Consulte os perfis e estatísticas',
            index: 2),
        const _HomeLink(
            icon: Icons.insights_outlined,
            title: 'Desempenho completo',
            description: 'Indicadores e avaliação técnica',
            index: 3),
        const SizedBox(height: 16),
        const _ApiStatusCard(),
      ],
    );
  }
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

  @override
  void initState() {
    super.initState();
    _future = FutPontosApi().list(widget.endpoint);
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

    final defenseKey = widget.kind == DataPageKind.goalkeepers
        ? 'defesa'
        : 'defesa';
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
              return Column(
                children: [
                  for (var i = 0; i < items.length; i++)
                    _itemCard(items[i], i),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
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
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text('Partida: ${snapshot.data?['partida'] ?? 'atual'}'),
                const SizedBox(height: 12),
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
                            Text('Time $team',
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold, fontSize: 17)),
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
